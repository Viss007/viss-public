/**
 * ChatGPT MCP bridge: Streamable HTTP `/mcp` + legacy SSE `/sse`.
 * Deploy / tunnel: https://developers.openai.com/apps-sdk/deploy
 *   ngrok http 2091  →  https://<subdomain>.ngrok.app/mcp
 */
import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { Express } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest, isJSONRPCResultResponse } from '@modelcontextprotocol/sdk/types.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { createMcpServer } from './registerTools.js';
import { createOAuthRouter } from './oauth/router.js';

type AnyTransport = StreamableHTTPServerTransport | SSEServerTransport;

const transports: Record<string, AnyTransport> = {};

type ProcessLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

function parseProcessLeadBody(body: unknown): { ok: true; data: ProcessLeadInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Expected a JSON object' };
  }
  const o = body as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim() : undefined);
  const name = pick('name');
  const email = pick('email');
  const phone = pick('phone');
  const company = pick('company');
  const message = pick('message');
  const source = pick('source');
  let metadata: Record<string, unknown> | undefined;
  if (o.metadata !== undefined) {
    if (!o.metadata || typeof o.metadata !== 'object' || Array.isArray(o.metadata)) {
      return { ok: false, error: 'metadata must be an object when provided' };
    }
    metadata = o.metadata as Record<string, unknown>;
  }
  if (!name && !email && !phone) {
    return { ok: false, error: 'Provide at least one of name, email, or phone' };
  }
  return { ok: true, data: { name, email, phone, company, message, source, metadata } };
}

function compactLeadEcho(data: ProcessLeadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

/**
 * Custom GPT Actions codegen rejects several JSON field names when building the HTTP tool:
 * `params` (`UnrecognizedKwargsError: params`), and in practice also `mcpParams` (same class of error).
 * The OpenAPI schema uses **`rpcInput`** for JSON-RPC method arguments; we map it to **`params`** here.
 * If object kwargs are stripped by the wrapper, we also accept **`inputJson`** (stringified JSON object)
 * and parse it to `params`.
 * **`mcpParams`** is still accepted for older GPT schema paste-ins. Normal MCP clients send **`params`**.
 * **`mcpSessionId`** / **`mcpProtocolVersion`** on the JSON body are mapped to **`Mcp-Session-Id`** /
 * **`Mcp-Protocol-Version`** when the HTTP client cannot set headers (Custom GPT Actions).
 */
function normalizeMcpJsonRpcBody(body: unknown): void {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return;
  const o = body as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(o, 'params')) return;
  if (typeof o.inputJson === 'string') {
    try {
      const parsed = JSON.parse(o.inputJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        o.params = parsed;
        delete o.inputJson;
        return;
      }
    } catch {
      // Keep original request shape; MCP handler will return a structured error.
    }
  }
  if (Object.prototype.hasOwnProperty.call(o, 'rpcInput')) {
    o.params = o.rpcInput;
    delete o.rpcInput;
    return;
  }
  if (Object.prototype.hasOwnProperty.call(o, 'mcpParams')) {
    o.params = o.mcpParams;
    delete o.mcpParams;
  }
}

/**
 * Custom GPT Actions often cannot persist HTTP headers between tool calls. The MCP transport
 * still requires `Mcp-Session-Id` (and optionally `Mcp-Protocol-Version`) on follow-up POSTs.
 * Accept optional top-level body fields and map them onto the incoming request before routing.
 */
function injectMcpBridgeHeadersFromBody(req: IncomingMessage): Record<string, string> {
  const extra: Record<string, string> = {};
  const body = (req as { body?: unknown }).body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return extra;
  const o = body as Record<string, unknown>;
  if (typeof o.mcpSessionId === 'string') {
    const s = o.mcpSessionId.trim();
    if (s) extra['mcp-session-id'] = s;
    delete o.mcpSessionId;
  }
  if (typeof o.mcpProtocolVersion === 'string') {
    const s = o.mcpProtocolVersion.trim();
    if (s) extra['mcp-protocol-version'] = s;
    delete o.mcpProtocolVersion;
  }
  return extra;
}

/** Align Node header bags with what Streamable HTTP reads (`headers`, `rawHeaders`, `get`). */
function patchIncomingMessageForMcpHeaders(
  req: IncomingMessage,
  opts: { forcedAccept?: string; extraHeaders?: Record<string, string> },
): void {
  const forcedAccept = opts.forcedAccept;
  const extra = opts.extraHeaders ?? {};
  const accept = typeof req.headers.accept === 'string' ? req.headers.accept : '';
  const hasJson = accept.includes('application/json');
  const hasSse = accept.includes('text/event-stream');
  const needsAcceptOverride = Boolean(forcedAccept && (!hasJson || !hasSse));

  if (!needsAcceptOverride && Object.keys(extra).length === 0) return;

  const namesToReplace = new Set<string>();
  if (needsAcceptOverride) namesToReplace.add('accept');
  for (const k of Object.keys(extra)) namesToReplace.add(k.toLowerCase());

  const raw = (req as unknown as { rawHeaders?: string[] }).rawHeaders;
  if (Array.isArray(raw)) {
    for (let i = raw.length - 2; i >= 0; i -= 2) {
      const key = raw[i];
      if (typeof key === 'string' && namesToReplace.has(key.toLowerCase())) {
        raw.splice(i, 2);
      }
    }
    if (needsAcceptOverride && forcedAccept) {
      req.headers.accept = forcedAccept;
      raw.push('Accept', forcedAccept);
    }
    const appendCanonical = (lower: string, value: string) => {
      const canon =
        lower === 'mcp-session-id'
          ? 'Mcp-Session-Id'
          : lower === 'mcp-protocol-version'
            ? 'Mcp-Protocol-Version'
            : lower;
      req.headers[lower] = value;
      raw.push(canon, value);
    };
    for (const [k, v] of Object.entries(extra)) {
      appendCanonical(k.toLowerCase(), v);
    }
  } else {
    if (needsAcceptOverride && forcedAccept) {
      req.headers.accept = forcedAccept;
    }
    for (const [k, v] of Object.entries(extra)) {
      req.headers[k.toLowerCase()] = v;
    }
  }

  const reqWithGet = req as IncomingMessage & { get?: (name: string) => string | undefined };
  if (typeof reqWithGet.get === 'function') {
    const originalGet = reqWithGet.get.bind(reqWithGet);
    reqWithGet.get = (name: string) => {
      const n = name.toLowerCase();
      if (needsAcceptOverride && forcedAccept && n === 'accept') return forcedAccept;
      const fromExtra = extra[n];
      if (fromExtra !== undefined) return fromExtra;
      return originalGet(name);
    };
  }
}

/**
 * `enableJsonResponse` builds the HTTP body via Web `Response` + JSON.stringify, not Node
 * `res.end`, so we inject **`result._meta.mcpSessionId`** by wrapping **`transport.send`**.
 */
function injectSessionMetaIntoInitializeSend(
  transport: StreamableHTTPServerTransport,
  getSessionId: () => string | undefined,
): void {
  const origSend = transport.send.bind(transport);
  transport.send = async (message, options) => {
    const sid = getSessionId();
    if (
      sid &&
      message &&
      typeof message === 'object' &&
      isJSONRPCResultResponse(message)
    ) {
      const r = message.result;
      if (
        r &&
        typeof r === 'object' &&
        !Array.isArray(r) &&
        'protocolVersion' in r &&
        'serverInfo' in r
      ) {
        const prevMeta =
          '_meta' in r &&
            r['_meta'] &&
            typeof r['_meta'] === 'object' &&
            r['_meta'] !== null
            ? (r['_meta'] as Record<string, unknown>)
            : {};
        const next = {
          ...message,
          result: {
            ...(r as Record<string, unknown>),
            _meta: { ...prevMeta, mcpSessionId: sid },
          },
        };
        return origSend(next, options);
      }
    }
    return origSend(message, options);
  };
}

function parseAllowedHosts(): string[] | undefined {
  const raw = process.env.MCP_ALLOWED_HOSTS?.trim();
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export function createMcpApp(): Express {
  const host = process.env.MCP_HOST ?? '127.0.0.1';
  const allowedHosts = parseAllowedHosts();

  const app =
    host === '0.0.0.0' || host === '::'
      ? createMcpExpressApp(
        allowedHosts
          ? { host, allowedHosts }
          : { host },
      )
      : createMcpExpressApp({ host });

app.get('/health', (_req, res) => {
  const toolMode = process.env.CHATGPT_TOOL_MODE?.trim().toLowerCase() || 'full';
  res.json({
    ok: true,
    name: 'chatgpt_mcp_server',
    mcpStreamablePath: '/mcp',
    mcpSsePath: '/sse',
    leadPath: '/process-lead',
    chatgptToolMode: toolMode,
    dimensionalHttpUrl:
      process.env.DIMENSIONAL_HTTP_URL?.trim() || 'http://127.0.0.1:8811/api/dimensional',
    dimensionalHttpTimeoutMs: Number(process.env.DIMENSIONAL_HTTP_TIMEOUT_MS ?? '12000') || 12000,
    oauth: {
      start: 'GET /auth/:provider?link=<opaque>',
      callback: 'GET /auth/:provider/callback',
      status: 'GET /auth/status?link=<opaque>',
    },
  });
});

app.use(createOAuthRouter());

/** REST lead capture for Custom GPT Actions (OpenAPI `/process-lead`). Wire CRM/webhook here. */
app.post('/process-lead', (req, res) => {
  const parsed = parseProcessLeadBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }
  const leadId = randomUUID();
  res.json({
    ok: true,
    leadId,
    receivedAt: new Date().toISOString(),
    echo: compactLeadEcho(parsed.data),
  });
});

app.all('/mcp', async (req, res) => {
  try {
    const sessionProbe = req.headers['mcp-session-id'];
    const sessionProbeId = Array.isArray(sessionProbe) ? sessionProbe[0] : sessionProbe;
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      (!sessionProbeId || !transports[sessionProbeId])
    ) {
      res.status(200).json({
        ok: true,
        service: 'chatgpt-mcp-bridge',
        hint: 'POST JSON-RPC initialize to this URL (Streamable HTTP). Connector checks often use GET first.',
      });
      return;
    }

    const forcedAccept = 'application/json, text/event-stream';
    const extraFromBody =
      req.method === 'POST' && req.body ? injectMcpBridgeHeadersFromBody(req) : {};
    if (req.method === 'POST' && req.body) {
      normalizeMcpJsonRpcBody(req.body);
    }
    patchIncomingMessageForMcpHeaders(req, {
      forcedAccept,
      extraHeaders: extraFromBody,
    });

    const sessionHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionHeader)
      ? sessionHeader[0]
      : sessionHeader;
    let transport: AnyTransport | undefined;
    /** Set in `onsessioninitialized` so `transport.send` can echo id before getters settle. */
    let establishedStreamableSessionId = '';

    if (sessionId && transports[sessionId]) {
      const existing = transports[sessionId];
      if (existing instanceof StreamableHTTPServerTransport) {
        transport = existing;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Session uses a different transport (expected Streamable HTTP)',
          },
          id: null,
        });
        return;
      }
    } else if (
      !sessionId &&
      req.method === 'POST' &&
      req.body &&
      isInitializeRequest(req.body)
    ) {
      const eventStore = new InMemoryEventStore();
      // JSON responses (not SSE) so HTTP clients that expect application/json — e.g. Custom GPT
      // Actions / OpenAPI — get a single JSON body. Default SSE breaks those clients (hang or parse
      // failure). Set MCP_SSE_ONLY=1 to use streamable SSE for clients that require it.
      const streamTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore,
        enableJsonResponse: process.env.MCP_SSE_ONLY !== '1',
        onsessioninitialized: (sid) => {
          establishedStreamableSessionId = sid;
          transports[sid] = streamTransport;
        },
      });
      streamTransport.onclose = () => {
        const sid = streamTransport.sessionId;
        if (sid && transports[sid]) delete transports[sid];
      };
      transport = streamTransport;
      const server = createMcpServer();
      await server.connect(transport);
      injectSessionMetaIntoInitializeSend(streamTransport, () =>
        establishedStreamableSessionId || streamTransport.sessionId || undefined,
      );
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: initialize POST first or send mcp-session-id',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on('close', () => {
    delete transports[transport.sessionId];
  });
  const server = createMcpServer();
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const q = req.query['sessionId'];
  const sessionId =
    typeof q === 'string' ? q : Array.isArray(q) && typeof q[0] === 'string' ? q[0] : undefined;
  const t = sessionId ? transports[sessionId] : undefined;
  if (!t || !(t instanceof SSEServerTransport)) {
    res.status(400).send('No SSE transport for sessionId');
    return;
  }
  await t.handlePostMessage(req, res, req.body);
});

  return app;
}

const port = Number(process.env.MCP_PORT ?? '2091');
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const host = process.env.MCP_HOST ?? '0.0.0.0';
  const app = createMcpApp();
  app.listen(port, host, () => {
    const loopback = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
    console.log(`chatgpt_mcp_server listening on http://${host}:${port}`);
    console.log(
      `Streamable HTTP (OpenAI deploy / ngrok): https://<public-host>/mcp  →  http://${loopback}:${port}/mcp`,
    );
    console.log(`Legacy SSE: https://<public-host>/sse`);
    console.log(`Health: http://${loopback}:${port}/health`);
    if (host === '0.0.0.0' || host === '::') {
      console.warn(
        'Security: exposing Read/Grep/CallMcpTool to the internet is dangerous. Use auth, VPN, or MCP_CALL_ALLOW_SERVERS.',
      );
      console.warn(
        'Tunnel tip: use MCP_HOST=0.0.0.0 (not 127.0.0.1) so ngrok Host headers are not rejected by localhost validation.',
      );
    }
  });
}
