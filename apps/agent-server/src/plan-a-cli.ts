import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { AgentLoop } from "@localengineer/agent";
import { BrowserPlanner } from "@localengineer/agent";

const browser = new BraveBrowser();
const tools = new ToolRouter(browser);
const planner = new BrowserPlanner();
const agent = new AgentLoop(planner, tools, 15);

const rl = createInterface({
  input,
  output
});

try {
  await browser.connect();

  console.log("");
  console.log("================================");
  console.log(" LOCAL ENGINEER — PLAN A");
  console.log("================================");
  console.log("Browser connected.");
  console.log("");
  console.log("Enter a task, or type 'exit' to quit.");
  console.log("");

  while (true) {
    const task = (
      await rl.question("local-engineer> ")
    ).trim();

    if (!task) {
      continue;
    }

    if (
      task.toLowerCase() === "exit" ||
      task.toLowerCase() === "quit"
    ) {
      break;
    }

    try {
      await agent.run(task);
    } catch (error) {
      console.error(
        "Agent error:",
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    console.log("");
  }
} finally {
  rl.close();
  await browser.close();
}

console.log("Goodbye.");
