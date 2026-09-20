import type { ToolCall } from "@localengineer/tools";

export interface PlannerObservation {
  tool?: string;
  result?: unknown;
}

export interface Planner {
  reset(): void;

  plan(
    task: string,
    observation?: PlannerObservation
  ): ToolCall | null;
}
