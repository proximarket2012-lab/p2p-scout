import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/platforms — list all configured P2P platforms
export async function GET() {
  try {
    const platforms = await db.platform.findMany({
      orderBy: { liquidity: "desc" },
    });
    return NextResponse.json({ platforms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    console.error("[/api/platforms] error:", message);
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
