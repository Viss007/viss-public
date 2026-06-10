import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { callMcpToolLocal } from './callMcpLocal.js';
import { callDimensionalHttp } from './dimensionalHttp.js';
import { grepLocal } from './grepLocal.js';
import { readLocalFile } from './readLocal.js';
/**
 * `public` — echo only; no filesystem, Cursor mcp.json, or operator memory (Public :3333 island).
 * `memory` — echo + dimensional when DIMENSIONAL_HTTP_URL is set (Railway tunnel demos).
 * `full` — all tools; dimensional only when DIMENSIONAL_HTTP_URL is set.
 */
function toolMode() {
    const m = process.env.CHATGPT_TOOL_MODE?.trim().toLowerCase();
    if (m === 'public')
        return 'public';
    if (m === 'memory')
        return 'memory';
    return 'full';
}
function dimensionalEnabled() {
    if (toolMode() === 'public')
        return false;
    const url = process.env.DIMENSIONAL_HTTP_URL?.trim().toLowerCase();
    if (!url || url === 'off' || url === 'disabled' || url === '0')
        return false;
    return true;
}
/**
 * Registers Cursor-style tools for the ChatGPT MCP bridge (see VissAI docs/tool_functions).
 */
export function registerAgentTools(server) {
    const mode = toolMode();
    const memoryOnly = mode === 'memory';
    const publicIsland = mode === 'public';
    server.registerTool('echo', {
        description: 'Returns the same text you send. Use to verify the connector works.',
        inputSchema: {
            message: z.string().describe('Short message to echo back'),
        },
    }, async ({ message }) => ({
        content: [{ type: 'text', text: message }],
    }));
    if (dimensionalEnabled()) {
        server.registerTool('dimensional', {
            description: 'Optional memory HTTP bridge when DIMENSIONAL_HTTP_URL is configured. Disabled on Public :3333 island.',
            inputSchema: {
                action: z
                    .string()
                    .describe('dimensional action name: health, search, pre_hook, write, stats, reload, ...'),
                params: z
                    .union([z.record(z.string(), z.unknown()), z.null()])
                    .optional()
                    .transform((p) => p ?? {})
                    .describe('JSON params for the action (e.g. query + limit for search); omit or {} for health'),
            },
        }, async ({ action, params }) => {
            try {
                const text = await callDimensionalHttp({ action, params });
                return { content: [{ type: 'text', text }] };
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                return { content: [{ type: 'text', text: `dimensional error: ${msg}` }] };
            }
        });
    }
    if (memoryOnly || publicIsland) {
        return;
    }
    server.registerTool('Read', {
        description: 'Reads a file from the local filesystem under allowed workspace roots. Lines are numbered as LINE|CONTENT. Optional offset/limit for large files.',
        inputSchema: {
            path: z.string().describe('Absolute path of the file to read'),
            offset: z
                .number()
                .optional()
                .describe('Line to start from (1-based from start, or negative from end). Omit to read from start.'),
            limit: z
                .number()
                .optional()
                .describe('Max number of lines to return when offset is used'),
        },
    }, async ({ path, offset, limit }) => {
        const text = await readLocalFile({ path, offset, limit });
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('Grep', {
        description: 'Search file contents using ripgrep (rg) under allowed roots. Mirrors Cursor Grep parameters.',
        inputSchema: {
            pattern: z.string().describe('Regular expression pattern'),
            path: z
                .string()
                .optional()
                .describe('File or directory to search (default: primary allowed root)'),
            glob: z.string().optional().describe('Glob filter, e.g. *.ts'),
            output_mode: z
                .enum(['content', 'files_with_matches', 'count'])
                .optional()
                .describe('content | files_with_matches | count'),
            '-B': z.number().optional(),
            '-A': z.number().optional(),
            '-C': z.number().optional(),
            '-i': z.boolean().optional(),
            type: z.string().optional().describe('rg --type, e.g. js, py'),
            head_limit: z.number().optional(),
            offset: z.number().optional(),
            multiline: z.boolean().optional(),
        },
    }, async (params) => {
        const text = await grepLocal(params);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('CallMcpTool', {
        description: 'Call an MCP tool from your local Cursor mcp.json (stdio or url servers). Set MCP_CALL_ALLOW_SERVERS=comma list to restrict. Reads CURSOR_MCP_CONFIG or ~/.cursor/mcp.json.',
        inputSchema: {
            server: z.string().describe('Server key as in mcp.json mcpServers'),
            toolName: z.string().describe('Tool name to invoke'),
            arguments: z
                .record(z.string(), z.unknown())
                .optional()
                .describe('Tool arguments object'),
        },
    }, async (input) => {
        const text = await callMcpToolLocal({
            server: input.server,
            toolName: input.toolName,
            arguments: input.arguments,
        });
        return { content: [{ type: 'text', text }] };
    });
}
export function createMcpServer() {
    const server = new McpServer({
        name: 'chatgpt-mcp-bridge',
        version: '1.0.0',
    });
    registerAgentTools(server);
    return server;
}
