import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/platforms — list all configured P2P platforms
export async function GET() {
  const platforms = await db.platform.findMany({
    orderBy: { liquidity: "desc" },
  });
  return NextResponse.json({ platforms });
}
