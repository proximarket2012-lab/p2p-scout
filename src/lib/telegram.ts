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

// Send a message to a Telegram channel via Bot API
// Returns { ok, messageId, error }
export async function sendTelegramMessage(
  chatId: string,
  text: string
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

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
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
// Returns { fr, en } with success/error for each
export async function publishToBothChannels(
  messageFr: string,
  messageEn: string
): Promise<{
  fr: TelegramSendResult;
  en: TelegramSendResult;
}> {
  const frChatId = process.env.TELEGRAM_CHANNEL_FR_ID;
  const enChatId = process.env.TELEGRAM_CHANNEL_EN_ID;

  // Send FR + EN in parallel for speed
  const [fr, en] = await Promise.all([
    sendTelegramMessage(frChatId || "", messageFr),
    sendTelegramMessage(enChatId || "", messageEn),
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
