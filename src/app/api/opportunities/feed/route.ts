import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

// GET /api/opportunities/feed — returns opportunities with lock state for current user
// Locked opportunities hide sensitive data (prices, merchants). Unlocked return full data.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";
    const pair = searchParams.get("pair");
    const region = searchParams.get("region");
    const minSpread = searchParams.get("minSpread");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const dbUser = await getCurrentUser(req);

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;
    if (pair && pair !== "ALL") where.pair = pair;
    if (region && region !== "ALL") where.region = region;
    if (minSpread) where.spreadNet = { gte: parseFloat(minSpread) };

    const opportunities = await db.opportunity.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: limit,
    });

    // If user is authenticated, fetch their unlocks in one query
    let unlockedIds = new Set<string>();
    if (dbUser) {
      const unlocks = await db.opportunityUnlock.findMany({
        where: { userId: dbUser.id },
        select: { opportunityId: true },
      });
      unlockedIds = new Set(unlocks.map((u) => u.opportunityId));
    }

    const feed = opportunities.map((opp) => {
      const isLocked = !unlockedIds.has(opp.id);
      if (isLocked) {
        // Hide sensitive data — keep only pair, platforms, spread, duration, price
        return {
          id: opp.id,
          pair: opp.pair,
          fiat: opp.fiat,
          region: opp.region,
          buyPlatform: opp.buyPlatform,
          sellPlatform: opp.sellPlatform,
          spreadBrut: opp.spreadBrut,
          feesTotal: opp.feesTotal,
          spreadNet: opp.spreadNet,
          durationMin: opp.durationMin,
          detectedAt: opp.detectedAt,
          expiresAt: opp.expiresAt,
          status: opp.status,
          starsPrice: opp.starsPrice,
          isLocked: true,
          // Hidden fields (set to null):
          buyPrice: null,
          sellPrice: null,
          buyMerchant: null,
          sellMerchant: null,
          buyMerchantRating: null,
          sellMerchantRating: null,
          buyTrades: null,
          sellTrades: null,
          volumeAvailable: null,
          messageFr: null,
          messageEn: null,
          llmModel: opp.llmModel,
          publishedAt: opp.publishedAt,
        };
      }
      return {
        ...opp,
        isLocked: false,
      };
    });

    return NextResponse.json({
      opportunities: feed,
      count: feed.length,
      user: dbUser
        ? {
            id: dbUser.id,
            language: dbUser.language,
            starsBalance: dbUser.starsBalance,
            totalUnlocks: dbUser.totalUnlocks,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    console.error("[/api/opportunities/feed] error:", message);
    return NextResponse.json(
      { ok: false, error: "Database error", detail: message },
      { status: 500 }
    );
  }
}
