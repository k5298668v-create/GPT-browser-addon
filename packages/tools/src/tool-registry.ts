export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const browserToolDefinitions: ToolDefinition[] = [
  {
    name: "browser.open",
    description: "Open a URL in the Brave browser.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to open."
        }
      },
      required: ["url"]
    }
  },
  {
    name: "browser.inspect",
    description:
      "Inspect the current Brave page and return its URL, title, links, buttons, and inputs.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "browser.read",
    description:
      "Read the visible text from the current Brave page.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "browser.clickElement",
    description:
      "Click an inspected element on the current Brave page using its stable element ID.",
    parameters: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The element ID returned by browser.inspect."
        }
      },
      required: ["elementId"]
    }
  },
  {
    name: "browser.type",
    description:
      "Enter text into an input or textarea on the current Brave page.",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Selector for the input element."
        },
        text: {
          type: "string",
          description: "Text to enter."
        }
      },
      required: ["selector", "text"]
    }
  },
  {
    name: "browser.scroll",
    description:
      "Scroll the current Brave page up or down.",
    parameters: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down"]
        },
        amount: {
          type: "number",
          description: "Scroll distance in pixels."
        }
      },
      required: ["direction"]
    }
  }
];

export function getToolDefinitions(): ToolDefinition[] {
  return [...browserToolDefinitions];
}
