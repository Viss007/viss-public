/**
 * Direct HTTP bridge to memory_agent POST /api/dimensional (8811).
 * Same JSON contract as Cursor's user-web_dimensional MCP — avoids stdio / mcp.json.
 *
 * Uses a bounded timeout so ChatGPT's upstream fetch does not hang until OpenAI returns 502.
 */
export async function callDimensionalHttp(input: {
  action: string;
  params?: Record<string, unknown>;
}): Promise<string> {
  const url = process.env.DIMENSIONAL_HTTP_URL?.trim();
  if (!url) {
    return 'dimensional disabled: set DIMENSIONAL_HTTP_URL to enable (off on Public :3333 island).';
  }
  const rawMs = Number(process.env.DIMENSIONAL_HTTP_TIMEOUT_MS ?? "12000");
  const timeoutMs = Number.isFinite(rawMs) && rawMs > 0 ? Math.min(rawMs, 120_000) : 12_000;

  const body = {
    action: input.action,
    params: input.params ?? {},
  };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.DIMENSIONAL_HTTP_API_KEY?.trim();
  if (key) {
    headers.Authorization = `Bearer ${key}`;
    headers["X-API-Key"] = key;
  }

  let res: Response;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: ac.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    const err = e as Error & { name?: string };
    if (err?.name === "AbortError") {
      return `dimensional fetch error: timeout after ${timeoutMs}ms calling ${url}. Start memory_agent on 8811 or increase DIMENSIONAL_HTTP_TIMEOUT_MS.`;
    }
    return `dimensional fetch error: ${err?.message ?? String(e)}`;
  }

  const text = await res.text();
  if (!res.ok) {
    return `dimensional HTTP ${res.status}: ${text}`;
  }
  return text;
}
