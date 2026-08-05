import { getPrices, type PricesResult } from "./baha24";
import { getGoldApiPrices } from "./goldApi";

/** baha24 items plus the gold-api.com metals (Silver, Gold, Copper, Palladium), merged. */
export async function getAllPrices(): Promise<PricesResult> {
  const [base, extra] = await Promise.all([getPrices(), getGoldApiPrices()]);
  return { ...base, items: [...base.items, ...extra] };
}
