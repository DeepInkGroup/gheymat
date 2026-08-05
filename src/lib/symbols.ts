export type Category = "currency" | "gold" | "crypto";

export type Unit = "toman" | "usd" | "usdt";

export interface SymbolMeta {
  symbol: string;
  name: string;
  category: Category;
  unit: Unit;
  glyph: string;
  /** Hex color for the icon badge background (used when there's no flag). */
  color: string;
  /** ISO code for country-flag-icons (currency category only). */
  flagCode?: string;
  /** File name (no extension) under /public/crypto for the real coin icon. */
  iconFile?: string;
  /** Which built-in illustration to use (gold category only). */
  iconKind?: "coin" | "bar" | "globe" | "ingot";
}

export const CATEGORY_LABELS: Record<Category, string> = {
  currency: "Currency",
  gold: "Gold & Coins",
  crypto: "Crypto",
};

export const UNIT_LABELS: Record<Unit, string> = {
  toman: "Toman",
  usd: "USD",
  usdt: "USDT",
};

const GOLD = "#B8860B";

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "USD", name: "US Dollar", category: "currency", unit: "toman", glyph: "US", color: "#3B5BDB", flagCode: "US" },
  { symbol: "EUR", name: "Euro", category: "currency", unit: "toman", glyph: "EU", color: "#1098AD", flagCode: "EU" },
  { symbol: "GBP", name: "British Pound", category: "currency", unit: "toman", glyph: "GB", color: "#E8590C", flagCode: "GB" },
  { symbol: "AED", name: "UAE Dirham", category: "currency", unit: "toman", glyph: "AE", color: "#2F9E44", flagCode: "AE" },
  { symbol: "CNY", name: "Chinese Yuan", category: "currency", unit: "toman", glyph: "CN", color: "#C2255C", flagCode: "CN" },
  { symbol: "TRY", name: "Turkish Lira", category: "currency", unit: "toman", glyph: "TR", color: "#F08C00", flagCode: "TR" },
  { symbol: "RUB", name: "Russian Ruble", category: "currency", unit: "toman", glyph: "RU", color: "#5F3DC4", flagCode: "RU" },
  { symbol: "CAD", name: "Canadian Dollar", category: "currency", unit: "toman", glyph: "CA", color: "#1971C2", flagCode: "CA" },
  { symbol: "CHF", name: "Swiss Franc", category: "currency", unit: "toman", glyph: "CH", color: "#099268", flagCode: "CH" },
  { symbol: "MEXUSD", name: "Exchange Dollar", category: "currency", unit: "toman", glyph: "$", color: "#D9480F" },

  { symbol: "EMAMI1", name: "Emami Coin", category: "gold", unit: "toman", glyph: "E", color: GOLD, iconKind: "coin" },
  { symbol: "GOL18", name: "18k Gold (1g)", category: "gold", unit: "toman", glyph: "Au", color: GOLD, iconKind: "bar" },
  { symbol: "OUNCE", name: "Gold Ounce", category: "gold", unit: "usd", glyph: "Oz", color: GOLD, iconKind: "globe" },
  { symbol: "XAU", name: "Gold (Spot)", category: "gold", unit: "usd", glyph: "Au", color: GOLD, iconKind: "ingot" },
  { symbol: "XAG", name: "Silver", category: "gold", unit: "usd", glyph: "Ag", color: "#9CA3AF", iconKind: "ingot" },
  { symbol: "HG", name: "Copper", category: "gold", unit: "usd", glyph: "Cu", color: "#B87333", iconKind: "globe" },
  { symbol: "XPD", name: "Palladium", category: "gold", unit: "usd", glyph: "Pd", color: "#4A6572", iconKind: "globe" },
  { symbol: "AZADI1", name: "Full Azadi Coin", category: "gold", unit: "toman", glyph: "A1", color: GOLD, iconKind: "coin" },
  { symbol: "AZADI1_2", name: "Half Azadi Coin", category: "gold", unit: "toman", glyph: "½", color: GOLD, iconKind: "coin" },
  { symbol: "AZADI1_4", name: "Quarter Azadi Coin", category: "gold", unit: "toman", glyph: "¼", color: GOLD, iconKind: "coin" },
  { symbol: "AZADI1G", name: "1g Azadi Coin", category: "gold", unit: "toman", glyph: "1g", color: GOLD, iconKind: "coin" },
  { symbol: "MITHQAL", name: "Gold Mithqal", category: "gold", unit: "toman", glyph: "Mq", color: GOLD, iconKind: "bar" },

  { symbol: "USDT", name: "Tether", category: "crypto", unit: "toman", glyph: "₮", color: "#26A17B", iconFile: "usdt" },
  { symbol: "BITCOIN", name: "Bitcoin", category: "crypto", unit: "usdt", glyph: "₿", color: "#F7931A", iconFile: "btc" },
  { symbol: "ETH", name: "Ethereum", category: "crypto", unit: "usdt", glyph: "Ξ", color: "#627EEA", iconFile: "eth" },
  { symbol: "XRP", name: "Ripple", category: "crypto", unit: "usdt", glyph: "X", color: "#23292F", iconFile: "xrp" },
  { symbol: "BNB", name: "Binance Coin", category: "crypto", unit: "usdt", glyph: "B", color: "#F0B90B", iconFile: "bnb" },
  { symbol: "BCH", name: "Bitcoin Cash", category: "crypto", unit: "usdt", glyph: "₿", color: "#8DC351", iconFile: "bch" },
  { symbol: "TRX", name: "Tron", category: "crypto", unit: "usdt", glyph: "T", color: "#EF0027", iconFile: "trx" },
  { symbol: "LTC", name: "Litecoin", category: "crypto", unit: "usdt", glyph: "Ł", color: "#345D9D", iconFile: "ltc" },
  { symbol: "DOGE", name: "Dogecoin", category: "crypto", unit: "usdt", glyph: "Ð", color: "#C2A633", iconFile: "doge" },
  { symbol: "SOL", name: "Solana", category: "crypto", unit: "usdt", glyph: "◎", color: "#9945FF", iconFile: "sol" },
];

export const SYMBOL_MAP: Record<string, SymbolMeta> = Object.fromEntries(
  SYMBOLS.map((s) => [s.symbol, s])
);
