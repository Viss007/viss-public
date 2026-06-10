/**
 * PDF of #about only — text stays selectable in the PDF; Canva may preserve some text on import (not guaranteed).
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(__dirname, "about-export.html")).href;
const out = path.join(__dirname, "vissai-about-for-canva.pdf");

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 3200 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.locator("#about").waitFor({ state: "visible", timeout: 60000 });
  await page.waitForTimeout(1500);

  const box = await page.locator("#about").boundingBox();
  if (!box) throw new Error("#about bounding box missing");

  await page.pdf({
    path: out,
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
    printBackground: true,
    preferCSSPageSize: false,
    width: `${Math.ceil(box.width)}px`,
    height: `${Math.ceil(box.height)}px`,
  });
  await context.close();
  console.log("wrote", path.basename(out));
} finally {
  await browser.close();
}
