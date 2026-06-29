import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/telegram-auth";
import { getReferralStats } from "@/lib/referral";

export const dynamic = "force-dynamic";

// GET /api/referral/stats — returns referral stats for the dashboard
export async function GET(req: Request) {
  const dbUser = await getCurrentUser(req);
  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }
  const stats = await getReferralStats(dbUser.id);
  return NextResponse.json({ ok: true, ...stats });
}
