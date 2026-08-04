import { NextResponse } from "next/server";
import { getPrices } from "@/lib/baha24";
import { getHistory } from "@/lib/history-db";
import { SYMBOL_MAP } from "@/lib/symbols";

/**
 * "Today's" movers = current live price vs. the most recent daily
 * snapshot committed by the cron job. With no history yet (fresh repo,
 * or GH_COMMIT_TOKEN not configured), every symbol has zero stored
 * points and this just returns an empty list.
 */
export async function GET() {
  const prices = await getPrices();

  const movers: Array<{ symbol: string; changePercent: number; price: number }> = [];
  for (const item of prices.items) {
    if (!SYMBOL_MAP[item.symbol]) continue;
    const history = getHistory(item.symbol, 0);
    const baseline = history[history.length - 1];
    if (!baseline || baseline.p === 0) continue;
    const changePercent = ((item.price - baseline.p) / baseline.p) * 100;
    movers.push({ symbol: item.symbol, changePercent, price: item.price });
  }

  movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return NextResponse.json(
    { movers: movers.slice(0, 8), asOf: prices.fetchedAt },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
