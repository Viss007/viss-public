/** JSON messages over WebSocket between server (Railway) and local agent. */

export type TunnelRequest = {
  v: 1;
  type: "request";
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  bodyB64: string | null;
};

export type TunnelResponse = {
  v: 1;
  type: "response";
  id: string;
  status: number;
  headers: Record<string, string>;
  bodyB64: string;
};

export function parseTunnelMessage(raw: string): TunnelRequest | TunnelResponse | null {
  try {
    const o = JSON.parse(raw) as { v?: number; type?: string };
    if (o?.v !== 1 || (o.type !== "request" && o.type !== "response")) return null;
    return o as TunnelRequest | TunnelResponse;
  } catch {
    return null;
  }
}
