import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOpportunityMessage, type OpportunityInput } from "@/lib/llm";

export const dynamic = "force-dynamic";

// POST /api/generate/[id]?lang=FR|EN
// Generates a Telegram-ready message via LLM (z-ai-web-dev-sdk, backend only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") || "FR").toUpperCase() as "FR" | "EN";

  const opp = await db.opportunity.findUnique({ where: { id } });
  if (!opp) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  // If message already generated for this language, return cached
  if (lang === "FR" && opp.messageFr) {
    return NextResponse.json({ ok: true, message: opp.messageFr, llmModel: opp.llmModel, cached: true });
  }
  if (lang === "EN" && opp.messageEn) {
    return NextResponse.json({ ok: true, message: opp.messageEn, llmModel: opp.llmModel, cached: true });
  }

  const input: OpportunityInput = {
    pair: opp.pair,
    fiat: opp.fiat,
    region: opp.region,
    buyPlatform: opp.buyPlatform,
    sellPlatform: opp.sellPlatform,
    buyPrice: opp.buyPrice,
    sellPrice: opp.sellPrice,
    spreadBrut: opp.spreadBrut,
    spreadNet: opp.spreadNet,
    feesTotal: opp.feesTotal,
    buyMerchant: opp.buyMerchant,
    sellMerchant: opp.sellMerchant,
    buyMerchantRating: opp.buyMerchantRating,
    sellMerchantRating: opp.sellMerchantRating,
    buyTrades: opp.buyTrades,
    sellTrades: opp.sellTrades,
    volumeAvailable: opp.volumeAvailable,
    durationMin: opp.durationMin,
  };

  const result = await generateOpportunityMessage(input, lang);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "LLM generation failed (all models exhausted)" },
      { status: 502 }
    );
  }

  // Persist generated message
  await db.opportunity.update({
    where: { id },
    data: lang === "FR"
      ? { messageFr: result.content, llmModel: result.llmModel }
      : { messageEn: result.content, llmModel: result.llmModel },
  });

  return NextResponse.json({ ok: true, message: result.content, llmModel: result.llmModel, cached: false });
}
