import { NextResponse } from "next/server";
import { getPrices } from "@/lib/baha24";

export async function GET() {
  const result = await getPrices();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=8, stale-while-revalidate=30" },
  });
}
