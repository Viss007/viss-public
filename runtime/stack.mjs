/**
 * Public — one Node runtime on :3333.
 * Agents/automations in-process. Templates via Laravel stdio worker (no HTTP port). Slack in-process.
 */
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { killListenProcessesOnPort } from "../free-port.mjs";
import { handleLaravelRequest, shutdownLaravelWorker } from "./laravel-bridge.mjs";
import { mountStaticPublic } from "./static-public.mjs";
import { startSlackWorker } from "./slack-worker.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GATEWAY_PORT = 3333;
const HOST = "127.0.0.1";
const WT = path.join(ROOT, "website-templates");

function log(msg) {
  console.log(`[public] ${msg}`);
}

function loadEnv(relativePath) {
  const p = path.join(ROOT, relativePath);
  if (fs.existsSync(p)) dotenv.config({ path: p });
}

function ensureLaravelEnv() {
  const envPath = path.join(WT, ".env");
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(WT, ".env.example"), envPath);
    const r = spawnSync("php", ["artisan", "key:generate", "--force"], {
      cwd: WT,
      stdio: "inherit",
      windowsHide: true,
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}

function shutdown() {
  log("shutting down…");
  shutdownLaravelWorker();
  setTimeout(() => process.exit(0), 400);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function main() {
  for (const p of [GATEWAY_PORT, 3000, 3001, 2091]) {
    const killed = killListenProcessesOnPort(p);
    if (killed.length) log(`freed port ${p} pid(s): ${killed.join(", ")}`);
  }

  loadEnv("agents/docs_agent/.env");
  loadEnv("automations/speed_to_lead/.env");
  loadEnv("automations/chatgpt_mcp_server/.env");
  ensureLaravelEnv();

  process.env.PUBLIC_GATEWAY = "1";
  process.env.GOOGLE_REDIRECT_URI = `http://${HOST}:${GATEWAY_PORT}/agents/docs-agent/auth/google/callback`;
  process.env.INVOICE_TRUST_PROXY = "1";
  process.env.CHATGPT_TOOL_MODE = "public";
  process.env.MCP_HOST = HOST;
  process.env.DIMENSIONAL_HTTP_URL = "disabled";
  process.env.CHATGPT_MCP_ROOT = ROOT;

  const mcpDist = path.join(ROOT, "automations", "chatgpt_mcp_server", "dist", "server.js");
  if (!fs.existsSync(mcpDist)) {
    log("building chatgpt_mcp…");
    spawnSync(process.execPath, ["npm", "run", "build"], {
      cwd: path.join(ROOT, "automations", "chatgpt_mcp_server"),
      stdio: "inherit",
      shell: true,
      windowsHide: true,
    });
  }

  const { app: docsApp } = await import("../agents/docs_agent/server.mjs");
  const { app: stlApp, startSpeedToLeadBackground } = await import(
    "../automations/speed_to_lead/server.mjs"
  );
  const { createMcpApp } = await import(
    "../automations/chatgpt_mcp_server/dist/server.js"
  );

  startSpeedToLeadBackground();
  const mcpApp = createMcpApp();

  const gateway = express();
  gateway.set("trust proxy", 1);

  gateway.use("/agents/docs-agent", docsApp);
  gateway.use("/automations/speed-to-lead", stlApp);
  gateway.use("/automations", mcpApp);

  mountStaticPublic(gateway);

  gateway.use((req, res) => {
    handleLaravelRequest(req, res).catch((err) => {
      if (!res.headersSent) {
        res.status(500).type("text/plain").send(err.message);
      }
    });
  });

  gateway.listen(GATEWAY_PORT, HOST, () => {
    log(`Public runtime http://${HOST}:${GATEWAY_PORT} — one Node process, one listen port`);
    log(`  agents + automations in-process; templates via Laravel stdio (no PHP HTTP)`);
    startSlackWorker().catch((err) => log(`slack failed: ${err.message}`));
  });
}

main().catch((err) => {
  console.error("[public] fatal:", err.message);
  shutdown();
  process.exit(1);
});
