import { NextRequest, NextResponse } from "next/server";
import { getAllPrices } from "@/lib/allPrices";
import { isHistoryWriteConfigured, recordSnapshot } from "@/lib/history-db";

/**
 * Hit once a day by Vercel Cron (see vercel.json — more frequent than
 * daily isn't allowed on the Hobby plan and fails the whole deployment).
 * Appends today's price to data/Database{Category}.json and commits the
 * change straight to the repo, which triggers the normal git-push
 * auto-deploy — that's the actual persistence mechanism, since Vercel's
 * serverless filesystem doesn't survive between invocations.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isHistoryWriteConfigured()) {
    return NextResponse.json({ skipped: "GH_COMMIT_TOKEN not configured" }, { status: 200 });
  }

  const result = await getAllPrices();
  if (result.source !== "live") {
    return NextResponse.json({ skipped: `source was "${result.source}", not live` }, { status: 200 });
  }

  const committed = await recordSnapshot(result.items);
  return NextResponse.json({ committed, count: result.items.length, at: result.fetchedAt });
}
