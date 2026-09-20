import { BraveBrowser } from "@localengineer/browser";
import { BrowserTools } from "./browser-tools.js";
import {
  getToolDefinitions,
  type ToolDefinition
} from "./tool-registry.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export class ToolRouter {
  private browserTools: BrowserTools;

  constructor(browser: BraveBrowser) {
    this.browserTools = new BrowserTools(browser);
  }

  getDefinitions(): ToolDefinition[] {
    return getToolDefinitions();
  }

  async execute(call: ToolCall): Promise<unknown> {
    switch (call.name) {
      case "browser.inspect":
        return this.browserTools.inspect();

      case "browser.back":
        return this.browserTools.back();

      case "browser.forward":
        return this.browserTools.forward();

      case "browser.open":
        return this.browserTools.open(
          String(call.arguments.url)
        );

      case "browser.read":
        return this.browserTools.read();

      case "browser.clickElement":
        return this.browserTools.clickElement(
          String(call.arguments.elementId)
        );

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
