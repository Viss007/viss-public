import { homedir } from 'node:os';
import { resolve, normalize } from 'node:path';

/**
 * Allowed filesystem roots for Read / Grep. Override with CHATGPT_MCP_ROOT and CHATGPT_MCP_EXTRA_ROOTS (comma-separated).
 */
export function getAllowedRoots(): string[] {
  const main =
    process.env.CHATGPT_MCP_ROOT?.trim() ||
    resolve(homedir(), 'Desktop', 'Public');
  const extras = process.env.CHATGPT_MCP_EXTRA_ROOTS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
  return [main, ...extras].map((r) => resolve(r));
}

export function isPathUnderRoots(filePath: string, roots: string[]): boolean {
  const resolved = resolve(filePath);
  const norm = (p: string) => normalize(p).replace(/\\/g, '/').toLowerCase();
  const target = norm(resolved);
  return roots.some((root) => {
    const prefix = norm(resolve(root));
    return target === prefix || target.startsWith(prefix + '/');
  });
}
