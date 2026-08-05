import { NextRequest, NextResponse } from "next/server";
import { removeSubscription } from "@/lib/pushStore";

export async function POST(request: NextRequest) {
  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
