import type { Skill } from "./loader.js";

export class SkillSelector {
  select(task: string, skills: Skill[]): Skill[] {
    const text = task.toLowerCase();

    const selected: Skill[] = [];

    const add = (name: string) => {
      const skill = skills.find(
        (skill) => skill.name === name
      );

      if (skill && !selected.includes(skill)) {
        selected.push(skill);
      }
    };

    const browserWords = [
      "browser",
      "brave",
      "web",
      "website",
      "webpage",
      "click",
      "type",
      "search",
      "open",
      "visit",
      "navigate",
      "url"
    ];

    const codingWords = [
      "code",
      "coding",
      "program",
      "npm",
      "node",
      "typescript",
      "javascript",
      "python",
      "bug",
      "error",
      "implement",
      "fix"
    ];

    const testingWords = [
      "test",
      "testing",
      "tests",
      "spec",
      "verify",
      "validation"
    ];

    const gitWords = [
      "git",
      "commit",
      "branch",
      "merge",
      "push",
      "pull",
      "repository",
      "repo",
      "diff"
    ];

    const linuxWords = [
      "linux",
      "terminal",
      "shell",
      "file",
      "folder",
      "directory",
      "process",
      "package",
      "apt",
      "system"
    ];

    const containsAny = (words: string[]) =>
      words.some((word) => text.includes(word));

    if (containsAny(browserWords)) {
      add("browser");
    }

    if (containsAny(codingWords)) {
      add("coding");
    }

    if (containsAny(testingWords)) {
      add("testing");
    }

    if (containsAny(gitWords)) {
      add("git");
    }

    if (containsAny(linuxWords)) {
      add("linux");
    }

    return selected;
  }
}
