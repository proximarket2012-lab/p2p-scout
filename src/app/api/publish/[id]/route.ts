import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/publish/[id]
// Marks the opportunity as published on both Telegram channels (FR + EN).
// In production: this calls the Telegram Bot API with python-telegram-bot equivalent.
// Here: we mark as PUBLISHED + simulate the publish timestamp.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const opp = await db.opportunity.findUnique({ where: { id } });
  if (!opp) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }
  if (!opp.messageFr || !opp.messageEn) {
    return NextResponse.json(
      { error: "Messages not generated. Generate FR + EN first." },
      { status: 400 }
    );
  }

  await db.opportunity.update({
    where: { id },
    data: {
      publishedAt: new Date(),
    },
  });

  // Update the latest scan log counter
  const lastLog = await db.scanLog.findFirst({ orderBy: { createdAt: "desc" } });
  if (lastLog) {
    await db.scanLog.update({
      where: { id: lastLog.id },
      data: { opportunitiesPublished: { increment: 1 } },
    });
  }

  return NextResponse.json({
    ok: true,
    publishedAt: new Date().toISOString(),
    channels: ["FR", "EN"],
    note: "Simulated publish (set PUBLISHED + publishedAt). In production, the GitHub Actions workflow calls the Telegram Bot API.",
  });
}
