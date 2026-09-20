import { getToolDefinitions } from "./tool-registry.js";

const tools = getToolDefinitions();

console.log(`Loaded ${tools.length} tools:\n`);

for (const tool of tools) {
  console.log(`${tool.name}`);
  console.log(`  ${tool.description}`);
  console.log();
}
