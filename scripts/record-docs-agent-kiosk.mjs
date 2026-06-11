/**
 * Docs-agent demo: Playwright viewport video only (no desktop, no browser chrome, no Cursor watermark).
 */
import { spawnSync } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  ROOT,
  "website-templates/public/videos/demos/docs-agent.mp4"
);
const VIDEO_DIR = "/tmp/docs-agent-viewport-video";
const APP_URL = "http://127.0.0.1:3000/";
const VIEWPORT = { width: 1920, height: 1080 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await sleep(2800);

  await page.getByRole("button", { name: /Sample invoice 1/i }).click();
  await sleep(2200);

  const processBtn = page.getByRole("button", { name: /Process invoices/i });
  await processBtn.waitFor({ state: "visible" });
  await processBtn.click();
  await page.getByText("Review and export", { timeout: 120000 }).waitFor();
  await page.locator("#results-section").scrollIntoViewIfNeeded();
  await sleep(3200);

  const notes = page.locator("#preview-body textarea").last();
  if (await notes.count()) {
    await notes.click();
    await notes.fill("Approved for export");
    await sleep(2000);
  }

  const downloadPromise = page
    .waitForEvent("download", { timeout: 30000 })
    .catch(() => null);
  await page.getByRole("button", { name: /Export to Excel/i }).click();
  await downloadPromise;
  await sleep(3500);

  const video = page.video();
  await context.close();
  await browser.close();

  const webm = await video.path();
  const convert = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      webm,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      OUT,
    ],
    { encoding: "utf8" }
  );
  if (convert.status !== 0) {
    throw new Error(convert.stderr || "ffmpeg convert failed");
  }

  const probe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size",
      "-of",
      "default=noprint_wrappers=1",
      OUT,
    ],
    { encoding: "utf8" }
  );
  console.log(probe.stdout.trim());
  console.log(`Saved ${OUT}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
