import type { ToolCall } from "@localengineer/tools";
import type { Planner, PlannerObservation } from "./planner.js";

interface InspectLink {
  id: string;
  text: string;
  href: string;
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
    inputs: Array<{
      id: string;
      type: string;
      name: string;
      placeholder: string;
      ariaLabel: string;
    }>;
  };
  error?: string;
}

/**
 * Basic local browser planner.
 *
 * This is intentionally deterministic.
 * It gives us a stable planner implementation that can later
 * be replaced by an LLM without changing AgentLoop or ToolRouter.
 */
export class BrowserPlanner implements Planner {
  private step = 0;
  private wantsRead = false;
  private wantsClick = false;
  private targetText = "";

  reset(): void {
    this.step = 0;
    this.wantsRead = false;
    this.wantsClick = false;
    this.targetText = "";
  }

  plan(
    task: string,
    observation?: PlannerObservation
  ): ToolCall | null {
    const lower = task.toLowerCase();

    this.wantsRead =
      lower.includes("read") ||
      lower.includes("inspect") ||
      lower.includes("look at");

    this.wantsClick = lower.includes("click");

    if (this.wantsClick) {
      this.targetText = this.extractClickTarget(task);
    }

    /*
     * Step 1:
     * Find a URL in the user's task.
     */
    if (this.step === 0) {
      const url = this.extractUrl(task);

      if (!url) {
        console.log("Planner: No URL found in task.");
        return null;
      }

      this.step++;

      return {
        name: "browser.open",
        arguments: {
          url
        }
      };
    }

    /*
     * Click workflow:
     *
     * open
     *   ↓
     * inspect
     *   ↓
     * find matching element
     *   ↓
     * clickElement
     *   ↓
     * inspect
     */
    if (this.wantsClick && this.step === 1) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    if (this.wantsClick && this.step === 2) {
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
        console.log(
          `Planner: Could not find link "${this.targetText}".`
        );

        return null;
      }

      this.step++;

      return {
        name: "browser.clickElement",
        arguments: {
          elementId: target.id
        }
      };
    }

    if (this.wantsClick && this.step === 3) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    /*
     * Read workflow:
     *
     * open
     *   ↓
     * read
     */
    if (this.wantsRead && this.step === 1) {
      this.step++;

      return {
        name: "browser.read",
        arguments: {}
      };
    }

    return null;
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
      /click\s+(?:the\s+)?["']?(.+?)["']?(?:\s+link|\s+button)?$/i
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
}
