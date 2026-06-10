/**
 * Dev smoke: POST minimal PNG to /api/process (requires server + OPENAI_API_KEY).
 * Run: node scripts/smoke-test.mjs
 */
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:3000';

async function main() {
  const h = await fetch(`${base}/health`);
  console.log('GET /health', h.status, await h.text());

  const t0 = Date.now();
  const res = await fetch(`${base}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ name: 'smoke-test.pdf', pages: [png] }],
    }),
  });
  console.log('POST /api/process', res.status, res.headers.get('content-type'));
  const text = await res.text();
  if (!res.ok) {
    console.log('body', text);
    process.exit(1);
  }
  const lines = text.trim().split('\n').filter(Boolean);
  const last = JSON.parse(lines[lines.length - 1]);
  console.log('elapsed_ms', Date.now() - t0);
  console.log('last_event', last.event, 'processed', last.processed, 'failed', last.failed);
  if (last.rows?.[0]) {
    const r = last.rows[0];
    console.log('sample_row', {
      failas: r.failas,
      data: r.data,
      saskaitosNumeris: r.saskaitosNumeris,
      sumaSuPvm: r.sumaSuPvm,
      _error: r._error,
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
