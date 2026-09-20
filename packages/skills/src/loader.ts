import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Skill {
  name: string;
  path: string;
  instructions: string;
}

export class SkillLoader {
  constructor(private skillsDirectory: string) {}

  async loadAll(): Promise<Skill[]> {
    const entries = await readdir(this.skillsDirectory, {
      withFileTypes: true
    });

    const skills: Skill[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = join(
        this.skillsDirectory,
        entry.name,
        "SKILL.md"
      );

      try {
        const instructions = await readFile(
          skillPath,
          "utf8"
        );

        skills.push({
          name: entry.name,
          path: skillPath,
          instructions
        });
      } catch {
        // Directory doesn't contain SKILL.md.
      }
    }

    return skills;
  }

  async load(name: string): Promise<Skill | null> {
    const skillPath = join(
      this.skillsDirectory,
      name,
      "SKILL.md"
    );

    try {
      const instructions = await readFile(
        skillPath,
        "utf8"
      );

      return {
        name,
        path: skillPath,
        instructions
      };
    } catch {
      return null;
    }
  }
}
