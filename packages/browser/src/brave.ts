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

  async clickElement(elementId: string): Promise<void> {
    const page = this.getPage();

    const match = /^(link|button|input)-(\\d+)$/.exec(elementId);

    if (!match) {
      throw new Error(`Invalid element ID: ${elementId}`);
    }

    const [, type, indexText] = match;
    const index = Number(indexText) - 1;

    if (index < 0) {
      throw new Error(`Invalid element index: ${elementId}`);
    }

    const selector =
      type === "link"
        ? "a"
        : type === "button"
          ? "button"
          : "input, textarea";

    const elements = page.locator(selector);
    const count = await elements.count();

    if (index >= count) {
      throw new Error(`Element not found: ${elementId}`);
    }

    await elements.nth(index).click();
  }

  async click(selector: string): Promise<void> {
    await this.getPage().locator(selector).click();
  }

  async type(
    selector: string,
    text: string
  ): Promise<void> {
    await this.getPage().locator(selector).fill(text);
  }

  async scroll(
    direction: "up" | "down",
    amount = 700
  ): Promise<void> {
    const page = this.getPage();

    const distance =
      direction === "down"
        ? amount
        : -amount;

    await page.mouse.wheel(0, distance);
  }

  async screenshot(path: string): Promise<void> {
    await this.getPage().screenshot({
      path,
      fullPage: true
    });
  }

  async inspect(): Promise<{
    url: string;
    title: string;
    links: Array<{
      id: string;
      text: string;
      href: string;
    }>;
    buttons: Array<{
      id: string;
      text: string;
    }>;
    inputs: Array<{
      id: string;
      type: string;
      name: string;
      placeholder: string;
      ariaLabel: string;
    }>;
  }> {
    const page = this.getPage();

    const links = await page.locator("a").evaluateAll(
      (elements) =>
        elements
          .map((element, index) => ({
            id: `link-${index + 1}`,
            text: (element.textContent ?? "").trim(),
            href: (element as HTMLAnchorElement).href
          }))
          .filter((link) => link.text || link.href)
    );

    const buttons = await page.locator("button").evaluateAll(
      (elements) =>
        elements
          .map((element, index) => ({
            id: `button-${index + 1}`,
            text: (element.textContent ?? "").trim()
          }))
          .filter((button) => button.text)
    );

    const inputs = await page.locator("input, textarea").evaluateAll(
      (elements) =>
        elements.map((element, index) => ({
          id: `input-${index + 1}`,
          type:
            (element as HTMLInputElement).type ||
            element.tagName.toLowerCase(),
          name: (element as HTMLInputElement).name || "",
          placeholder:
            (element as HTMLInputElement).placeholder || "",
          ariaLabel:
            element.getAttribute("aria-label") || ""
        }))
    );

    return {
      url: page.url(),
      title: await page.title(),
      links,
      buttons,
      inputs
    };
  }


  async currentPage() {
    const page = this.getPage();

    return {
      url: page.url(),
      title: await page.title(),
      text: await this.read()
    };
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }
}
