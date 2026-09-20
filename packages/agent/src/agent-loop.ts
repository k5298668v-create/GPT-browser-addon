import type { ToolCall, ToolRouter } from "@localengineer/tools";
import type {
  Planner,
  PlannerObservation
} from "./planner.js";

export class AgentLoop {
  constructor(
    private planner: Planner,
    private tools: ToolRouter,
    private maxSteps = 10
  ) {}

  async run(task: string): Promise<void> {
    console.log("\n================================");
    console.log("AGENT LOOP");
    console.log("================================");
    console.log(`Task: ${task}\n`);

    this.planner.reset();

    let observation: PlannerObservation | undefined;

    for (let step = 1; step <= this.maxSteps; step++) {
      console.log(`--- Step ${step} ---`);

      const call: ToolCall | null =
        this.planner.plan(task, observation);

      if (!call) {
        console.log("✓ Planner finished.");
        return;
      }

      console.log(`→ ${call.name}`);
      console.log(
        "Arguments:",
        JSON.stringify(call.arguments)
      );

      const result = await this.tools.execute(call);

      console.log("Observation:");
      console.dir(result, { depth: null });
      console.log();

      observation = {
        tool: call.name,
        result
      };
    }

    console.log(
      `Stopped after ${this.maxSteps} steps.`
    );
  }
}
