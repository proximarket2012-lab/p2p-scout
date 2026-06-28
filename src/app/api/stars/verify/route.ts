import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/telegram-auth";
import { verifyStarsPayment, processUnlock } from "@/lib/stars";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/stars/verify — verifies a Stars payment and processes unlock
// Body: { opportunityId: string, telegramChargeId?: string }
export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { opportunityId, telegramChargeId } = body as {
      opportunityId?: string;
      telegramChargeId?: string;
    };

    if (!opportunityId) {
      return NextResponse.json(
        { ok: false, error: "opportunityId is required" },
        { status: 400 }
      );
    }

    const opp = await db.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) {
      return NextResponse.json(
        { ok: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // If telegramChargeId provided, verify the payment was actually received
    if (telegramChargeId) {
      const verification = await verifyStarsPayment(telegramChargeId);
      if (!verification.ok || !verification.paid) {
        return NextResponse.json(
          { ok: false, error: "Payment not verified by Telegram" },
          { status: 400 }
        );
      }
    } else {
      // No charge ID — log warning (in production, this should be enforced)
      console.warn(`[stars/verify] No telegramChargeId for opp=${opportunityId} user=${dbUser.id} — processing anyway`);
    }

    // Process the unlock (idempotent)
    const result = await processUnlock({
      userId: dbUser.id,
      opportunityId: opp.id,
      starsPaid: opp.starsPrice,
      telegramChargeId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to process unlock" },
        { status: 500 }
      );
    }

    // Return the full opportunity data (now visible to user)
    return NextResponse.json({
      ok: true,
      opportunity: opp,
      starsPaid: opp.starsPrice,
      newTotalUnlocks: dbUser.totalUnlocks + 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/stars/verify] error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
