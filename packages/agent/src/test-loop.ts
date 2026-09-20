import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { AgentLoop } from "./agent-loop.js";
import { MockPlanner } from "./mock-planner.js";

const browser = new BraveBrowser();

await browser.connect();

try {
  const tools = new ToolRouter(browser);
  const planner = new MockPlanner();

  const loop = new AgentLoop(
    planner,
    tools
  );

  await loop.run(
    "Open example.com and read the page"
  );
} finally {
  await browser.close();
}
