import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

type McpEntry = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
};

type McpConfig = {
  mcpServers?: Record<string, McpEntry>;
};

function configPath(): string {
  return process.env.CURSOR_MCP_CONFIG?.trim() || join(homedir(), '.cursor', 'mcp.json');
}

function parseAllowlist(): Set<string> | null {
  const raw = process.env.MCP_CALL_ALLOW_SERVERS?.trim();
  if (!raw) return null;
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
}

async function loadConfig(): Promise<McpConfig> {
  const path = configPath();
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as McpConfig;
}

function stringifyToolResult(r: unknown): string {
  try {
    const o = r as { isError?: boolean; content?: unknown };
    const prefix = o.isError ? 'Tool error: ' : '';
    if (Array.isArray(o.content)) {
      const parts = o.content.map((c: unknown) => {
        const x = c as { type?: string; text?: string; data?: string; mimeType?: string };
        if (x.type === 'text' && x.text != null) return x.text;
        if (x.type === 'image' && x.data) return `[image ${x.mimeType ?? ''}]`;
        return JSON.stringify(c);
      });
      return prefix + parts.join('\n');
    }
    return prefix + JSON.stringify(r, null, 2);
  } catch {
    return String(r);
  }
}

export async function callMcpToolLocal(params: {
  server: string;
  toolName: string;
  arguments?: Record<string, unknown>;
}): Promise<string> {
  const allow = parseAllowlist();
  if (allow && !allow.has(params.server)) {
    return `Error: server "${params.server}" not in MCP_CALL_ALLOW_SERVERS allowlist.`;
  }

  let config: McpConfig;
  try {
    config = await loadConfig();
  } catch (e) {
    return `Error: could not read MCP config at ${configPath()}: ${e}`;
  }

  const entry = config.mcpServers?.[params.server];
  if (!entry) {
    const keys = Object.keys(config.mcpServers ?? {}).slice(0, 40);
    return `Error: unknown server "${params.server}". Known: ${keys.join(', ') || '(none)'}`;
  }

  const client = new Client({ name: 'chatgpt-mcp-bridge', version: '1.0.0' });

  try {
    if (entry.url) {
      const transport = new StreamableHTTPClientTransport(new URL(entry.url));
      await client.connect(transport);
    } else if (entry.command) {
      const env = { ...getDefaultEnvironment(), ...entry.env };
      const transport = new StdioClientTransport({
        command: entry.command,
        args: entry.args ?? [],
        env,
        cwd: entry.cwd,
      });
      await client.connect(transport);
    } else {
      return 'Error: MCP entry has neither url nor command.';
    }

    const result = await client.callTool({
      name: params.toolName,
      arguments: params.arguments ?? {},
    });
    return stringifyToolResult(result);
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}
