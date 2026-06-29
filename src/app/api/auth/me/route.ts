import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

// GET /api/auth/me — returns current authenticated user (or null if not in Telegram WebApp context)
export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json({
        user: null,
        authenticated: false,
        message: "Not in Telegram WebApp context. Open via @P2PScout2026Bot to authenticate.",
      });
    }
    return NextResponse.json({
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        language: dbUser.language,
        starsBalance: dbUser.starsBalance,
        totalUnlocks: dbUser.totalUnlocks,
        isPremium: dbUser.isPremium,
      },
      authenticated: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { user: null, authenticated: false, error: message },
      { status: 500 }
    );
  }
}
