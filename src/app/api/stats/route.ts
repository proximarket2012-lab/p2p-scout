import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats — dashboard statistics
export async function GET() {
  const [
    activeCount,
    publishedCount,
    expiredCount,
    suspiciousCount,
    totalOpportunities,
    bestActive,
    avgSpreadActive,
    lastScan,
    scannerActive,
    spreadThreshold,
    channels,
    platformsCount,
    pairsCount,
    llmsCount,
    scanLogs24h,
  ] = await Promise.all([
    db.opportunity.count({ where: { status: "ACTIVE" } }),
    db.opportunity.count({ where: { publishedAt: { not: null } } }),
    db.opportunity.count({ where: { status: "EXPIRED" } }),
    db.opportunity.count({ where: { status: "SUSPICIOUS" } }),
    db.opportunity.count(),
    db.opportunity.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { spreadNet: "desc" },
    }),
    db.opportunity.aggregate({
      where: { status: "ACTIVE" },
      _avg: { spreadNet: true },
    }),
    db.scanLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.systemSetting.findUnique({ where: { key: "scanner_active" } }),
    db.systemSetting.findUnique({ where: { key: "spread_threshold" } }),
    db.channel.findMany(),
    db.platform.count(),
    db.tradingPair.count(),
    db.llmModel.count(),
    db.scanLog.findMany({
      take: 24,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Distribution by pair (active)
  const byPairRaw = await db.opportunity.groupBy({
    by: ["pair"],
    where: { status: "ACTIVE" },
    _count: true,
    _max: { spreadNet: true },
  });

  // Distribution by region (active)
  const byRegionRaw = await db.opportunity.groupBy({
    by: ["region"],
    where: { status: "ACTIVE" },
    _count: true,
    _avg: { spreadNet: true },
  });

  // Top opportunities by spread (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const top7d = await db.opportunity.findMany({
    where: { detectedAt: { gte: sevenDaysAgo } },
    orderBy: { spreadNet: "desc" },
    take: 5,
    select: {
      id: true,
      pair: true,
      buyPlatform: true,
      sellPlatform: true,
      spreadNet: true,
      detectedAt: true,
      status: true,
    },
  });

  // History chart data — last 7 days aggregated by day
  const history7d: { date: string; count: number; avgSpread: number; published: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const [count, published, avg] = await Promise.all([
      db.opportunity.count({
        where: { detectedAt: { gte: dayStart, lt: dayEnd } },
      }),
      db.opportunity.count({
        where: {
          detectedAt: { gte: dayStart, lt: dayEnd },
          publishedAt: { not: null },
        },
      }),
      db.opportunity.aggregate({
        where: { detectedAt: { gte: dayStart, lt: dayEnd } },
        _avg: { spreadNet: true },
      }),
    ]);
    history7d.push({
      date: dayStart.toISOString().slice(0, 10),
      count,
      published,
      avgSpread: Number((avg._avg.spreadNet ?? 0).toFixed(2)),
    });
  }

  return NextResponse.json({
    opportunities: {
      active: activeCount,
      published: publishedCount,
      expired: expiredCount,
      suspicious: suspiciousCount,
      total: totalOpportunities,
    },
    bestSpread: bestActive?.spreadNet ?? 0,
    bestOpportunity: bestActive,
    avgSpreadActive: Number((avgSpreadActive._avg.spreadNet ?? 0).toFixed(2)),
    lastScan,
    scannerActive: scannerActive?.value === "true",
    spreadThreshold: parseFloat(spreadThreshold?.value ?? "1.5"),
    channels,
    counts: {
      platforms: platformsCount,
      pairs: pairsCount,
      llms: llmsCount,
    },
    scanLogs: scanLogs24h,
    byPair: byPairRaw.map((p) => ({ pair: p.pair, count: p._count, maxSpread: Number((p._max.spreadNet ?? 0).toFixed(2)) })),
    byRegion: byRegionRaw.map((r) => ({ region: r.region, count: r._count, avgSpread: Number((r._avg.spreadNet ?? 0).toFixed(2)) })),
    top7d,
    history7d,
  });
}
