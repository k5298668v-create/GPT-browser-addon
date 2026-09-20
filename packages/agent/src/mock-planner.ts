import type { ToolCall } from "@localengineer/tools";
import type { Planner, PlannerObservation } from "./planner.js";

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
  ): ToolCall | null {
    const lower = task.toLowerCase();

    if (!lower.includes("example.com")) {
      return null;
    }

    this.wantsClick =
      lower.includes("click") &&
      lower.includes("learn more");

    // Step 1: open the requested site.
    if (this.step === 0) {
      this.step++;

      return {
        name: "browser.open",
        arguments: {
          url: "https://example.com"
        }
      };
    }

    // Read task.
    if (!this.wantsClick && this.step === 1) {
      this.step++;

      return {
        name: "browser.read",
        arguments: {}
      };
    }

    // Click task: inspect before choosing an element.
    if (this.wantsClick && this.step === 1) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    // Find "Learn more" from the inspection result.
    if (this.wantsClick && this.step === 2) {
      const inspection =
        observation?.result as InspectResult | undefined;

      const links = inspection?.output?.links ?? [];

      const learnMore = links.find(
        (link) =>
          link.text.toLowerCase() === "learn more"
      );

      if (!learnMore) {
        console.log(
          "Planner: Could not find the Learn more link."
        );

        return null;
      }

      this.step++;

      return {
        name: "browser.clickElement",
        arguments: {
          elementId: learnMore.id
        }
      };
    }

    // Verify navigation after clicking.
    if (this.wantsClick && this.step === 3) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    return null;
  }
}
