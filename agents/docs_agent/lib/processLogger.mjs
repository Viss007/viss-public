/**
 * Aggressive structured logging for invoices_to_excel (stdout + file).
 * Env: INVOICE_LOG_FILE (default logs/invoices-app.log), INVOICE_LOG_STDOUT (default 1)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const LOG_STDOUT = process.env.INVOICE_LOG_STDOUT !== '0';
const LOG_FILE =
  process.env.INVOICE_LOG_FILE || path.join(rootDir, 'logs', 'invoices-app.log');
let fileStream = null;

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

function openFileStream() {
  if (fileStream) return;
  try {
    ensureLogDir();
    fileStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  } catch (e) {
    console.error('[invoices-log] cannot open log file:', e?.message || e);
  }
}

function ts() {
  return new Date().toISOString();
}

/**
 * @param {string} level
 * @param {string} msg
 * @param {Record<string, unknown>} [meta]
 */
export function invoiceLog(level, msg, meta) {
  const line = meta && Object.keys(meta).length
    ? `${ts()} [${level}] ${msg} ${safeJson(meta)}`
    : `${ts()} [${level}] ${msg}`;
  if (LOG_STDOUT) {
    console.log(line);
  }
  openFileStream();
  if (fileStream) {
    fileStream.write(`${line}\n`);
  }
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export function truncate(str, max = 120) {
  if (str == null) return '';
  const s = String(str);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…(${s.length} chars)`;
}

export function approxBase64Bytes(b64) {
  if (!b64 || typeof b64 !== 'string') return 0;
  const len = b64.length;
  return Math.floor((len * 3) / 4);
}

export function newRequestId() {
  return randomUUID().slice(0, 8);
}
