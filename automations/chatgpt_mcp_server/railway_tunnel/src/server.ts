import "dotenv/config";
import http from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import type { TunnelRequest, TunnelResponse } from "./protocol.js";
import { parseTunnelMessage } from "./protocol.js";

const TOKEN = process.env.TUNNEL_TOKEN ?? "";
const PORT = Number(process.env.PORT ?? 8080);
const TUNNEL_PATH = process.env.TUNNEL_WS_PATH ?? "/tunnel";
const MAX_BODY_BYTES = Number(process.env.TUNNEL_MAX_BODY_MB ?? 20) * 1024 * 1024;
const REQUEST_TIMEOUT_MS = Number(process.env.TUNNEL_REQUEST_TIMEOUT_MS ?? 120_000);

let agent: WebSocket | null = null;
const pending = new Map<
  string,
  { resolve: (r: TunnelResponse) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }
>();

function verifyTunnelToken(req: http.IncomingMessage): boolean {
  const devOpen = process.env.NODE_ENV !== "production" && !TOKEN;
  if (devOpen) return true;
  if (!TOKEN) return false;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ") && auth.slice(7) === TOKEN) return true;
  try {
    const u = new URL(req.url ?? "/", "http://localhost");
    return u.searchParams.get("token") === TOKEN;
  } catch {
    return false;
  }
}

function rejectAllPending(reason: string): void {
  for (const [id, p] of pending) {
    clearTimeout(p.timer);
    pending.delete(id);
    p.reject(new Error(reason));
  }
}

const app = express();
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  const connected = agent !== null && agent.readyState === WebSocket.OPEN;
  res.json({ ok: true, agent_connected: connected });
});

app.use(express.raw({ type: "*/*", limit: MAX_BODY_BYTES }));

// Express 5 / path-to-regexp v8: bare "*" is invalid; use a terminal middleware as catch-all.
app.use(async (req, res) => {
  if (!agent || agent.readyState !== WebSocket.OPEN) {
    res.status(503).type("text/plain").send("Tunnel agent not connected. Start the local agent.");
    return;
  }

  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

  const id = randomUUID();
  const hdrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    const lower = k.toLowerCase();
    if (lower === "connection" || lower === "keep-alive" || lower === "transfer-encoding" || lower === "upgrade") {
      continue;
    }
    hdrs[k] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  const xfp = req.headers["x-forwarded-proto"];
  hdrs["x-forwarded-proto"] = typeof xfp === "string" ? xfp : "https";

  const tunnelReq: TunnelRequest = {
    v: 1,
    type: "request",
    id,
    method: req.method || "GET",
    path: req.originalUrl || req.url || "/",
    headers: hdrs,
    bodyB64: body.length > 0 ? body.toString("base64") : null,
  };

  try {
    const tunnelRes = await new Promise<TunnelResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("timeout"));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      agent!.send(JSON.stringify(tunnelReq));
    });

    for (const [k, v] of Object.entries(tunnelRes.headers)) {
      if (k.toLowerCase() === "transfer-encoding") continue;
      res.setHeader(k, v);
    }
    res.status(tunnelRes.status);
    res.end(Buffer.from(tunnelRes.bodyB64, "base64"));
  } catch {
    res.status(504).type("text/plain").send("Tunnel timeout or agent error");
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  let pathname = "/";
  try {
    pathname = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname;
  } catch {
    socket.destroy();
    return;
  }
  if (pathname !== TUNNEL_PATH) {
    socket.destroy();
    return;
  }
  if (!verifyTunnelToken(request)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    if (agent) {
      try {
        agent.close(4000, "replaced");
      } catch {
        /* ignore */
      }
    }
    agent = ws;

    ws.on("message", (data) => {
      const text = data.toString();
      const msg = parseTunnelMessage(text);
      if (!msg || msg.type !== "response") return;
      const entry = pending.get(msg.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(msg.id);
      entry.resolve(msg);
    });

    ws.on("close", () => {
      if (agent === ws) agent = null;
      rejectAllPending("agent disconnected");
    });

    ws.on("error", () => {
      if (agent === ws) agent = null;
      rejectAllPending("agent error");
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[railway_tunnel] listening on ${PORT} ws path ${TUNNEL_PATH}`);
  if (!TOKEN && process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.warn("[railway_tunnel] TUNNEL_TOKEN is empty — WebSocket auth is disabled. Set TUNNEL_TOKEN in production.");
  }
});
