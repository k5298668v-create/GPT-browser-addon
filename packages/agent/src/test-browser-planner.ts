import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { AgentLoop } from "./agent-loop.js";
import { BrowserPlanner } from "./browser-planner.js";

const browser = new BraveBrowser();

await browser.connect();

try {
  const tools = new ToolRouter(browser);
  const planner = new BrowserPlanner();

  const agent = new AgentLoop(
    planner,
    tools
  );

  await agent.run(
    "Open https://example.com and click the Learn more link"
  );
} finally {
  await browser.close();
}
