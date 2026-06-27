import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/channels — list Telegram channels (FR + EN) with SEO content
export async function GET() {
  try {
    const channels = await db.channel.findMany({
      orderBy: { language: "asc" },
    });
    return NextResponse.json({ channels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    console.error("[/api/channels] error:", message);
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
