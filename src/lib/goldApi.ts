import { SYMBOL_MAP } from "./symbols";
import type { PriceItem } from "./baha24";

const BASE_URL = "https://api.gold-api.com/price";
// Silver, Gold (spot), Copper, Palladium — deliberately not Platinum (XPT),
// which the API also offers but wasn't requested.
const GOLD_API_SYMBOLS = ["XAU", "XAG", "HG", "XPD"];
const CACHE_TTL_MS = 30_000;

interface GoldApiPriceResponse {
  price: number;
  symbol: string;
  updatedAt: string;
}

let cache: { items: PriceItem[]; fetchedAt: number } | null = null;
let inFlight: Promise<PriceItem[]> | null = null;

// gold-api.com doesn't return a change/percent field either — same
// self-measured-delta approach as baha24.ts.
const previousPrices = new Map<string, number>();

async function fetchOne(symbol: string): Promise<PriceItem | null> {
  if (!SYMBOL_MAP[symbol]) return null;
  try {
    const res = await fetch(`${BASE_URL}/${symbol}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as GoldApiPriceResponse;
    const price = typeof json.price === "number" && Number.isFinite(json.price) ? json.price : null;
    if (price === null) return null;

    const prev = previousPrices.get(symbol);
    const changePercent = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    previousPrices.set(symbol, price);

    return { symbol, price, changePercent, updatedAt: json.updatedAt ?? null };
  } catch {
    return null;
  }
}

async function fetchLive(): Promise<PriceItem[]> {
  const results = await Promise.all(GOLD_API_SYMBOLS.map(fetchOne));
  return results.filter((item): item is PriceItem => item !== null);
}

/** Free, unauthenticated, unrate-limited per gold-api.com/docs — no token needed. */
export async function getGoldApiPrices(): Promise<PriceItem[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  if (!inFlight) {
    inFlight = fetchLive()
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
