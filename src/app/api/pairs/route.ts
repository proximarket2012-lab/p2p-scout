import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/pairs — list all configured trading pairs
export async function GET() {
  const pairs = await db.tradingPair.findMany({
    orderBy: { risk: "asc" },
  });
  return NextResponse.json({ pairs });
}
