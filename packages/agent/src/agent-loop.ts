import type { ToolRouter } from "@localengineer/tools";
import type {
  Planner,
  PlannerObservation
} from "./planner.js";

export class AgentLoop {
  constructor(
    private planner: Planner,
    private tools: ToolRouter,
    private maxSteps = 15
  ) {}

  async run(task: string): Promise<boolean> {
    console.log("\n================================");
    console.log("AGENT LOOP");
    console.log("================================");
    console.log(`Task: ${task}\n`);

    this.planner.reset();

    let observation: PlannerObservation | undefined;

    for (let step = 1; step <= this.maxSteps; step++) {
      console.log(`--- Step ${step} ---`);

      const decision =
        this.planner.plan(task, observation);

      if (decision.type === "done") {
        console.log("✓ Task completed.");
        return true;
      }

      if (decision.type === "failed") {
        console.log(
          `✗ Task failed: ${decision.reason}`
        );
        return false;
      }

      const call = decision.call;

      console.log(`→ ${call.name}`);
      console.log(
        "Arguments:",
        JSON.stringify(call.arguments)
      );

      let result: unknown;
      let attempts = 0;
      const maxRetries = 2;

      while (true) {
        try {
          result = await this.tools.execute(call);

          const failed =
            typeof result === "object" &&
            result !== null &&
            "success" in result &&
            (result as { success?: unknown }).success === false;

          if (!failed || attempts >= maxRetries) {
            break;
          }

          attempts++;

          console.log(
            `⚠ Tool failed. Retrying (${attempts}/${maxRetries})...`
          );
        } catch (error) {
          if (attempts >= maxRetries) {
            result = {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : String(error)
            };

            break;
          }

          attempts++;

          console.log(
            `⚠ Tool threw an error. Retrying (${attempts}/${maxRetries})...`
          );
        }
      }

      console.log("Observation:");
      console.dir(result, { depth: null });
      console.log();

      observation = {
        tool: call.name,
        result
      };
    }

    console.log(
      `✗ Task stopped after ${this.maxSteps} steps.`
    );

    return false;
  }
}
