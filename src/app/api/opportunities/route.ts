import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/opportunities?status=ACTIVE&pair=USDT/XAF&region=Africa&minSpread=2&limit=50
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";
    const pair = searchParams.get("pair");
    const region = searchParams.get("region");
    const platform = searchParams.get("platform");
    const minSpread = searchParams.get("minSpread");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;
    if (pair && pair !== "ALL") where.pair = pair;
    if (region && region !== "ALL") where.region = region;
    if (platform && platform !== "ALL") {
      where.OR = [{ buyPlatform: platform }, { sellPlatform: platform }];
    }
    if (minSpread) where.spreadNet = { gte: parseFloat(minSpread) };

    const opportunities = await db.opportunity.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    console.error("[/api/opportunities] error:", message);
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed",
        detail: message,
        hint: "Ensure DATABASE_URL + DIRECT_URL env vars are set (Neon Postgres). See .env.example",
      },
      { status: 500 }
    );
  }
}
