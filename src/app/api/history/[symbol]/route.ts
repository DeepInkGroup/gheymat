import { NextRequest, NextResponse } from "next/server";
import { getHistory, isHistoryConfigured } from "@/lib/history-db";
import { SYMBOL_MAP } from "@/lib/symbols";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 30;

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  if (!SYMBOL_MAP[symbol]) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  if (!isHistoryConfigured()) {
    return NextResponse.json({ configured: false, points: [] });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days") ?? "7");
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), MAX_DAYS) : 7;

  const points = await getHistory(symbol, Date.now() - days * DAY_MS);
  return NextResponse.json(
    { configured: true, symbol, days, points },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
