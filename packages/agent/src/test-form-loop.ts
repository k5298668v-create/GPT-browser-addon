import { BrowserTools } from "@localengineer/tools";
import { BrowserPlanner } from "./browser-planner.js";

async function runLoop() {
  const tools = new BrowserTools();
  const planner = new BrowserPlanner();

  console.log("==========================================");
  console.log("    MULTI-STEP AUTOMATION LOOP           ");
  console.log("==========================================");

  const goal = "Fill form and submit";

  // 先打开页面
  await tools.open("http://127.0.0.1:8080/form.html");

  let step = 1;
  let isComplete = false;

  while (!isComplete && step <= 10) {
    console.log(`\n--- [Step ${step}] Taking Snapshot ---`);
    const observation = await tools.snapshot();

    const action = planner.planNextAction(goal, observation);
    console.log(`[Step ${step}] Planned Action:`, action);

    if (action.tool === "type") {
      await tools.type(action.args.selector, action.args.text);
    } else if (action.tool === "click") {
      await tools.click(action.args.selector);
    } else if (action.tool === "complete") {
      console.log("\n✅ Task Finished:", action.args.message);
      isComplete = true;
    }

    step++;
  }
}

runLoop().catch(console.error);
