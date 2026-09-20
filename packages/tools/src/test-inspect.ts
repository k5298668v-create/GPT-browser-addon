import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "./router.js";

const browser = new BraveBrowser();

await browser.connect();

try {
  const tools = new ToolRouter(browser);

  console.log("\n[TOOL] browser.open");

  console.log(
    await tools.execute({
      name: "browser.open",
      arguments: {
        url: "https://example.com"
      }
    })
  );

  console.log("\n[TOOL] browser.inspect");

  console.dir(
    await tools.execute({
      name: "browser.inspect",
      arguments: {}
    }),
    { depth: null }
  );
} finally {
  await browser.close();
}
