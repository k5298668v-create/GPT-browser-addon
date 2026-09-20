import { BraveBrowser } from "@localengineer/browser";

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export class BrowserTools {
  constructor(private browser: BraveBrowser) {}

  async open(url: string): Promise<ToolResult> {
    try {
      const result = await this.browser.open(url);

      return {
        success: true,
        output: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async read(): Promise<ToolResult> {
    try {
      const text = await this.browser.read();

      return {
        success: true,
        output: text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async inspect(): Promise<ToolResult> {
    try {
      const result = await this.browser.inspect();

      return {
        success: true,
        output: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : String(error)
      };
    }
  }

  async scroll(
    direction: "up" | "down",
    amount = 700
  ): Promise<ToolResult> {
    try {
      await this.browser.scroll(direction, amount);

      return {
        success: true,
        output: `Scrolled ${direction} by ${amount}px`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : String(error)
      };
    }
  }

  async clickElement(elementId: string): Promise<ToolResult> {
    try {
      await this.browser.clickElement(elementId);

      return {
        success: true,
        output: `Clicked ${elementId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : String(error)
      };
    }
  }

  async click(selector: string): Promise<ToolResult> {
    try {
      await this.browser.click(selector);

      return {
        success: true,
        output: `Clicked ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async type(selector: string, text: string): Promise<ToolResult> {
    try {
      await this.browser.type(selector, text);

      return {
        success: true,
        output: `Typed into ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
