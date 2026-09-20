import { execSync } from "child_process";

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export class BrowserTools {
  // 不再强依赖 BraveBrowser 实例，直接通过 agent-browser CLI 驱动
  constructor() {}

  private runCmd(cmd: string): string {
    return execSync(cmd, { encoding: "utf-8" }).trim();
  }

  async open(url: string): Promise<ToolResult> {
    try {
      const output = this.runCmd(`npx agent-browser open "${url}"`);
      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 替代原有的 inspect()，获取 agent-browser 语义树快照（带有 @e1, @e2 等 ref）
  async snapshot(): Promise<ToolResult> {
    try {
      const output = this.runCmd(`npx agent-browser snapshot`);
      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 点击元素：支持 ref（如 "@e2"）、CSS 选择器或自然文本
  async click(selectorOrRef: string): Promise<ToolResult> {
    try {
      const output = this.runCmd(`npx agent-browser click "${selectorOrRef}"`);
      return {
        success: true,
        output: `Clicked ${selectorOrRef}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 兼容旧接口 clickElement，直接映射到 agent-browser click
  async clickElement(elementId: string): Promise<ToolResult> {
    return this.click(elementId);
  }

  // 填表/输入文本
  async type(selectorOrRef: string, text: string): Promise<ToolResult> {
    try {
      const output = this.runCmd(`npx agent-browser fill "${selectorOrRef}" "${text}"`);
      return {
        success: true,
        output: `Typed "${text}" into ${selectorOrRef}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 后退
  async back(): Promise<ToolResult> {
    try {
      this.runCmd(`npx agent-browser back`);
      return { success: true, output: "Navigated back" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 前进
  async forward(): Promise<ToolResult> {
    try {
      this.runCmd(`npx agent-browser forward`);
      return { success: true, output: "Navigated forward" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
