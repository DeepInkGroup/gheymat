import { NextRequest, NextResponse } from "next/server";
import { isPushConfigured, upsertSubscription, type PushSubscriptionRecord } from "@/lib/pushStore";

interface SubscribeBody {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  bigMoveEnabled?: boolean;
  alerts?: PushSubscriptionRecord["alerts"];
}

export async function POST(request: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications aren't configured on this server" }, { status: 501 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscription, bigMoveEnabled, alerts } = body;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
  }

  const record: PushSubscriptionRecord = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    bigMoveEnabled: bigMoveEnabled ?? false,
    alerts: alerts ?? {},
  };

  await upsertSubscription(record);
  return NextResponse.json({ ok: true });
}
