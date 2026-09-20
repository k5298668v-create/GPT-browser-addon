import { SkillLoader } from "./loader.js";
import { SkillSelector } from "./selector.js";

const loader = new SkillLoader(
  `${process.cwd()}/skills`
);

const skills = await loader.loadAll();
const selector = new SkillSelector();

const tasks = [
  "Open Brave and visit example.com",
  "Run npm tests and fix the error",
  "Check git status and review the diff",
  "Find a file in my Linux project"
];

for (const task of tasks) {
  const selected = selector.select(task, skills);

  console.log(`\nTASK: ${task}`);
  console.log(
    "SKILLS:",
    selected.map((skill) => skill.name).join(", ") || "none"
  );
}
