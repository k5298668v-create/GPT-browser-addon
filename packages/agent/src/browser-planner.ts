import type {
  Planner,
  PlannerDecision,
  PlannerObservation
} from "./planner.js";

interface InspectLink {
  id: string;
  text: string;
  href: string;
}

interface InspectInput {
  id: string;
  type: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
}

interface InspectResult {
  success: boolean;
  output?: {
    url: string;
    title: string;
    links: InspectLink[];
    buttons: Array<{
      id: string;
      text: string;
    }>;
    inputs: InspectInput[];
  };
  error?: string;
}

interface TypeAction {
  target: string;
  text: string;
}

export class BrowserPlanner implements Planner {
  private step = 0;

  private wantsRead = false;
  private wantsClick = false;
  private wantsType = false;
  private wantsScroll = false;

  private targetText = "";

  private typeActions: TypeAction[] = [];
  private typeIndex = 0;

  private scrollDirection: "up" | "down" = "down";
  private scrollAmount = 700;

  reset(): void {
    this.step = 0;

    this.wantsRead = false;
    this.wantsClick = false;
    this.wantsType = false;
    this.wantsScroll = false;

    this.targetText = "";

    this.typeActions = [];
    this.typeIndex = 0;

    this.scrollDirection = "down";
    this.scrollAmount = 700;
  }

  plan(
    task: string,
    observation?: PlannerObservation
  ): PlannerDecision {
    const lower = task.toLowerCase();

    this.wantsRead =
      lower.includes("read") ||
      lower.includes("inspect") ||
      lower.includes("look at");

    this.wantsClick = lower.includes("click");

    this.wantsType =
      lower.includes("type") ||
      lower.includes("enter") ||
      lower.includes("fill");

    this.wantsScroll = lower.includes("scroll");

    if (this.wantsClick) {
      this.targetText = this.extractClickTarget(task);
    }

    if (this.wantsType && this.typeActions.length === 0) {
      this.typeActions = this.extractTypeActions(task);
    }

    if (this.wantsScroll) {
      this.scrollDirection =
        lower.includes("up") ? "up" : "down";

      const amountMatch =
        lower.match(/(\d+)\s*(?:px|pixels)?/);

      if (amountMatch) {
        this.scrollAmount = Number(amountMatch[1]);
      }
    }

    /*
     * Step 1: open the requested URL.
     */
    if (this.step === 0) {
      const url = this.extractUrl(task);

      if (!url) {
        return {
          type: "failed",
          reason: "No URL found in task."
        };
      }

      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.open",
          arguments: {
            url
          }
        }
      };
    }

    /*
     * Form workflow:
     *
     * open
     *   ↓
     * inspect
     *   ↓
     * type field
     *   ↓
     * inspect
     *   ↓
     * type next field
     *   ↓
     * inspect
     *   ↓
     * click button
     */
    if (this.wantsType && this.step === 1) {
      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.inspect",
          arguments: {}
        }
      };
    }

    /*
     * After a type action, inspect before locating
     * the next field.
     */
    if (
      this.wantsType &&
      this.typeIndex > 0 &&
      this.typeIndex < this.typeActions.length &&
      observation?.tool === "browser.type"
    ) {
      return {
        type: "action",
        call: {
          name: "browser.inspect",
          arguments: {}
        }
      };
    }

    /*
     * Use inspection to locate and type the next field.
     */
    if (
      this.wantsType &&
      this.typeIndex < this.typeActions.length &&
      observation?.tool === "browser.inspect"
    ) {
      const inspection =
        observation.result as InspectResult | undefined;

      const inputs = inspection?.output?.inputs ?? [];
      const action = this.typeActions[this.typeIndex];

      if (!action) {
        return {
          type: "failed",
          reason: "No remaining type action."
        };
      }

      const target = inputs.find((input) => {
        const haystack = [
          input.name,
          input.placeholder,
          input.ariaLabel,
          input.type
        ]
          .join(" ")
          .toLowerCase();

        return (
          haystack.includes(action.target.toLowerCase()) ||
          input.name.toLowerCase() ===
            action.target.toLowerCase()
        );
      });

      if (!target) {
        return {
          type: "failed",
          reason:
            `Could not find input "${action.target}".`
        };
      }

      this.typeIndex++;

      let selector: string;

      if (target.name) {
        selector =
          target.type === "textarea"
            ? `textarea[name="${target.name}"]`
            : `input[name="${target.name}"]`;
      } else if (target.placeholder) {
        selector =
          target.type === "textarea"
            ? `textarea[placeholder="${target.placeholder}"]`
            : `input[placeholder="${target.placeholder}"]`;
      } else {
        return {
          type: "failed",
          reason:
            `Input "${action.target}" has no usable selector.`
        };
      }

      return {
        type: "action",
        call: {
          name: "browser.type",
          arguments: {
            selector,
            text: action.text
          }
        }
      };
    }

    /*
     * Once all fields are typed, inspect before clicking.
     */
    if (
      this.wantsType &&
      this.wantsClick &&
      this.typeIndex >= this.typeActions.length &&
      observation?.tool === "browser.type"
    ) {
      return {
        type: "action",
        call: {
          name: "browser.inspect",
          arguments: {}
        }
      };
    }

    /*
     * After typing, click the requested button.
     */
    if (
      this.wantsClick &&
      this.wantsType &&
      this.typeIndex >= this.typeActions.length &&
      observation?.tool === "browser.inspect"
    ) {
      const inspection =
        observation.result as InspectResult | undefined;

      const buttons = inspection?.output?.buttons ?? [];

      const target = buttons.find(
        (button) =>
          button.text
            .trim()
            .toLowerCase()
            .includes(this.targetText.toLowerCase())
      );

      if (!target) {
        return {
          type: "failed",
          reason:
            `Could not find button "${this.targetText}".`
        };
      }

      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.clickElement",
          arguments: {
            elementId: target.id
          }
        }
      };
    }

    /*
     * Click-only workflow.
     */
    if (
      this.wantsClick &&
      !this.wantsType &&
      this.step === 1
    ) {
      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.inspect",
          arguments: {}
        }
      };
    }

    if (
      this.wantsClick &&
      !this.wantsType &&
      this.step === 2
    ) {
      const inspection =
        observation?.result as InspectResult | undefined;

      const links = inspection?.output?.links ?? [];

      const target = links.find(
        (link) =>
          link.text
            .trim()
            .toLowerCase()
            .includes(this.targetText.toLowerCase())
      );

      if (!target) {
        return {
          type: "failed",
          reason:
            `Could not find link "${this.targetText}".`
        };
      }

      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.clickElement",
          arguments: {
            elementId: target.id
          }
        }
      };
    }

    /*
     * Verify navigation after a click.
     */
    if (
      this.wantsClick &&
      !this.wantsType &&
      this.step === 3
    ) {
      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.inspect",
          arguments: {}
        }
      };
    }

    /*
     * Read workflow.
     */
    if (
      this.wantsRead &&
      !this.wantsClick &&
      !this.wantsType &&
      this.step === 1
    ) {
      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.read",
          arguments: {}
        }
      };
    }

    /*
     * Scroll workflow.
     */
    if (
      this.wantsScroll &&
      !this.wantsClick &&
      !this.wantsType &&
      this.step === 1
    ) {
      this.step++;

      return {
        type: "action",
        call: {
          name: "browser.scroll",
          arguments: {
            direction: this.scrollDirection,
            amount: this.scrollAmount
          }
        }
      };
    }

    return {
      type: "done"
    };
  }

  private extractUrl(task: string): string | null {
    const match = task.match(
      /https?:\/\/[^\s"'<>]+/i
    );

    if (!match) {
      return null;
    }

    return match[0].replace(/[),.!?]+$/, "");
  }

  private extractClickTarget(task: string): string {
    const match = task.match(
      /click\s+(?:the\s+)?["']?(.+?)["']?(?:\s+link|\s+button)?(?:\s*$)/i
    );

    if (!match) {
      return "";
    }

    return match[1]
      .replace(/^the\s+/i, "")
      .replace(/\s+link$/i, "")
      .replace(/\s+button$/i, "")
      .trim();
  }

  private extractTypeActions(task: string): TypeAction[] {
    const actions: TypeAction[] = [];

    const fieldPattern =
      /(?:enter|type|fill)\s+(?:my\s+|the\s+)?(name|message)\s+(?:(?:as|with)\s+)?(.+?)(?=,\s*(?:(?:and\s+)?(?:enter|type|fill)\b|(?:and\s+)?click\b)|\s+and\s+(?:enter|type|fill)\b|\s+and\s+click\b|$)/gi;

    let match: RegExpExecArray | null;

    while ((match = fieldPattern.exec(task)) !== null) {
      const target = match[1].toLowerCase();
      const text = match[2].trim();

      if (!text) {
        continue;
      }

      actions.push({
        target,
        text
      });
    }

    return actions;
  }
}
