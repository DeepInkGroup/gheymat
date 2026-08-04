import { NextRequest, NextResponse } from "next/server";
import { getPrices } from "@/lib/baha24";
import { isHistoryConfigured, recordSnapshot } from "@/lib/history-db";

/**
 * Hit on a schedule by Vercel Cron (see vercel.json). Records the current
 * live price of every instrument into the history store so cards can show
 * real multi-day trends instead of only what's built up in a single
 * browser session. Only writes on a genuinely fresh live fetch — a
 * cache/mock fallback would otherwise duplicate a stale point.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isHistoryConfigured()) {
    return NextResponse.json({ skipped: "history store not configured" }, { status: 200 });
  }

  const result = await getPrices();
  if (result.source !== "live") {
    return NextResponse.json({ skipped: `source was "${result.source}", not live` }, { status: 200 });
  }

  await recordSnapshot(result.items);
  return NextResponse.json({ recorded: result.items.length, at: result.fetchedAt });
}
