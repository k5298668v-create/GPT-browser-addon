import type { ToolCall } from "@localengineer/tools";

export interface PlannerObservation {
  tool?: string;
  result?: unknown;
}

export class MockPlanner {
  private step = 0;

  reset(): void {
    this.step = 0;
  }

  plan(
    task: string,
    observation?: PlannerObservation
  ): ToolCall | null {
    const lower = task.toLowerCase();

    if (!lower.includes("example.com")) {
      return null;
    }

    if (this.step === 0) {
      this.step++;

      return {
        name: "browser.open",
        arguments: {
          url: "https://example.com"
        }
      };
    }

    if (this.step === 1) {
      this.step++;

      return {
        name: "browser.read",
        arguments: {}
      };
    }

    return null;
  }
}
