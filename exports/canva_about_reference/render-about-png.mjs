/**
 * Rasterizes portfolio #about clone for upload to Canva (Uploads tab).
 * Uses Playwright chromium; assumes network access for CDN fonts/Tailwind.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "about-export.html");
const url = pathToFileURL(htmlPath).href;

const widths = [
  { w: 1920, out: "vissai-about-for-canva-1920.png" },
  { w: 1440, out: "vissai-about-for-canva-1440.png" },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const { w, out } of widths) {
    const context = await browser.newContext({
      viewport: { width: w, height: 2400 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator("#about").waitFor({ state: "visible", timeout: 60000 });
    await page.waitForTimeout(1500);
    const loc = page.locator("#about");
    await loc.screenshot({
      path: path.join(__dirname, out),
      type: "png",
    });
    await context.close();
    console.log("wrote", out);
  }
} finally {
  await browser.close();
}
