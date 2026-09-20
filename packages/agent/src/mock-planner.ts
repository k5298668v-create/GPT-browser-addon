import type { ToolCall } from "@localengineer/tools";

export class MockPlanner {
  plan(task: string): ToolCall[] {
    const lower = task.toLowerCase();

    if (lower.includes("example.com")) {
      return [
        {
          name: "browser.open",
          arguments: {
            url: "https://example.com"
          }
        },
        {
          name: "browser.read",
          arguments: {}
        }
      ];
    }

    return [];
  }
}
