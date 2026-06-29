import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackReferral } from "@/lib/referral";

export const dynamic = "force-dynamic";

// POST /api/bot-webhook
// Handles Telegram bot updates (webhook).
// Handles /start commands:
//   /start          → welcome + Mini App button
//   /start app      → welcome + Mini App button
//   /start ref_XXX  → track referral + welcome + Mini App button
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: true });
    }

    const message = body?.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;
    const fromUser = message?.from;

    if (!chatId || !fromUser || !text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const startParam = text.replace("/start", "").trim();
    const isFr = (fromUser.language_code || "fr").startsWith("fr");
    const miniAppUrl = process.env.MINI_APP_URL || "https://p2p-scout-yt8i.vercel.app";

    // ── Track referral if start param is ref_XXX ──
    if (startParam.startsWith("ref_")) {
      const referrerTgId = startParam.replace("ref_", "");
      const refereeTgId = String(fromUser.id);

      // Upsert the new user
      const language = fromUser.language_code?.toLowerCase().startsWith("fr") ? "fr" : "en";
      const dbUser = await db.user.upsert({
        where: { telegramId: refereeTgId },
        create: {
          telegramId: refereeTgId,
          username: fromUser.username ?? null,
          firstName: fromUser.first_name ?? null,
          lastName: fromUser.last_name ?? null,
          languageCode: fromUser.language_code ?? null,
          language,
          isPremium: Boolean(fromUser.is_premium),
          lastSeenAt: new Date(),
        },
        update: {
          username: fromUser.username ?? null,
          firstName: fromUser.first_name ?? null,
          lastName: fromUser.last_name ?? null,
          languageCode: fromUser.language_code ?? null,
          language,
          isPremium: Boolean(fromUser.is_premium),
          lastSeenAt: new Date(),
        },
      });

      // Track the referral
      await trackReferral(referrerTgId, refereeTgId, dbUser.id);
    }

    // ── Send welcome message with Mini App button ──
    const welcomeText = isFr
      ? "🚀 Bienvenue sur P2P Arbitrage Scout !\n\nClique sur le bouton ci-dessous pour ouvrir la Mini App et accéder aux opportunités d'arbitrage P2P.\n\n💰 Astuce : Partage ton lien de parrainage dans la Mini App et gagne 10,4% des dépenses de tes amis !"
      : "🚀 Welcome to P2P Arbitrage Scout!\n\nClick the button below to open the Mini App and access P2P arbitrage opportunities.\n\n💰 Tip: Share your referral link in the Mini App and earn 10.4% of your friends' spending!";

    const replyBody = {
      chat_id: chatId,
      text: welcomeText,
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot-webhook] error:", err);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}
