import { SYMBOL_MAP } from "./symbols";
import type { PriceItem } from "./baha24";

const BASE_URL = "https://api.oilpriceapi.com/v1/prices/latest";
const CODES = [
  "WTI_USD",
  "BRENT_CRUDE_USD",
  "NATURAL_GAS_USD",
  "DIESEL_USD",
  "HEATING_OIL_USD",
  "JET_FUEL_USD",
  "GASOLINE_USD",
  "COAL_USD",
];

// oilpriceapi.com has no batch endpoint — one request per code (see
// docs.oilpriceapi.com). The account is capped well under 10,000
// requests/month, so this cache is deliberately long: fetching all 8
// codes every 40 minutes is ~8,640 requests/month, safely under the
// ~9,900 budget. Bump CACHE_TTL_MS down only after confirming the
// account's actual monthly quota can absorb it.
const CACHE_TTL_MS = 40 * 60 * 1000;

interface OilApiResponse {
  status: string;
  data?: {
    price: number;
    code: string;
    created_at: string;
  };
  error?: { message?: string };
}

let cache: { items: PriceItem[]; fetchedAt: number } | null = null;
let inFlight: Promise<PriceItem[]> | null = null;

const previousPrices = new Map<string, number>();

async function fetchOne(code: string, token: string): Promise<PriceItem | null> {
  if (!SYMBOL_MAP[code]) return null;
  try {
    const res = await fetch(`${BASE_URL}?by_code=${code}`, {
      headers: { Authorization: `Token ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as OilApiResponse;
    const price = json.data?.price;
    if (typeof price !== "number" || !Number.isFinite(price)) return null;

    const prev = previousPrices.get(code);
    const changePercent = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    previousPrices.set(code, price);

    return { symbol: code, price, changePercent, updatedAt: json.data?.created_at ?? null };
  } catch {
    return null;
  }
}

async function fetchLive(token: string): Promise<PriceItem[]> {
  const results = await Promise.all(CODES.map((code) => fetchOne(code, token)));
  return results.filter((item): item is PriceItem => item !== null);
}

/** Requires OILPRICEAPI_KEY — returns [] (silently) when it isn't configured. */
export async function getOilPrices(): Promise<PriceItem[]> {
  const token = process.env.OILPRICEAPI_KEY;
  if (!token) return [];

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  if (!inFlight) {
    inFlight = fetchLive(token)
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
