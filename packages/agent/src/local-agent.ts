import { BraveBrowser } from "@localengineer/browser";
import { ToolRouter } from "@localengineer/tools";
import {
  SkillLoader,
  SkillSelector,
  type Skill
} from "@localengineer/skills";

export class LocalAgent {
  private skillLoader: SkillLoader;
  private skillSelector: SkillSelector;

  constructor(
    private browser: BraveBrowser,
    private tools: ToolRouter,
    skillsDirectory: string
  ) {
    this.skillLoader = new SkillLoader(skillsDirectory);
    this.skillSelector = new SkillSelector();
  }

  async run(task: string): Promise<void> {
    console.log("\n================================");
    console.log("LOCAL ENGINEER");
    console.log("================================");
    console.log(`Task: ${task}\n`);

    const skills = await this.skillLoader.loadAll();

    const selected = this.skillSelector.select(
      task,
      skills
    );

    if (selected.length === 0) {
      console.log("No matching skills found.");
      return;
    }

    console.log("Skills:");

    for (const skill of selected) {
      console.log(`  ✓ ${skill.name}`);
    }

    console.log();

    await this.executeTask(task, selected);
  }

  private async executeTask(
    task: string,
    skills: Skill[]
  ): Promise<void> {
    const lower = task.toLowerCase();

    const browserSkill = skills.find(
      (skill) => skill.name === "browser"
    );

    if (
      browserSkill &&
      (
        lower.includes("open") ||
        lower.includes("visit") ||
        lower.includes("browse")
      )
    ) {
      const url = this.extractUrl(task);

      if (!url) {
        console.log(
          "Browser skill selected, but no URL was found."
        );
        return;
      }

      console.log(`→ browser.open ${url}`);

      const openResult = await this.tools.execute({
        name: "browser.open",
        arguments: { url }
      });

      console.log("Result:", openResult);
      console.log();

      console.log("→ browser.read");

      const readResult = await this.tools.execute({
        name: "browser.read",
        arguments: {}
      });

      console.log("Result:", readResult);
      console.log();

      console.log("✓ Browser task completed.");
      return;
    }

    console.log(
      "Skill selected, but no local execution strategy exists yet."
    );
  }

  private extractUrl(task: string): string | null {
    const match = task.match(
      /https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?/i
    );

    if (!match) {
      return null;
    }

    let url = match[0];

    if (!url.startsWith("http://") &&
        !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    return url;
  }
}
