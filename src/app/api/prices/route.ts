import { NextResponse } from "next/server";
import { getAllPrices } from "@/lib/allPrices";

export async function GET() {
  const result = await getAllPrices();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=8, stale-while-revalidate=30" },
  });
}
