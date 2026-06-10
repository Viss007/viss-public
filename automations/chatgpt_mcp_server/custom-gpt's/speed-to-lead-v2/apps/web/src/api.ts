export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json() as Promise<T>;
}

export async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`);
  return r.json() as Promise<T>;
}
