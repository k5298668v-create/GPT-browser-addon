import { chromium, type Browser, type Page } from "playwright";

export class BraveBrowser {
  private browser?: Browser;

  async connect(): Promise<void> {
    this.browser = await chromium.connectOverCDP(
      "http://127.0.0.1:9222"
    );

    console.log("✓ Connected to Brave");
  }

  private getPage(): Page {
    if (!this.browser) {
      throw new Error("Browser is not connected.");
    }

    const contexts = this.browser.contexts();

    if (contexts.length === 0) {
      throw new Error("No browser context found.");
    }

    const pages = contexts[0].pages();

    if (pages.length === 0) {
      throw new Error("No browser page found.");
    }

    return pages[pages.length - 1];
  }

  async open(url: string): Promise<{
    url: string;
    title: string;
  }> {
    const page = this.getPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded"
    });

    return {
      url: page.url(),
      title: await page.title()
    };
  }

  async read(): Promise<string> {
    return this.getPage().locator("body").innerText();
  }

  async click(selector: string): Promise<void> {
    await this.getPage().locator(selector).click();
  }

  async type(selector: string, text: string): Promise<void> {
    await this.getPage().locator(selector).fill(text);
  }

  async screenshot(path: string): Promise<void> {
    await this.getPage().screenshot({
      path,
      fullPage: true
    });
  }

  async currentPage() {
    const page = this.getPage();

    return {
      url: page.url(),
      title: await page.title(),
      text: await this.read()
    };
  }
}
