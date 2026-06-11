/**
 * Docs-agent demo: viewport capture (edge-to-edge app) + injected cursor, ripples, zoom.
 * No desktop watermark, no browser chrome, no OS ugly pointer, no Cursor RecordScreen.
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
const W = 1920;
const H = 1080;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function injectDemoChrome(page) {
  await page.addStyleTag({
    content: `
      html, body, * { cursor: none !important; }
      #demo-cursor {
        position: fixed; left: 0; top: 0; width: 24px; height: 24px;
        border: 2.5px solid #dc2626; border-radius: 50%; pointer-events: none;
        z-index: 2147483647; transform: translate(-50%, -50%);
        box-shadow: 0 0 0 8px rgba(220,38,38,0.16), 0 2px 12px rgba(0,0,0,0.12);
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }
      #demo-cursor.is-down {
        transform: translate(-50%, -50%) scale(0.8);
        box-shadow: 0 0 0 14px rgba(220,38,38,0.3), 0 2px 12px rgba(0,0,0,0.15);
      }
      .demo-ripple {
        position: fixed; width: 16px; height: 16px; border-radius: 50%;
        border: 2.5px solid rgba(220,38,38,0.75); pointer-events: none;
        z-index: 2147483646; transform: translate(-50%, -50%) scale(1);
        animation: demo-ripple 0.6s ease-out forwards;
      }
      @keyframes demo-ripple {
        to { transform: translate(-50%, -50%) scale(5); opacity: 0; }
      }
      .demo-zoom-target {
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        transform-origin: center center;
      }
      .demo-zoom-active { transform: scale(1.08); }
    `,
  });
  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;
    const c = document.createElement("div");
    c.id = "demo-cursor";
    document.body.appendChild(c);
    window.__moveDemoCursor = (x, y) => {
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
    };
    window.__clickDemoCursor = (x, y) => {
      c.classList.add("is-down");
      const r = document.createElement("div");
      r.className = "demo-ripple";
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      document.body.appendChild(r);
      setTimeout(() => {
        c.classList.remove("is-down");
        r.remove();
      }, 600);
    };
  });
}

async function moveCursor(page, x, y, steps = 30) {
  const box = await page.evaluate(() => {
    const r = document.documentElement.getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  await page.mouse.move(x, y, { steps });
  await page.evaluate(
    ({ px, py }) => window.__moveDemoCursor?.(px, py),
    { px: x, py: y }
  );
}

async function focusZoom(page, locator) {
  const handle = await locator.elementHandle();
  if (!handle) return;
  const box = await locator.boundingBox();
  await page.evaluate(
    ({ el, cx, cy }) => {
      const target =
        el.closest("section") || el.closest(".rounded-2xl") || el.parentElement;
      document.querySelectorAll(".demo-zoom-active").forEach((n) =>
        n.classList.remove("demo-zoom-active")
      );
      if (target) target.classList.add("demo-zoom-target", "demo-zoom-active");
      const main = document.querySelector("main");
      if (main) {
        main.style.transformOrigin = `${cx}px ${cy}px`;
        main.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
        main.style.transform = "scale(1.07)";
      }
    },
    { el: handle, cx: box?.x ?? W / 2, cy: box?.y ?? H / 2 }
  );
  await sleep(500);
}

async function clearZoom(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".demo-zoom-active").forEach((n) =>
      n.classList.remove("demo-zoom-active")
    );
    const main = document.querySelector("main");
    if (main) main.style.transform = "";
  });
}

async function polishedClick(page, locator) {
  await clearZoom(page);
  await locator.scrollIntoViewIfNeeded({ timeout: 15000 }).catch(() => {});
  await sleep(200);
  await focusZoom(page, locator);
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click();
    return;
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await moveCursor(page, x, y);
  await sleep(300);
  await page.mouse.down();
  await page.evaluate(
    ({ px, py }) => window.__clickDemoCursor?.(px, py),
    { px: x, py: y }
  );
  await sleep(100);
  await page.mouse.up();
  await sleep(350);
  await clearZoom(page);
}

async function polishedFill(page, locator, text) {
  await polishedClick(page, locator);
  await locator.fill("");
  await sleep(150);
  await locator.type(text, { delay: 50 });
  await sleep(450);
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: VIDEO_DIR, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await injectDemoChrome(page);
  await moveCursor(page, W / 2, H * 0.35);
  await sleep(2200);

  await polishedClick(
    page,
    page.getByRole("button", { name: /Sample invoice 1/i })
  );
  await sleep(1600);

  await polishedClick(
    page,
    page.getByRole("button", { name: /Process invoices/i })
  );
  await page.getByText("Review and export", { timeout: 120000 }).waitFor();
  await page.locator("#results-section").scrollIntoViewIfNeeded({ timeout: 15000 }).catch(() => {});
  await focusZoom(page, page.locator("#results-section"));
  await sleep(2600);
  await clearZoom(page);

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
  await sleep(2800);

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
      "18",
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
