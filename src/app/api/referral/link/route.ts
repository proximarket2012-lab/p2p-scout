import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/telegram-auth";
import { getReferralLink } from "@/lib/referral";

export const dynamic = "force-dynamic";

// GET /api/referral/link — returns the user's personalized referral link
export async function GET(req: Request) {
  const dbUser = await getCurrentUser(req);
  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }
  const link = getReferralLink(dbUser.telegramId);
  return NextResponse.json({
    ok: true,
    link,
    telegramId: dbUser.telegramId,
  });
}
