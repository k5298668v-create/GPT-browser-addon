import { LocalEngineerAgent } from "@localengineer/agent";

const agent = new LocalEngineerAgent({
  model: process.env.OPENAI_MODEL || "gpt-5"
});

const message = process.argv.slice(2).join(" ");

if (!message) {
  console.log("Usage:");
  console.log(
    'npm run dev --workspace=@localengineer/agent-server -- "Your question"'
  );
  process.exit(1);
}

try {
  console.log("Thinking...\n");

  const answer = await agent.ask(message);

  console.log("LocalEngineer:");
  console.log(answer);
} catch (error) {
  console.error("\nAgent error:");
  console.error(error);
  process.exit(1);
}
