import { Redis } from "@upstash/redis";

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // keep 30 days per symbol

let client: Redis | null | undefined;

/**
 * Lazily builds an Upstash Redis client from whichever env var naming
 * Vercel's Storage integration injected (Vercel KV and a raw Upstash
 * connection use slightly different names). Returns null — not an error —
 * when nothing is configured, so callers can degrade gracefully instead
 * of crashing a route that doesn't strictly need history to work.
 */
function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isHistoryConfigured(): boolean {
  return getRedis() !== null;
}

export interface HistoryPoint {
  t: number; // ms epoch
  p: number; // price
}

export async function recordSnapshot(items: Array<{ symbol: string; price: number }>): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const now = Date.now();
  const cutoff = now - RETENTION_MS;

  await Promise.all(
    items.map(async ({ symbol, price }) => {
      const key = `hist:${symbol}`;
      const member = `${now}:${price}`;
      await redis.zadd(key, { score: now, member });
      await redis.zremrangebyscore(key, 0, cutoff);
    })
  );
}

export async function getHistory(symbol: string, sinceMs: number): Promise<HistoryPoint[]> {
  const redis = getRedis();
  if (!redis) return [];

  const key = `hist:${symbol}`;
  const raw = await redis.zrange<string[]>(key, sinceMs, Date.now(), { byScore: true });

  const points: HistoryPoint[] = [];
  for (const member of raw) {
    const idx = member.indexOf(":");
    if (idx === -1) continue;
    const t = Number(member.slice(0, idx));
    const p = Number(member.slice(idx + 1));
    if (Number.isFinite(t) && Number.isFinite(p)) points.push({ t, p });
  }
  return points;
}
