import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/bot-webhook
// Handles Telegram bot updates (webhook).
// When user clicks the channel button → opens bot chat with /start app
// → Telegram sends this webhook → bot replies with a web_app button
// → user clicks it → Mini App opens with initData (authenticated).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, error: "No bot token" }, { status: 500 });
    }

    // Handle /start app command
    const message = body?.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;

    if (chatId && text.startsWith("/start")) {
      const startParam = text.replace("/start", "").trim();

      if (startParam === "app" || startParam === "") {
        // Send a message with a native web_app button (works in private bot chats)
        const miniAppUrl = process.env.MINI_APP_URL || "https://p2p-scout-yt8i.vercel.app";
        const isFr = (message?.from?.language_code || "fr").startsWith("fr");

        const replyBody = {
          chat_id: chatId,
          text: isFr
            ? "🚀 Bienvenue ! Clique sur le bouton ci-dessous pour ouvrir la Mini App et accéder aux opportunités d'arbitrage P2P."
            : "🚀 Welcome! Click the button below to open the Mini App and access P2P arbitrage opportunities.",
          parse_mode: "HTML",
          reply_markup: JSON.stringify({
            inline_keyboard: [[
              {
                text: isFr ? "🚀 Ouvrir la Mini App" : "🚀 Open Mini App",
                web_app: { url: miniAppUrl },
              },
            ]],
          }),
        };

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(replyBody),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot-webhook] error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
