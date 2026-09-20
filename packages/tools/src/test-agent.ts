import { BraveBrowser } from "@localengineer/browser";
import { BrowserTools } from "./browser-tools.js";

const browser = new BraveBrowser();
const tools = new BrowserTools(browser);

try {
  await browser.connect();

  console.log("\n[TOOL] browser.open");
  console.log(
    await tools.open("https://example.com")
  );

  console.log("\n[TOOL] browser.read");
  const result = await tools.read();

  console.log(result);

} catch (error) {
  console.error("Agent error:", error);
  process.exitCode = 1;
}
