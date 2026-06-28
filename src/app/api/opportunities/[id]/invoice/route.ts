import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/telegram-auth";
import { createStarsInvoice } from "@/lib/stars";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/opportunities/[id]/invoice — creates a Telegram Stars invoice for unlocking
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "Authentication required. Open via Telegram." },
        { status: 401 }
      );
    }

    const opp = await db.opportunity.findUnique({ where: { id } });
    if (!opp) {
      return NextResponse.json(
        { ok: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }
    if (opp.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: `Opportunity is ${opp.status}, cannot unlock` },
        { status: 400 }
      );
    }

    // Check if already unlocked
    const existing = await db.opportunityUnlock.findUnique({
      where: {
        userId_opportunityId: {
          userId: dbUser.id,
          opportunityId: opp.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyUnlocked: true,
        opportunityId: opp.id,
      });
    }

    // Create Telegram Stars invoice
    const lang = dbUser.language as "fr" | "en";
    const title = lang === "fr"
      ? `Débloquer ${opp.pair} +${opp.spreadNet}%`
      : `Unlock ${opp.pair} +${opp.spreadNet}%`;
    const description = lang === "fr"
      ? "Accès complet au guide d'arbitrage : plateformes, vendeurs, prix d'achat/vente, calcul du bénéfice détaillé, message Telegram FR+EN."
      : "Full access to the arbitrage guide: platforms, sellers, buy/sell prices, detailed profit calculation, Telegram message FR+EN.";

    const payload = JSON.stringify({
      oppId: opp.id,
      userId: dbUser.id,
      stars: opp.starsPrice,
      ts: Date.now(),
    });

    const invoice = await createStarsInvoice({
      title,
      description,
      payload,
      prices: [{ amount: opp.starsPrice }],
    });

    if (!invoice.ok || !invoice.invoiceUrl) {
      return NextResponse.json(
        { ok: false, error: invoice.error || "Failed to create invoice" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      invoiceUrl: invoice.invoiceUrl,
      starsPrice: opp.starsPrice,
      opportunityId: opp.id,
      opportunityPair: opp.pair,
      opportunitySpread: opp.spreadNet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/opportunities/[id]/invoice] error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
