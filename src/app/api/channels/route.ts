import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/channels — list Telegram channels (FR + EN) with SEO content
export async function GET() {
  const channels = await db.channel.findMany({
    orderBy: { language: "asc" },
  });
  return NextResponse.json({ channels });
}
