/**
 * Streamable HTTP MCP round-trip: JSON-RPC initialize + tools/list (session propagation).
 * Session: response header `mcp-session-id` and/or `result._meta.mcpSessionId` (see server.ts).
 * Second POST sends `Mcp-Session-Id`; Node fetch forwards Accept / Content-Type / custom headers.
 *
 * CLI:
 *   node scripts/mcp-http-roundtrip.mjs [--url <full /mcp URL>]
 *   node scripts/mcp-http-roundtrip.mjs --local
 *     → http://127.0.0.1:${MCP_PORT:-2091}/mcp or MCP_VERIFY_HTTP_BASE + /mcp (ignores public env)
 *   node scripts/mcp-http-roundtrip.mjs --require-public-env
 *     → requires CHATGPT_MCP_PUBLIC_URL or RAILWAY_MCP_URL (full https://…/mcp)
 *
 * Env fallbacks (when no --url/--local/--require-public-env exclusive logic applies):
 *   CHATGPT_MCP_PUBLIC_URL | RAILWAY_MCP_URL → full MCP URL
 *   MCP_VERIFY_HTTP_BASE → base only; /mcp appended
 *   default http://127.0.0.1:2091/mcp
 */

import process from "node:process";

function parseArgs(argv) {
  const flags = { url: null, local: false, requirePublicEnv: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url" && argv[i + 1]) {
      flags.url = argv[++i];
    } else if (a === "--local") {
      flags.local = true;
    } else if (a === "--require-public-env") {
      flags.requirePublicEnv = true;
    }
  }
  return flags;
}

/** Normalize to absolute Streamable MCP endpoint ending with /mcp */
function normalizeMcpEndpoint(raw) {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("MCP URL must include scheme (http:// or https://)");
  }
  const u = new URL(trimmed);
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  if (!path.endsWith("/mcp")) {
    u.pathname = path === "/" ? "/mcp" : `${path}/mcp`;
  } else {
    u.pathname = path;
  }
  return u.href.replace(/\/+$/, "");
}

function resolveMcpUrl(flags) {
  if (flags.url) {
    return normalizeMcpEndpoint(flags.url);
  }
  if (flags.local) {
    const base =
      process.env.MCP_VERIFY_HTTP_BASE?.replace(/\/$/, "") ||
      `http://127.0.0.1:${process.env.MCP_PORT?.trim() || "2091"}`;
    return `${base}/mcp`;
  }
  if (flags.requirePublicEnv) {
    const u =
      process.env.CHATGPT_MCP_PUBLIC_URL?.trim() ||
      process.env.RAILWAY_MCP_URL?.trim();
    if (!u) {
      console.error(
        "FAIL: --require-public-env needs CHATGPT_MCP_PUBLIC_URL or RAILWAY_MCP_URL (full URL …/mcp)",
      );
      process.exit(1);
    }
    return normalizeMcpEndpoint(u);
  }
  const pub =
    process.env.CHATGPT_MCP_PUBLIC_URL?.trim() ||
    process.env.RAILWAY_MCP_URL?.trim();
  if (pub) {
    return normalizeMcpEndpoint(pub);
  }
  const base =
    process.env.MCP_VERIFY_HTTP_BASE?.replace(/\/$/, "") ||
    `http://127.0.0.1:${process.env.MCP_PORT?.trim() || "2091"}`;
  return `${base}/mcp`;
}

function logTarget(url) {
  try {
    const u = new URL(url);
    console.log(`MCP round-trip target: ${u.origin}${u.pathname}`);
  } catch {
    console.log("MCP round-trip target: (unparseable URL)");
  }
}

const accept = "application/json, text/event-stream";

async function post(mcpUrl, body, sessionId) {
  const headers = {
    Accept: accept,
    "Content-Type": "application/json; charset=utf-8",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const res = await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 500), headers: res.headers };
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

async function main() {
  const flags = parseArgs(process.argv);
  if (flags.local && flags.requirePublicEnv) {
    fail("Use only one of --local and --require-public-env");
  }
  if (flags.url && (flags.local || flags.requirePublicEnv)) {
    fail("Do not combine --url with --local or --require-public-env");
  }

  let mcpUrl;
  try {
    mcpUrl = resolveMcpUrl(flags);
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }
  logTarget(mcpUrl);

  const initBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "mcp-http-roundtrip", version: "1.0.0" },
    },
  };

  const r1 = await post(mcpUrl, initBody);
  if (!r1.ok || !r1.json) {
    fail(`MCP initialize HTTP ${r1.status} or non-JSON body`);
  }
  if (r1.json.error) {
    fail(
      `MCP initialize JSON-RPC error: ${r1.json.error.message || JSON.stringify(r1.json.error)}`,
    );
  }
  if (!r1.json.result) {
    fail("MCP initialize missing result");
  }
  pass("MCP initialize (JSON-RPC result, no error)");

  let sid =
    r1.json.result?._meta?.mcpSessionId ||
    r1.headers.get("mcp-session-id") ||
    r1.headers.get("Mcp-Session-Id");
  if (!sid) {
    fail("No session id from initialize (_meta.mcpSessionId or mcp-session-id header)");
  }

  const r2 = await post(
    mcpUrl,
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    sid,
  );
  if (!r2.ok || !r2.json) {
    fail(`MCP tools/list HTTP ${r2.status} or non-JSON`);
  }
  if (r2.json.error) {
    fail(
      `MCP tools/list JSON-RPC error: ${r2.json.error.message || JSON.stringify(r2.json.error)}`,
    );
  }
  const tools = r2.json.result?.tools;
  if (!Array.isArray(tools)) {
    fail("MCP tools/list missing result.tools array");
  }
  pass("MCP tools/list (result.tools present)");

  const names = new Set(tools.map((t) => t?.name).filter(Boolean));
  if (!names.has("echo")) {
    fail("tools/list missing required tool: echo");
  }
  if (!names.has("dimensional")) {
    fail("tools/list missing required tool: dimensional");
  }
  pass("tools/list includes echo + dimensional (extra tools allowed in full mode)");
}

main().catch((e) => {
  console.error(`FAIL: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
