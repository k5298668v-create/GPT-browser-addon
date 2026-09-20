import type { ToolCall } from "@localengineer/tools";
import type {
  Planner,
  PlannerDecision,
  PlannerObservation
} from "./planner.js";

interface InspectResult {
  success: boolean;
  output?: {
    url: string;
    title: string;

    links: Array<{
      id: string;
      text: string;
      href: string;
    }>;

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

export class MockPlanner implements Planner {
  private step = 0;
  private wantsClick = false;

  reset(): void {
    this.step = 0;
    this.wantsClick = false;
  }

  plan(
    task: string,
    observation?: PlannerObservation
  ): PlannerDecision {
    const lower = task.toLowerCase();

    if (!lower.includes("example.com")) {
      return {
        type: "failed",
        reason: "MockPlanner only supports example.com tasks."
      };
    }

    this.wantsClick =
      lower.includes("click") &&
      lower.includes("learn more");

    // Step 1: open the requested site.
    if (this.step === 0) {
      this.step++;

      const call: ToolCall = {
        name: "browser.open",
        arguments: {
          url: "https://example.com"
        }
      };

      return {
        type: "action",
        call
      };
    }

    // Read task.
    if (!this.wantsClick && this.step === 1) {
      this.step++;

      const call: ToolCall = {
        name: "browser.read",
        arguments: {}
      };

      return {
        type: "action",
        call
      };
    }

    // Click task: inspect before choosing an element.
    if (this.wantsClick && this.step === 1) {
      this.step++;

      const call: ToolCall = {
        name: "browser.inspect",
        arguments: {}
      };

      return {
        type: "action",
        call
      };
    }

    // Find "Learn more" from the inspection result.
    if (this.wantsClick && this.step === 2) {
      const inspection =
        observation?.result as InspectResult | undefined;

      const links = inspection?.output?.links ?? [];

      const learnMore = links.find(
        (link) =>
          link.text.trim().toLowerCase() === "learn more"
      );

      if (!learnMore) {
        return {
          type: "failed",
          reason: "Could not find the Learn more link."
        };
      }

      this.step++;

      const call: ToolCall = {
        name: "browser.clickElement",
        arguments: {
          elementId: learnMore.id
        }
      };

      return {
        type: "action",
        call
      };
    }

    // Verify navigation after clicking.
    if (this.wantsClick && this.step === 3) {
      this.step++;

      const call: ToolCall = {
        name: "browser.inspect",
        arguments: {}
      };

      return {
        type: "action",
        call
      };
    }

    // Nothing else to do.
    return {
      type: "done"
    };
  }
}
