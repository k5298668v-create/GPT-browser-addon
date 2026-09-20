import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { AgentLoop } from "./agent-loop.js";
import { BrowserPlanner } from "./browser-planner.js";

const browser = new BraveBrowser();

await browser.connect();

try {
  const tools = new ToolRouter(browser);
  const planner = new BrowserPlanner();

  const agent = new AgentLoop(planner, tools);

  await agent.run(
    "Open http://127.0.0.1:8080/form.html, enter my name as Kevin, enter the message Hello LocalEngineer, and click Submit"
  );
} finally {
  await browser.close();
}
