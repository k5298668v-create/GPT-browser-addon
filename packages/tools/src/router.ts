import { BraveBrowser } from "@localengineer/browser";
import { BrowserTools } from "./browser-tools.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export class ToolRouter {
  private browserTools: BrowserTools;

  constructor(browser: BraveBrowser) {
    this.browserTools = new BrowserTools(browser);
  }

  async execute(call: ToolCall): Promise<unknown> {
    switch (call.name) {
      case "browser.inspect":
        return this.browserTools.inspect();

      case "browser.open":
        return this.browserTools.open(
          String(call.arguments.url)
        );

      case "browser.read":
        return this.browserTools.read();

      case "browser.click":
        return this.browserTools.click(
          String(call.arguments.selector)
        );

      case "browser.scroll":
        return this.browserTools.scroll(
          String(call.arguments.direction) as "up" | "down",
          Number(call.arguments.amount ?? 700)
        );

      case "browser.type":
        return this.browserTools.type(
          String(call.arguments.selector),
          String(call.arguments.text)
        );

      default:
        return {
          success: false,
          error: `Unknown tool: ${call.name}`
        };
    }
  }
}
