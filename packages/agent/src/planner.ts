import type { ToolCall } from "@localengineer/tools";

export interface PlannerObservation {
  tool?: string;
  result?: unknown;
}

export type PlannerDecision =
  | {
      type: "action";
      call: ToolCall;
    }
  | {
      type: "done";
    }
  | {
      type: "failed";
      reason: string;
    };

export interface Planner {
  reset(): void;

  plan(
    task: string,
    observation?: PlannerObservation
  ): PlannerDecision;
}
