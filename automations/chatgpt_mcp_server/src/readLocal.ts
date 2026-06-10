import { readFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { extname } from 'node:path';
import { getAllowedRoots, isPathUnderRoots } from './roots.js';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export async function readLocalFile(params: {
  path: string;
  offset?: number;
  limit?: number;
}): Promise<string> {
  const roots = getAllowedRoots();
  if (!isPathUnderRoots(params.path, roots)) {
    return `Error: path must be under allowed roots: ${roots.join(', ')}`;
  }
  try {
    await access(params.path, fsConstants.R_OK);
  } catch {
    return `Error: cannot read file (missing or no permission): ${params.path}`;
  }

  const ext = extname(params.path).toLowerCase();
  if (IMAGE_EXT.has(ext)) {
    const buf = await readFile(params.path);
    const b64 = buf.toString('base64');
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg';
    const preview = b64.length > 80_000 ? b64.slice(0, 80_000) + '…(truncated)' : b64;
    return `[Image ${mime}; base64 length=${b64.length}]\n${preview}`;
  }

  const raw = await readFile(params.path, 'utf8');
  if (raw.length === 0) return 'File is empty.';

  let lines = raw.split(/\r?\n/);
  let start = 0;
  let end = lines.length;
  if (params.offset !== undefined) {
    const off = params.offset;
    if (off < 0) {
      start = Math.max(0, lines.length + off);
    } else if (off > 0) {
      start = Math.min(lines.length, off - 1);
    }
  }
  if (params.limit !== undefined && params.limit >= 0) {
    end = Math.min(lines.length, start + params.limit);
  }
  lines = lines.slice(start, end);
  const numbered = lines.map((line, i) => `${start + i + 1}|${line}`);
  return numbered.join('\n');
}
