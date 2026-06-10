/**
 * Public hire-me site — single Node process, single port (default 3333).
 * Static files + WebSocket live reload. No viss-workspace / vissai_platform upstreams.
 */
import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { killListenProcessesOnPort } from "./free-port.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

dotenv.config({ path: path.join(ROOT, ".env") });

const HOST = (process.env.HOST || "127.0.0.1").trim() || "127.0.0.1";

function hostForLocalUrl() {
  return HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
}

const envPortRaw = process.env.PORT;
let startPort =
  envPortRaw != null && String(envPortRaw).trim() !== ""
    ? Number(envPortRaw)
    : 3333;
if (!Number.isFinite(startPort) || startPort < 1 || startPort > 65535) {
  startPort = 3333;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded.replace(/^\/+/, "") || "index.html";
  const abs = path.resolve(path.join(ROOT, rel));
  const root = path.resolve(ROOT);
  const relToRoot = path.relative(root, abs);
  if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) return null;
  return abs;
}

function serveStatic(absPath, res) {
  fs.stat(absPath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(absPath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(absPath).pipe(res);
  });
}

const clients = new Set();
let reloadTimer = null;

function broadcastReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    const msg = JSON.stringify({ type: "reload" });
    for (const c of clients) {
      if (c.readyState === 1) c.send(msg);
    }
    console.log(
      "[public] file change → reload broadcast (" + clients.size + " client(s))"
    );
  }, 120);
}

function shouldWatch(filename) {
  if (!filename) return false;
  const lower = filename.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("node_modules")) return false;
  if (lower.endsWith("package-lock.json")) return false;
  return /\.(html|css|js|mjs|json|svg|ico|png|jpe?g|webp|woff2?)$/i.test(filename);
}

function isDevServerSource(filename) {
  if (!filename) return false;
  const lower = filename.replace(/\\/g, "/").toLowerCase();
  return lower.endsWith("dev-server.mjs");
}

let rootWatcher = null;
let selfRestartTimer = null;
let selfRestarting = false;

function scheduleSelfRestart() {
  if (selfRestarting) return;
  if (selfRestartTimer) clearTimeout(selfRestartTimer);
  selfRestartTimer = setTimeout(() => {
    selfRestartTimer = null;
    selfRestarting = true;
    console.log("[public] dev-server.mjs changed → restarting process…");
    const script = path.join(ROOT, "dev-server.mjs");
    try {
      if (rootWatcher) rootWatcher.close();
    } catch {
      /* ignore */
    }
    rootWatcher = null;
    try {
      wss.clients.forEach((c) => {
        try {
          c.close();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
    wss.close(() => {
      server.close(() => {
        const child = spawn(process.execPath, [script], {
          cwd: ROOT,
          env: process.env,
          stdio: "inherit",
          windowsHide: false,
        });
        child.on("error", (err) => {
          console.error("[public] respawn failed:", err.message);
          process.exit(1);
        });
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(0), 4000);
  }, 450);
}

function startFileWatchers() {
  try {
    rootWatcher = fs.watch(ROOT, { recursive: true }, (event, filename) => {
      if (isDevServerSource(filename)) {
        scheduleSelfRestart();
        return;
      }
      if (shouldWatch(filename)) broadcastReload();
    });
  } catch (e) {
    console.warn(
      "[public] fs.watch recursive not available; hot reload disabled:",
      e.message
    );
  }
}

const server = http.createServer((req, res) => {
  void (async () => {
    try {
      const u = new URL(req.url || "/", `http://${hostForLocalUrl()}:${startPort}`);
      const p = u.pathname;

      const hireMeIndex = path.join(ROOT, "index.html");
      const liveProjectsHtml = path.join(ROOT, "live-projects.html");
      const websitesHtml = path.join(ROOT, "websites.html");
      const contactHtml = path.join(ROOT, "contact.html");
      const agentsHtml = path.join(ROOT, "agents.html");
      const hubHtml = path.join(ROOT, "hub.html");
      const aboutHtml = path.join(ROOT, "about.html");
      const mediaHtml = path.join(ROOT, "media.html");
      const isLegacyHireMePath = p === "/hire-me" || p === "/hire%20me";

      if (p === "/") {
        res.writeHead(302, { Location: "/about" });
        res.end();
        return;
      }
      if (p === "/about" || p === "/about/") {
        serveStatic(aboutHtml, res);
        return;
      }
      if (p === "/index.html") {
        serveStatic(hireMeIndex, res);
        return;
      }
      if (p === "/live-projects.html") {
        serveStatic(liveProjectsHtml, res);
        return;
      }
      if (p === "/websites.html") {
        serveStatic(websitesHtml, res);
        return;
      }
      if (p === "/contact.html") {
        serveStatic(contactHtml, res);
        return;
      }
      if (p === "/agents.html") {
        serveStatic(agentsHtml, res);
        return;
      }
      if (p === "/hub.html") {
        serveStatic(hubHtml, res);
        return;
      }
      if (p === "/media" || p === "/media/") {
        serveStatic(mediaHtml, res);
        return;
      }
      if (p === "/about.html") {
        res.writeHead(302, { Location: "/about" });
        res.end();
        return;
      }
      if (p === "/media.html") {
        res.writeHead(302, { Location: "/media" });
        res.end();
        return;
      }
      if (isLegacyHireMePath) {
        res.writeHead(302, { Location: "/#hire-me" });
        res.end();
        return;
      }

      if (p === "/__dev/client.js") {
        serveStatic(path.join(ROOT, "dev-client.js"), res);
        return;
      }

      const abs = safeResolve(p);
      if (abs) {
        fs.stat(abs, (err, st) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
            return;
          }
          if (st.isDirectory()) {
            const idx = path.join(abs, "index.html");
            fs.access(idx, fs.constants.R_OK, (e2) => {
              if (!e2) serveStatic(idx, res);
              else {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Not found");
              }
            });
            return;
          }
          if (st.isFile()) {
            serveStatic(abs, res);
            return;
          }
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
        });
        return;
      }

      res.writeHead(400).end("Bad path");
    } catch (e) {
      const msg = e && typeof e.message === "string" ? e.message : String(e);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(msg);
      }
    }
  })();
});

const wss = new WebSocketServer({ server, path: "/__dev/ws" });

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (data.type === "log" && typeof data.line === "string") {
      const hasClientTs = /^\[\d{2}:\d{2}:\d{2}\.\d{3}\]\s/.test(data.line);
      const out = hasClientTs
        ? data.line
        : "[" + new Date().toISOString().slice(11, 23) + "] " + data.line;
      if (data.isErr) console.error(out);
      else console.log(out);
    }
  });
});

function listenOnce() {
  return new Promise((resolve, reject) => {
    const onErr = (err) => {
      server.off("error", onErr);
      reject(err);
    };
    server.once("error", onErr);
    server.listen(startPort, HOST, () => {
      server.off("error", onErr);
      resolve();
    });
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listenAfterFreeingPort() {
  for (let attempt = 0; attempt < 2; attempt++) {
    const killed = killListenProcessesOnPort(startPort);
    if (killed.length) {
      console.log(
        "[public] port " +
          startPort +
          " was in use — stopped PID(s): " +
          killed.join(", ")
      );
      await delay(350);
    }
    try {
      await listenOnce();
      return;
    } catch (err) {
      if (err.code === "EADDRINUSE" && attempt === 0) continue;
      throw err;
    }
  }
}

listenAfterFreeingPort()
  .then(() => {
    const logHost = hostForLocalUrl();
    console.log("");
    console.log("  Public site (single runtime)");
    console.log("  http://" + logHost + ":" + startPort + "/");
    if (HOST === "0.0.0.0") {
      console.log(
        "  Same Wi‑Fi / LAN: http://<this-PC-IPv4>:" +
          startPort +
          "/  (ipconfig → IPv4; allow firewall if prompted)"
      );
    }
    console.log("  Hot reload: static files → browser refresh; dev-server.mjs → process restart");
    console.log("");
    startFileWatchers();
  })
  .catch((err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        "[public] EADDRINUSE " +
          HOST +
          ":" +
          startPort +
          " — could not free the port (another process may have re-bound or needs admin)."
      );
    } else {
      console.error("[public] listen failed:", err.message || err);
    }
    process.exitCode = 1;
  });
