import type { Skill } from "./loader.js";

export class SkillSelector {
  select(task: string, skills: Skill[]): Skill[] {
    const text = task.toLowerCase();

    const selected: Skill[] = [];

    const add = (name: string) => {
      const skill = skills.find((s) => s.name === name);

      if (skill && !selected.includes(skill)) {
        selected.push(skill);
      }
    };

    if (
      /browser|brave|web|website|webpage|click|type|search|open.*url/i.test(
        text
      )
    ) {
      add("browser");
    }

    if (
      /code|coding|program|npm|node|typescript|javascript|python|bug|error|implement|fix/i.test(
        text
      )
    ) {
      add("coding");
    }

    if (
      /test|testing|spec|verify|validation/i.test(text)
    ) {
      add("testing");
    }

    if (
      /git|commit|branch|merge|push|pull|repository|repo|diff/i.test(
        text
      )
    ) {
      add("git");
    }

    if (
      /linux|terminal|shell|file|folder|directory|process|package|apt|system/i.test(
        text
      )
    ) {
      add("linux");
    }

    return selected;
  }
}
