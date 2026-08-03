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
const CACHE_TTL_MS = 45_000;

// Seed values so the UI is always populated even before the first
// successful live fetch (baha24's free tier is rate limited).
const MOCK_SNAPSHOT: PriceItem[] = [
  { symbol: "USD", price: 192700, changePercent: 0 },
  { symbol: "EUR", price: 221720, changePercent: 0 },
  { symbol: "GBP", price: 258750, changePercent: 0 },
  { symbol: "AED", price: 52980, changePercent: 0 },
  { symbol: "CNY", price: 28540, changePercent: 0 },
  { symbol: "TRY", price: 4055, changePercent: 0 },
  { symbol: "RUB", price: 2395, changePercent: 0 },
  { symbol: "CAD", price: 137210, changePercent: 0 },
  { symbol: "CHF", price: 237670, changePercent: 0 },
  { symbol: "MEXUSD", price: 132507, changePercent: 0 },
  { symbol: "EMAMI1", price: 185_000_000, changePercent: 0 },
  { symbol: "GOL18", price: 18_364_190, changePercent: 0 },
  { symbol: "OUNCE", price: 4056, changePercent: 0.12 },
  { symbol: "AZADI1", price: 180_000_000, changePercent: 0 },
  { symbol: "AZADI1_2", price: 94_500_000, changePercent: 0 },
  { symbol: "AZADI1_4", price: 53_000_000, changePercent: 0 },
  { symbol: "AZADI1G", price: 27_000_000, changePercent: 0 },
  { symbol: "MITHQAL", price: 79_550_000, changePercent: 0 },
  { symbol: "USDT", price: 192199, changePercent: 0.28 },
  { symbol: "BITCOIN", price: 63896.1, changePercent: 0.65 },
  { symbol: "ETH", price: 1871.15, changePercent: -0.68 },
  { symbol: "XRP", price: 1.083, changePercent: 0.16 },
  { symbol: "BNB", price: 591.97, changePercent: 0.53 },
  { symbol: "BCH", price: 214.58, changePercent: 0.4 },
  { symbol: "TRX", price: 0.3302, changePercent: 1.01 },
  { symbol: "LTC", price: 44.52, changePercent: -0.74 },
  { symbol: "DOGE", price: 0.0706, changePercent: 0.01 },
  { symbol: "SOL", price: 73.94, changePercent: 0.34 },
].map((item) => ({ ...item, updatedAt: null }));

let cache: PricesResult | null = null;
let inFlight: Promise<PricesResult> | null = null;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replaceAll(",", ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** baha24's response shape isn't fully documented; try the common field-name variants. */
function normalizeItem(raw: Record<string, unknown>): PriceItem | null {
  const symbol = String(raw.symbol ?? raw.code ?? raw.name ?? "").toUpperCase();
  if (!symbol || !SYMBOL_MAP[symbol]) return null;

  const price = toNumber(raw.price ?? raw.rate ?? raw.value ?? raw.amount);
  if (price === null) return null;

  const changePercent = toNumber(
    raw.change_percent ?? raw.changePercent ?? raw.percent_change ?? raw.change ?? raw.diff_percent
  );

  const updatedAt =
    (raw.updated_at as string) ?? (raw.updatedAt as string) ?? (raw.time as string) ?? null;

  return { symbol, price, changePercent, updatedAt };
}

function normalizeResponse(json: unknown): PriceItem[] {
  const container =
    json && typeof json === "object" && "data" in (json as Record<string, unknown>)
      ? (json as Record<string, unknown>).data
      : json;

  const list = Array.isArray(container)
    ? container
    : container && typeof container === "object"
    ? Object.values(container as Record<string, unknown>)
    : [];

  const items: PriceItem[] = [];
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
  const items = normalizeResponse(json);
  if (items.length === 0) {
    throw new Error("baha24 response could not be parsed");
  }
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
