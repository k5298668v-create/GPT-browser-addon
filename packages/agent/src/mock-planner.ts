import type { ToolCall } from "@localengineer/tools";

export interface PlannerObservation {
  tool?: string;
  result?: unknown;
}

interface InspectResult {
  success: boolean;
  output?: {
    url: string;
    title: string;
    links: Array<{
      text: string;
      href: string;
    }>;
    buttons: string[];
    inputs: Array<{
      type: string;
      name: string;
      placeholder: string;
      ariaLabel: string;
    }>;
  };
  error?: string;
}

export class MockPlanner {
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

    // For a read task, inspect first, then read.
    if (!this.wantsClick && this.step === 1) {
      this.step++;

      return {
        name: "browser.read",
        arguments: {}
      };
    }

    // For a click task, inspect the page before choosing a selector.
    if (this.wantsClick && this.step === 1) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    // Use the actual inspection result to find "Learn more".
    if (this.wantsClick && this.step === 2) {
      const inspection = observation?.result as InspectResult | undefined;

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
        name: "browser.click",
        arguments: {
          selector: `a[href="${learnMore.href}"]`
        }
      };
    }

    // Verify the result after clicking.
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
