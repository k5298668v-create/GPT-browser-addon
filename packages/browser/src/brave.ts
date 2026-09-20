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

    const match = /^(link|button|input)-(\d+)$/.exec(elementId);

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

  async selectOption(
    selector: string,
    value: string
  ): Promise<void> {
    await this.getPage()
      .locator(selector)
      .selectOption(value);
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
    text: string;
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
      value: string;
      checked: boolean;
      label: string;
    }>;
    selects: Array<{
      id: string;
      name: string;
      ariaLabel: string;
      value: string;
      selectedText: string;
      label: string;
      options: Array<{
        value: string;
        text: string;
      }>;
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
            element.getAttribute("aria-label") || "",
          value:
            (element as HTMLInputElement).value || "",
          checked:
            (element as HTMLInputElement).checked,
          label:
            (
              element.id
                ? (
                    element.ownerDocument.querySelector(
                      `label[for="${element.id}"]`
                    )?.textContent ?? ""
                  )
                : ""
            ).trim() ||
            (element.closest("label")?.textContent ?? "").trim()
        }))
    );

    const selects = await page.locator("select").evaluateAll(
      (elements) =>
        elements.map((element, index) => {
          const select = element as HTMLSelectElement;

          return {
            id: `select-${index + 1}`,
            name: select.name || "",
            ariaLabel:
              select.getAttribute("aria-label") || "",
            value: select.value || "",
            selectedText:
              select.selectedOptions[0]?.textContent?.trim() || "",
            label:
              (
                select.id
                  ? (
                      select.ownerDocument.querySelector(
                        `label[for="${select.id}"]`
                      )?.textContent ?? ""
                    )
                  : ""
              ).trim() ||
              (select.closest("label")?.textContent ?? "").trim(),
            options: Array.from(select.options).map(
              (option) => ({
                value: option.value,
                text: option.textContent?.trim() || ""
              })
            )
          };
        })
    );

    return {
      url: page.url(),
      title: await page.title(),
      text: await page.locator("body").innerText(),
      links,
      buttons,
      inputs,
      selects
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

  async back(): Promise<void> {
    const page = this.getPage();

    await page.goBack({
      waitUntil: "domcontentloaded"
    });
  }

  async forward(): Promise<void> {
    const page = this.getPage();

    await page.goForward({
      waitUntil: "domcontentloaded"
    });
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }
}
