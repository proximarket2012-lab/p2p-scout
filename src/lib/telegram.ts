// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Telegram Publisher
// Sends messages to Telegram channels via Bot API
// Backend only — uses TELEGRAM_BOT_TOKEN + channel IDs from env
// ─────────────────────────────────────────────────────────────
import "server-only";

interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

// Get the Mini App URL — must be HTTPS for Telegram web_app buttons
function getMiniAppUrl(): string {
  // Priority: MINI_APP_URL env var > hardcoded production URL
  // Do NOT use VERCEL_URL — it's an internal URL without https:// prefix
  const url = process.env.MINI_APP_URL || "https://p2p-scout-yt8i.vercel.app";
  // Ensure it starts with https://
  if (!url.startsWith("https://")) {
    return `https://${url.replace(/^https?:\/\//, "")}`;
  }
  return url;
}

// Send a message to a Telegram channel via Bot API
// Options:
//   - withMiniAppButton: adds an inline keyboard button that opens the Mini App
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { withMiniAppButton?: boolean }
): Promise<TelegramSendResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  if (!chatId) {
    return { ok: false, error: "chat_id is empty" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  // Add inline keyboard with Mini App button if requested
  // Channels DON'T support web_app buttons — only URL buttons.
  // We use a t.me/<bot>?start=app URL which opens the bot chat.
  // The bot's menu button (configured via @BotFather /setmenubutton) opens the Mini App.
  // So the flow is: channel message → button → bot chat → menu button → Mini App (with initData)
  if (options?.withMiniAppButton) {
    const botUsername = process.env.BOT_USERNAME || "P2PScout2026Bot";
    const cleanUsername = botUsername.replace("@", "");
    body.reply_markup = JSON.stringify({
      inline_keyboard: [[
        {
          text: "🚀 Ouvrir la Mini App",
          url: `https://t.me/${cleanUsername}?start=app`,
        },
      ]],
    });
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return {
        ok: false,
        error: `Telegram API error: ${data.description || data.error_code || "unknown"}`,
      };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Telegram error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

// Publish an opportunity to BOTH channels (FR + EN)
// Always includes the Mini App quick-access button
export async function publishToBothChannels(
  messageFr: string,
  messageEn: string,
  options?: { withMiniAppButton?: boolean }
): Promise<{
  fr: TelegramSendResult;
  en: TelegramSendResult;
}> {
  const frChatId = process.env.TELEGRAM_CHANNEL_FR_ID;
  const enChatId = process.env.TELEGRAM_CHANNEL_EN_ID;

  // Default: always add the Mini App button
  const opts = { withMiniAppButton: options?.withMiniAppButton ?? true };

  // Send FR + EN in parallel for speed
  const [fr, en] = await Promise.all([
    sendTelegramMessage(frChatId || "", messageFr, opts),
    sendTelegramMessage(enChatId || "", messageEn, opts),
  ]);

  return { fr, en };
}

// Test Telegram bot connectivity (used by health check)
export async function testTelegramBot(): Promise<{
  ok: boolean;
  botUsername?: string;
  error?: string;
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return {
        ok: true,
        botUsername: `@${data.result.username}`,
      };
    }
    return { ok: false, error: data.description || "Bot token invalid" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
