import { SYMBOL_MAP } from "./symbols";

export interface PriceItem {
  symbol: string;
  price: number;
  changePercent: number | null;
  updatedAt: string | null;
}

export interface PricesResult {
  items: PriceItem[];
  fetchedAt: string;
  source: "live" | "cache" | "mock";
}

const API_URL = "https://baha24.com/api/v1/price";
// baha24's free tier allows 20 requests per window; this keeps us well
// under that while still refreshing often. Client polling (10s) hits our
// own /api/prices route, not baha24 directly, so it never affects this.
const CACHE_TTL_MS = 30_000;

// Seed values so the UI is never empty before the first successful live fetch.
const MOCK_SNAPSHOT: PriceItem[] = [
  { symbol: "USD", price: 192700, changePercent: null },
  { symbol: "EUR", price: 221720, changePercent: null },
  { symbol: "GBP", price: 258750, changePercent: null },
  { symbol: "AED", price: 52980, changePercent: null },
  { symbol: "CNY", price: 28540, changePercent: null },
  { symbol: "TRY", price: 4055, changePercent: null },
  { symbol: "RUB", price: 2395, changePercent: null },
  { symbol: "CAD", price: 137210, changePercent: null },
  { symbol: "CHF", price: 237670, changePercent: null },
  { symbol: "MEXUSD", price: 132507, changePercent: null },
  { symbol: "EMAMI1", price: 185_000_000, changePercent: null },
  { symbol: "GOL18", price: 18_364_190, changePercent: null },
  { symbol: "OUNCE", price: 4056, changePercent: null },
  { symbol: "AZADI1", price: 180_000_000, changePercent: null },
  { symbol: "AZADI1_2", price: 94_500_000, changePercent: null },
  { symbol: "AZADI1_4", price: 53_000_000, changePercent: null },
  { symbol: "AZADI1G", price: 27_000_000, changePercent: null },
  { symbol: "MITHQAL", price: 79_550_000, changePercent: null },
  { symbol: "USDT", price: 192199, changePercent: null },
  { symbol: "BITCOIN", price: 63896.1, changePercent: null },
  { symbol: "ETH", price: 1871.15, changePercent: null },
  { symbol: "XRP", price: 1.083, changePercent: null },
  { symbol: "BNB", price: 591.97, changePercent: null },
  { symbol: "BCH", price: 214.58, changePercent: null },
  { symbol: "TRX", price: 0.3302, changePercent: null },
  { symbol: "LTC", price: 44.52, changePercent: null },
  { symbol: "DOGE", price: 0.0706, changePercent: null },
  { symbol: "SOL", price: 73.94, changePercent: null },
].map((item) => ({ ...item, updatedAt: null }));

let cache: PricesResult | null = null;
let inFlight: Promise<PricesResult> | null = null;

// baha24 doesn't return a change/percent field at all — we track the last
// live price per symbol ourselves so cards can show a real, self-measured
// delta between our own polls instead of a fake/borrowed number.
const previousPrices = new Map<string, number>();

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replaceAll(",", ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * baha24's actual response is a flat JSON array, e.g.:
 * [{ "title": "دلار آمریکا", "symbol": "USD", "sell": "191500.00000000", "last_update": "2026-08-04 13:38" }, ...]
 */
function normalizeItem(raw: Record<string, unknown>): { symbol: string; price: number; updatedAt: string | null } | null {
  const symbol = String(raw.symbol ?? "").toUpperCase();
  if (!symbol || !SYMBOL_MAP[symbol]) return null;

  const price = toNumber(raw.sell ?? raw.price ?? raw.rate ?? raw.value ?? raw.amount);
  if (price === null) return null;

  const updatedAt = (raw.last_update as string) ?? (raw.updated_at as string) ?? null;

  return { symbol, price, updatedAt };
}

function normalizeResponse(json: unknown): Array<{ symbol: string; price: number; updatedAt: string | null }> {
  const container =
    json && typeof json === "object" && !Array.isArray(json) && "data" in (json as Record<string, unknown>)
      ? (json as Record<string, unknown>).data
      : json;

  const list = Array.isArray(container)
    ? container
    : container && typeof container === "object"
    ? Object.values(container as Record<string, unknown>)
    : [];

  const items: Array<{ symbol: string; price: number; updatedAt: string | null }> = [];
  for (const raw of list) {
    if (raw && typeof raw === "object") {
      const item = normalizeItem(raw as Record<string, unknown>);
      if (item) items.push(item);
    }
  }
  return items;
}

async function fetchLive(): Promise<PriceItem[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.BAHA24_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_URL, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`baha24 responded ${res.status}`);
  }
  const json = await res.json();
  const rawItems = normalizeResponse(json);
  if (rawItems.length === 0) {
    throw new Error("baha24 response could not be parsed");
  }

  const items: PriceItem[] = rawItems.map(({ symbol, price, updatedAt }) => {
    const prev = previousPrices.get(symbol);
    const changePercent = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    return { symbol, price, changePercent, updatedAt };
  });

  for (const { symbol, price } of rawItems) previousPrices.set(symbol, price);

  return items;
}

export async function getPrices(): Promise<PricesResult> {
  const now = Date.now();
  if (cache && now - Date.parse(cache.fetchedAt) < CACHE_TTL_MS) {
    return cache;
  }

  if (!inFlight) {
    inFlight = fetchLive()
      .then((items) => {
        cache = { items, fetchedAt: new Date().toISOString(), source: "live" };
        return cache;
      })
      .catch(() => {
        if (cache) {
          return { ...cache, source: "cache" as const };
        }
        return {
          items: MOCK_SNAPSHOT,
          fetchedAt: new Date().toISOString(),
          source: "mock" as const,
        };
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
