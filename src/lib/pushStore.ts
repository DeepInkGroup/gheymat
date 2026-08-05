import { Redis } from "@upstash/redis";

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  bigMoveEnabled: boolean;
  alerts: Record<string, { target: number; direction: "above" | "below" }>;
}

const SUBS_KEY = "gheymat:push-subscriptions";
const PRICES_KEY = "gheymat:push-last-prices";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function isPushConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function parseRecord(raw: unknown): PushSubscriptionRecord | null {
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as PushSubscriptionRecord) : (raw as PushSubscriptionRecord);
  } catch {
    return null;
  }
}

export async function upsertSubscription(record: PushSubscriptionRecord): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.hset(SUBS_KEY, { [record.endpoint]: JSON.stringify(record) });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.hdel(SUBS_KEY, endpoint);
}

export async function getSubscription(endpoint: string): Promise<PushSubscriptionRecord | null> {
  const client = getRedis();
  if (!client) return null;
  const raw = await client.hget(SUBS_KEY, endpoint);
  return raw ? parseRecord(raw) : null;
}

/** All currently-stored subscriptions. Corrupt/unparseable entries are skipped, not thrown. */
export async function listSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const client = getRedis();
  if (!client) return [];
  const all = await client.hgetall<Record<string, unknown>>(SUBS_KEY);
  if (!all) return [];
  const records: PushSubscriptionRecord[] = [];
  for (const raw of Object.values(all)) {
    const record = parseRecord(raw);
    if (record) records.push(record);
  }
  return records;
}

/**
 * Prices as of the last /api/cron/push-check run, used to compute a
 * since-last-check delta (independent of the once-daily history
 * snapshot, which is too coarse for "big move" detection).
 */
export async function getLastPrices(): Promise<Record<string, number>> {
  const client = getRedis();
  if (!client) return {};
  const raw = await client.get(PRICES_KEY);
  if (!raw) return {};
  const parsed = parseRecord(raw);
  return (parsed as unknown as Record<string, number>) ?? {};
}

export async function setLastPrices(prices: Record<string, number>): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.set(PRICES_KEY, JSON.stringify(prices));
}
