import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { MockPlanner } from "./mock-planner.js";

export class LocalAgent {
  private planner: MockPlanner;

  constructor(
    private browser: BraveBrowser,
    private tools: ToolRouter
  ) {
    this.planner = new MockPlanner();
  }

  async run(task: string): Promise<void> {
    console.log("\n================================");
    console.log("LocalEngineer");
    console.log("================================");
    console.log(`Task: ${task}\n`);

    const plan = this.planner.plan(task);

    if (plan.length === 0) {
      console.log("No plan available.");
      return;
    }

    for (const call of plan) {
      console.log(`→ Tool: ${call.name}`);
      console.log(`  Arguments:`, call.arguments);

      const result = await this.tools.execute(call);

      console.log("  Result:", result);
      console.log();
    }

    console.log("✓ Task completed");
  }
}
