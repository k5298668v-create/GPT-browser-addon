import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import { LocalAgent } from "@localengineer/agent";

const browser = new BraveBrowser();

await browser.connect();

const tools = new ToolRouter(browser);

const agent = new LocalAgent(
  browser,
  tools
);

const task =
  process.argv.slice(2).join(" ") ||
  "Open example.com and read the page";

await agent.run(task);
