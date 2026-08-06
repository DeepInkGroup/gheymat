import { SYMBOL_MAP } from "./symbols";
import type { PriceItem } from "./baha24";

/**
 * Value of one unit of `symbol` in Toman. USD/USDT-denominated
 * instruments bridge through the live USD/USDT price (which is itself
 * Toman-denominated) — same trick as everywhere else in the app that
 * needs a common unit. Null if the bridge rate isn't live right now.
 */
function tomanPerUnit(symbol: string, byId: Map<string, PriceItem>): number | null {
  const meta = SYMBOL_MAP[symbol];
  const item = byId.get(symbol);
  if (!meta || !item || !Number.isFinite(item.price)) return null;
  if (meta.unit === "toman") return item.price;

  const bridge = byId.get(meta.unit === "usd" ? "USD" : "USDT");
  if (!bridge || !Number.isFinite(bridge.price) || bridge.price === 0) return null;
  return item.price * bridge.price;
}

/** Converts `amount` of `fromSymbol` into `toSymbol`'s own unit. Null if either side's rate isn't live. */
export function convertAmount(
  byId: Map<string, PriceItem>,
  fromSymbol: string,
  amount: number,
  toSymbol: string
): number | null {
  if (!Number.isFinite(amount)) return null;
  const fromToman = tomanPerUnit(fromSymbol, byId);
  const toToman = tomanPerUnit(toSymbol, byId);
  if (fromToman === null || toToman === null || toToman === 0) return null;
  return (amount * fromToman) / toToman;
}
