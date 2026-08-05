import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getAllPrices } from "@/lib/allPrices";
import { formatPrice } from "@/lib/format";
import { SYMBOL_MAP, UNIT_LABELS } from "@/lib/symbols";
import {
  getLastPrices,
  isPushConfigured,
  listSubscriptions,
  removeSubscription,
  setLastPrices,
  upsertSubscription,
  type PushSubscriptionRecord,
} from "@/lib/pushStore";

// Same bar as the in-tab "Big move notifications" setting in
// PricesBoard.tsx — kept as a separate literal since that file is a
// client component and this route runs server-only.
const NOTIFY_THRESHOLD_PCT = 0.5;

function isVapidConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  tag: string;
}

async function send(record: PushSubscriptionRecord, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: record.endpoint, keys: record.keys },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired or was revoked on the device — stop
      // tracking it instead of failing on every future run.
      await removeSubscription(record.endpoint);
    }
    return false;
  }
}

/**
 * Hit by .github/workflows/push-check.yml every ~5 minutes — Vercel
 * Hobby's cron only allows once/day (see /api/cron/snapshot), too
 * coarse for anything resembling a "big move" alert, so a free GitHub
 * Actions schedule drives this one instead.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured() || !isVapidConfigured()) {
    return NextResponse.json({ skipped: "push notifications not configured" }, { status: 200 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://gheymat.vercel.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const [result, lastPrices, subscriptions] = await Promise.all([
    getAllPrices(),
    getLastPrices(),
    listSubscriptions(),
  ]);

  const currentPrices: Record<string, number> = {};
  let biggestMove: { symbol: string; pct: number } | null = null;

  for (const item of result.items) {
    currentPrices[item.symbol] = item.price;
    const prev = lastPrices[item.symbol];
    if (prev === undefined || prev === 0) continue;
    const pct = ((item.price - prev) / prev) * 100;
    if (biggestMove === null || Math.abs(pct) > Math.abs(biggestMove.pct)) {
      biggestMove = { symbol: item.symbol, pct };
    }
  }

  const bigMoveMeta = biggestMove ? SYMBOL_MAP[biggestMove.symbol] : undefined;
  const bigMoveItem = biggestMove ? result.items.find((i) => i.symbol === biggestMove!.symbol) : undefined;
  const hasBigMove =
    biggestMove !== null && Math.abs(biggestMove.pct) >= NOTIFY_THRESHOLD_PCT && bigMoveMeta && bigMoveItem;

  let sent = 0;
  let pruned = 0;

  for (const sub of subscriptions) {
    let alertsChanged = false;
    const remainingAlerts = { ...sub.alerts };

    for (const [symbol, alert] of Object.entries(sub.alerts)) {
      const price = currentPrices[symbol];
      if (price === undefined) continue;
      const crossed = alert.direction === "above" ? price >= alert.target : price <= alert.target;
      if (!crossed) continue;

      const meta = SYMBOL_MAP[symbol];
      const ok = await send(sub, {
        title: `${meta?.name ?? symbol} price alert`,
        body: `Now ${formatPrice(price)} ${meta ? UNIT_LABELS[meta.unit] : ""} — crossed your target of ${formatPrice(alert.target)}`,
        tag: `gheymat-alert-${symbol}`,
      });
      if (ok) sent++;
      delete remainingAlerts[symbol];
      alertsChanged = true;
    }

    if (sub.bigMoveEnabled && hasBigMove) {
      const sign = biggestMove!.pct > 0 ? "+" : "";
      const ok = await send(sub, {
        title: `${bigMoveMeta!.name} moved sharply`,
        body: `${sign}${biggestMove!.pct.toFixed(2)}% — now ${formatPrice(bigMoveItem!.price)} ${UNIT_LABELS[bigMoveMeta!.unit]}`,
        tag: "gheymat-big-move",
      });
      if (ok) sent++;
    }

    if (alertsChanged) {
      await upsertSubscription({ ...sub, alerts: remainingAlerts });
      pruned++;
    }
  }

  await setLastPrices(currentPrices);

  return NextResponse.json({ subscriptions: subscriptions.length, sent, alertsCleared: pruned });
}
