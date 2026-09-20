import { SkillLoader } from "./loader.js";

const loader = new SkillLoader(
  `${process.cwd()}/skills`
);

const skills = await loader.loadAll();

console.log(`Loaded ${skills.length} skills:\n`);

for (const skill of skills) {
  console.log(`--- ${skill.name} ---`);
  console.log(skill.instructions);
  console.log();
}
