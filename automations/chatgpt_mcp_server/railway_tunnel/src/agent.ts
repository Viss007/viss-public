import "dotenv/config";

import { WebSocket } from "ws";
import type { TunnelRequest, TunnelResponse } from "./protocol.js";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return undefined;
}

const serverBase =
  getArg("--server") ||
  process.env.RAILWAY_TUNNEL_SERVER ||
  "";
const token = getArg("--token") || process.env.TUNNEL_TOKEN || "";
const localBase = getArg("--local") || process.env.LOCAL_URL || "http://127.0.0.1:3088";

if (!serverBase) {
  // eslint-disable-next-line no-console
  console.error(
    "Usage: node dist/agent.js --server https://<your>.up.railway.app --token <TUNNEL_TOKEN> [--local http://127.0.0.1:3088]\n" +
    "Or set RAILWAY_TUNNEL_SERVER and TUNNEL_TOKEN in the environment."
  );
  process.exit(2);
}

function toWsUrl(httpsUrl: string): string {
  const u = new URL(httpsUrl);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/tunnel";
  u.search = "";
  u.hash = "";
  return u.toString();
}

function connect(): void {
  const wsUrl = toWsUrl(serverBase.replace(/\/$/, ""));
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const ws = new WebSocket(wsUrl, { headers });

  ws.on("open", () => {
    // eslint-disable-next-line no-console
    console.log(`[railway_tunnel/agent] connected ${wsUrl}`);
  });

  ws.on("message", async (data) => {
    let req: TunnelRequest;
    try {
      req = JSON.parse(data.toString()) as TunnelRequest;
      if (req.v !== 1 || req.type !== "request") return;
    } catch {
      return;
    }

    let out: TunnelResponse;
    try {
      const target = new URL(req.path, localBase.endsWith("/") ? localBase : `${localBase}/`);
      const body =
        req.bodyB64 && req.bodyB64.length > 0 ? Buffer.from(req.bodyB64, "base64") : undefined;

      const initHeaders = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (!v) continue;
        initHeaders.set(k, v);
      }
      initHeaders.set("host", new URL(localBase).host);

      const init: RequestInit = {
        method: req.method,
        headers: initHeaders,
        body: body && !["GET", "HEAD"].includes(req.method.toUpperCase()) ? body : undefined,
      };

      const r = await fetch(target, init);
      const buf = Buffer.from(await r.arrayBuffer());
      const outHeaders: Record<string, string> = {};
      r.headers.forEach((value, key) => {
        const low = key.toLowerCase();
        if (low === "transfer-encoding" || low === "connection") return;
        outHeaders[key] = value;
      });

      out = {
        v: 1,
        type: "response",
        id: req.id,
        status: r.status,
        headers: outHeaders,
        bodyB64: buf.toString("base64"),
      };
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const code = err?.cause && typeof err.cause === "object" && "code" in err.cause
        ? String((err.cause as { code?: string }).code)
        : "";
      const msg = err?.message || "fetch failed";
      const hint =
        code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")
          ? ` Nothing is listening on ${localBase}. Start chatgpt_mcp_server (e.g. node dist/server.js) with the same port as LOCAL_URL before creating the ChatGPT connector.`
          : "";
      const body = `Bad Gateway: ${msg}${code ? ` (${code})` : ""}.${hint}`;
      out = {
        v: 1,
        type: "response",
        id: req.id,
        status: 502,
        headers: { "content-type": "text/plain; charset=utf-8" },
        bodyB64: Buffer.from(body, "utf8").toString("base64"),
      };
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(out));
    }
  });

  ws.on("close", (code, reason) => {
    // eslint-disable-next-line no-console
    console.warn(`[railway_tunnel/agent] disconnected ${code} ${reason.toString()}, reconnecting in 3s...`);
    setTimeout(connect, 3000);
  });

  ws.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[railway_tunnel/agent] socket error", err.message);
  });
}

connect();
