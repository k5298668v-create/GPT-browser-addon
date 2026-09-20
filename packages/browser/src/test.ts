import { BraveBrowser } from "./brave.js";

const browser = new BraveBrowser();

try {
  await browser.connect();

  await browser.open("https://example.com");

  const page = await browser.currentPage();

  console.log("\n--- PAGE INFORMATION ---");
  console.log("URL:", page.url);
  console.log("Title:", page.title);
  console.log("Text:");
  console.log(page.text);

  await browser.screenshot(
    `${process.env.HOME}/LocalEngineer/example.png`
  );

} catch (error) {
  console.error("Browser error:");
  console.error(error);

  process.exitCode = 1;
}
