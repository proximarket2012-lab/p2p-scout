import { NextResponse } from "next/server";
import { testTelegramBot, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// GET /api/telegram-test — test bot connectivity
export async function GET() {
  const result = await testTelegramBot();
  return NextResponse.json({
    ...result,
    frChannelId: process.env.TELEGRAM_CHANNEL_FR_ID ? "set" : "NOT SET",
    enChannelId: process.env.TELEGRAM_CHANNEL_EN_ID ? "set" : "NOT SET",
    botToken: process.env.TELEGRAM_BOT_TOKEN ? "set" : "NOT SET",
  });
}

// POST /api/telegram-test — send a test message to a channel
// Body: { "channel": "FR" | "EN", "message": "test text" }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const channel = body.channel || "FR";
    const message = body.message || "🧪 Test message from P2P Arbitrage Scout";

    const chatId = channel === "FR"
      ? process.env.TELEGRAM_CHANNEL_FR_ID
      : process.env.TELEGRAM_CHANNEL_EN_ID;

    if (!chatId) {
      return NextResponse.json(
        { ok: false, error: `TELEGRAM_CHANNEL_${channel}_ID not set` },
        { status: 400 }
      );
    }

    const result = await sendTelegramMessage(chatId, message);
    return NextResponse.json({
      channel,
      chatId,
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
