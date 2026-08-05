import { SYMBOL_MAP } from "./symbols";
import type { PriceItem } from "./baha24";

const URL = "https://real-time-metal-prices.p.rapidapi.com/api/v1/radpidhub/gold-price/USD";
const HOST = "real-time-metal-prices.p.rapidapi.com";

// One request returns every rate at once. The RapidAPI plan this key is
// on caps out at 500 requests/month (per the X-RateLimit-Requests-Limit
// response header) — a 2-hour cache keeps monthly usage to ~360
// requests, comfortably under that.
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

interface RapidGoldResponse {
  success: boolean;
  rates?: Record<string, number>;
  updated_at?: string;
}

let cache: { items: PriceItem[]; fetchedAt: number } | null = null;
let inFlight: Promise<PriceItem[]> | null = null;

const previousPrices = new Map<string, number>();

async function fetchLive(key: string): Promise<PriceItem[]> {
  const res = await fetch(URL, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": HOST,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RapidAPI responded ${res.status}`);
  const json = (await res.json()) as RapidGoldResponse;
  const rates = json.rates;
  if (!rates) throw new Error("RapidAPI response missing rates");

  const now = json.updated_at ?? new Date().toISOString();
  const items: PriceItem[] = [];
  for (const [symbol, price] of Object.entries(rates)) {
    if (!SYMBOL_MAP[symbol] || typeof price !== "number" || !Number.isFinite(price)) continue;
    const prev = previousPrices.get(symbol);
    const changePercent = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    previousPrices.set(symbol, price);
    items.push({ symbol, price, changePercent, updatedAt: now });
  }
  return items;
}

/** Requires RAPIDAPI_METAL_KEY — returns [] (silently) when it isn't configured. */
export async function getPurityPrices(): Promise<PriceItem[]> {
  const key = process.env.RAPIDAPI_METAL_KEY;
  if (!key) return [];

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  if (!inFlight) {
    inFlight = fetchLive(key)
      .then((items) => {
        cache = { items, fetchedAt: Date.now() };
        return items;
      })
      .catch(() => cache?.items ?? [])
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
