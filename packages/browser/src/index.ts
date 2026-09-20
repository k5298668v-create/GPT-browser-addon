export interface BrowserConfig {
  cdpPort: number;
}

export class BraveBrowser {
  constructor(private config: BrowserConfig) {}

  async connect(): Promise<void> {
    console.log(
      `Brave browser connection will use CDP port ${this.config.cdpPort}`
    );
  }
}
