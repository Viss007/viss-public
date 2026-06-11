/**
 * Docs-agent demo: borderless app window (fullscreen from frame 1) + ffmpeg cursor.
 */
import { spawn, spawnSync } from "child_process";
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
const RAW = "/tmp/docs-agent-cursor-raw.mp4";
const APP_URL = "http://127.0.0.1:3000/";
const DISPLAY = process.env.DISPLAY || ":1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function polishedClick(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click();
    return;
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 28 });
  await sleep(350);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
  await sleep(250);
}

async function polishedFill(page, locator, text) {
  await polishedClick(page, locator);
  await locator.fill("");
  await sleep(200);
  await locator.type(text, { delay: 55 });
  await sleep(400);
}

function focusAppWindow() {
  for (const cls of ["chromium", "google-chrome"]) {
    spawnSync("xdotool", [
      "search",
      "--onlyvisible",
      "--class",
      cls,
      "windowmove",
      "0",
      "0",
    ]);
    spawnSync("xdotool", [
      "search",
      "--onlyvisible",
      "--class",
      cls,
      "windowsize",
      "1920",
      "1080",
    ]);
    spawnSync("xdotool", [
      "search",
      "--onlyvisible",
      "--class",
      cls,
      "windowactivate",
    ]);
  }
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  spawnSync("pkill", ["-f", "chromium.*127.0.0.1:3000"]);
  spawnSync("pkill", ["-f", "chrome.*127.0.0.1:3000"]);
  await sleep(400);

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      `--app=${APP_URL}`,
      "--window-position=0,0",
      "--window-size=1920,1080",
      "--disable-infobars",
      "--no-first-run",
    ],
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  focusAppWindow();
  await sleep(1200);

  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-f",
      "x11grab",
      "-draw_mouse",
      "1",
      "-video_size",
      "1920x1080",
      "-framerate",
      "30",
      "-i",
      `${DISPLAY}+0,0`,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      RAW,
    ],
    { stdio: ["pipe", "ignore", "pipe"] }
  );

  await sleep(800);
  await sleep(1800);

  await polishedClick(
    page,
    page.getByRole("button", { name: /Sample invoice 1/i })
  );
  await sleep(1800);

  await polishedClick(
    page,
    page.getByRole("button", { name: /Process invoices/i })
  );
  await page.getByText("Review and export", { timeout: 120000 }).waitFor();
  await page.locator("#results-section").scrollIntoViewIfNeeded();
  await sleep(2800);

  const notes = page.locator("#preview-body textarea").last();
  if (await notes.count()) {
    await polishedFill(page, notes, "Approved for export");
  }

  const downloadPromise = page
    .waitForEvent("download", { timeout: 30000 })
    .catch(() => null);
  await polishedClick(
    page,
    page.getByRole("button", { name: /Export to Excel/i })
  );
  await downloadPromise;
  await sleep(3200);

  await browser.close();

  ff.stdin.write("q");
  await new Promise((resolve) => ff.on("close", resolve));

  if (!fs.existsSync(RAW) || fs.statSync(RAW).size < 10000) {
    throw new Error("ffmpeg capture failed");
  }

  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      RAW,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      OUT,
    ],
    { stdio: "inherit" }
  );

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
