import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

// GET /api/setup-webhook
// Sets the Telegram bot webhook + menu button so the bot can respond to
// /start app commands with a web_app button (native, carries initData).
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const appUrl = process.env.MINI_APP_URL || "https://p2p-scout-yt8i.vercel.app";
  const webhookUrl = `${appUrl}/api/bot-webhook`;

  try {
    // 1. Set webhook
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const data = await res.json();

    // 2. Set menu button (web_app type — opens Mini App directly)
    const menuRes = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "🚀 Mini App",
          web_app: { url: appUrl },
        },
      }),
    });
    const menuData = await menuRes.json();

    return NextResponse.json({
      ok: true,
      webhook: { url: webhookUrl, set: data.ok, description: data.description },
      menuButton: { set: menuData.ok, url: appUrl },
      flow: "Channel → button → bot chat → menu button OR /start reply → Mini App with initData → payment works",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
