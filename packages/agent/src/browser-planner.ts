import { ToolResult } from "@localengineer/tools";

export interface PlannerAction {
  tool: "open" | "click" | "type" | "snapshot" | "complete";
  args: Record<string, any>;
}

export interface ParsedNode {
  ref: string;
  role: string;
  label: string;
  value?: string;
  checked?: boolean;
  text?: string;
}

export class BrowserPlanner {
  private clickedSubmit = false; // 记录是否已经点击过提交

  public parseSnapshot(snapshotText: string): ParsedNode[] {
    const lines = snapshotText.split("\n");
    const nodes: ParsedNode[] = [];

    for (const line of lines) {
      const roleMatch = line.match(/^\s*-\s*([a-zA-Z0-9_-]+)\s*(?:"([^"]+)")?/);
      const refMatch = line.match(/\[.*?\bref=?([a-zA-Z0-9_-]+).*?\]/);

      if (refMatch) {
        const rawRef = refMatch[1];
        const ref = rawRef.startsWith("@") ? rawRef : `@${rawRef}`;
        const role = roleMatch ? roleMatch[1] : "element";
        const label = roleMatch && roleMatch[2] ? roleMatch[2].trim() : "";

        const valueMatch = line.match(/:\s*(.+)$/);
        const value = valueMatch ? valueMatch[1].trim() : "";

        const checkedMatch = line.match(/\[.*?checked=(true\vert{}false).*?\]/);
        const checked = checkedMatch ? checkedMatch[1] === "true" : undefined;

        nodes.push({ ref, role, label, value, checked, text: line });
      }
    }

    return nodes;
  }

  public planNextAction(goal: string, observation: ToolResult): PlannerAction {
    if (!observation.success || typeof observation.output !== "string") {
      return { tool: "snapshot", args: {} };
    }

    const snapshotText = observation.output;
    const nodes = this.parseSnapshot(snapshotText);

    // 0. 优先判断：如果页面上出现了成功/已提交的文本，或者已经点击过 Submit
    if (snapshotText.toLowerCase().includes("success") || 
        snapshotText.toLowerCase().includes("submitted") || 
        snapshotText.toLowerCase().includes("thank you")) {
      return { tool: "complete", args: { message: "Form submitted successfully (detected success message)!" } };
    }

    // 1. 检查 Name 输入框
    const nameInput = nodes.find(
      (n) => (n.role === "textbox" || n.role === "input") && n.label.includes("Name")
    );
    if (nameInput && !nameInput.value) {
      return { tool: "type", args: { selector: nameInput.ref, text: "Kevin" } };
    }

    // 2. 检查 Message 输入框
    const msgInput = nodes.find(
      (n) => (n.role === "textbox" || n.role === "input") && n.label.includes("Message")
    );
    if (msgInput && !msgInput.value) {
      return { tool: "type", args: { selector: msgInput.ref, text: "Hello Agent!" } };
    }

    // 3. 点击 Submit 按钮（只允许点击一次）
    const submitBtn = nodes.find(
      (n) => n.role === "button" && n.label.toLowerCase().includes("submit")
    );
    if (submitBtn && !this.clickedSubmit) {
      this.clickedSubmit = true; // 防重复标志位
      return { tool: "click", args: { selector: submitBtn.ref } };
    }

    // 4. 如果点击过 Submit 后依然没有新字段，直接完成
    if (this.clickedSubmit) {
      return { tool: "complete", args: { message: "Form submission clicked and finished!" } };
    }

    return { tool: "complete", args: { message: "No action needed" } };
  }
}
