import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

// GET /api/user/unlocks — returns the current user's unlocked opportunities (full data)
export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const unlocks = await db.opportunityUnlock.findMany({
      where: { userId: dbUser.id },
      include: { opportunity: true },
      orderBy: { unlockedAt: "desc" },
    });

    const opportunities = unlocks
      .filter((u) => u.opportunity !== null)
      .map((u) => ({
        ...u.opportunity,
        isLocked: false,
        unlockedAt: u.unlockedAt,
        starsPaid: u.starsPaid,
      }));

    return NextResponse.json({
      opportunities,
      count: opportunities.length,
      totalUnlocks: dbUser.totalUnlocks,
      starsBalance: dbUser.starsBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/user/unlocks] error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
