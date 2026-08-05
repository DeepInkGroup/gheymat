import { getPrices, type PricesResult } from "./baha24";
import { getGoldApiPrices } from "./goldApi";
import { getOilPrices } from "./oilApi";
import { getPurityPrices } from "./rapidGoldApi";

/** baha24 items plus gold-api.com metals, oilpriceapi.com commodities, and RapidAPI gold-purity rates, merged. */
export async function getAllPrices(): Promise<PricesResult> {
  const [base, goldApiItems, oilItems, purityItems] = await Promise.all([
    getPrices(),
    getGoldApiPrices(),
    getOilPrices(),
    getPurityPrices(),
  ]);
  return { ...base, items: [...base.items, ...goldApiItems, ...oilItems, ...purityItems] };
}
