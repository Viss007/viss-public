/**
 * Laravel via stdio worker — no loopback HTTP port.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHP_SCRIPT = path.join(__dirname, "laravel-stdio.php");

let seq = 0;
const pending = new Map();
let buffer = "";
let worker = null;

function ensureWorker() {
  if (worker) return worker;
  worker = spawn("php", [PHP_SCRIPT], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  worker.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        const p = pending.get(msg.id);
        if (p) {
          pending.delete(msg.id);
          if (msg.error && !msg.status) {
            p.reject(new Error(msg.error));
          } else {
            p.resolve(msg);
          }
        }
      } catch {
        /* ignore malformed */
      }
    }
  });
  worker.stderr.on("data", (d) => process.stderr.write(`[laravel] ${d}`));
  worker.on("exit", (code) => {
    worker = null;
    for (const [, p] of pending) {
      p.reject(new Error(`laravel worker exited ${code}`));
    }
    pending.clear();
  });
  return worker;
}

function dispatch(payload) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const w = ensureWorker();
    w.stdin.write(`${JSON.stringify({ ...payload, id })}\n`, (err) => {
      if (err) {
        pending.delete(id);
        reject(err);
      }
    });
  });
}

function parseCookies(header) {
  const out = {};
  if (!header || typeof header !== "string") return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export async function handleLaravelRequest(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers[k] = v;
    else if (Array.isArray(v)) headers[k] = v.join(", ");
  }

  const url = req.originalUrl || req.url;
  const msg = await dispatch({
    method: req.method,
    url,
    headers,
    cookies: parseCookies(req.headers.cookie),
    body,
  });

  if (msg.headers) {
    for (const [name, value] of Object.entries(msg.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) res.append(name, v);
      } else if (value != null) {
        res.setHeader(name, value);
      }
    }
  }
  res.status(msg.status || 500);
  res.end(Buffer.from(msg.body || "", "base64"));
}

export function shutdownLaravelWorker() {
  if (worker && !worker.killed) {
    worker.kill("SIGTERM");
    worker = null;
  }
}
