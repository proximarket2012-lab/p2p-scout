// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Telegram Stars Payment Integration
// Creates Stars invoices via Bot API, verifies payments against
// getStarTransactions, and records unlocks idempotently.
// Backend only — uses TELEGRAM_BOT_TOKEN + Prisma.
// ─────────────────────────────────────────────────────────────
import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const REQUEST_TIMEOUT_MS = 15_000; // 15s per Bot API call

// ── createStarsInvoice ────────────────────────────────────────────
// Calls the Bot API createInvoiceLink method to create a Telegram
// Stars invoice. Currency is "XTR" (Telegram's internal Stars currency).
// Returns the invoice URL which the frontend opens via
// `Telegram.WebApp.openInvoiceLink(url)`.
export async function createStarsInvoice(params: {
  title: string;
  description: string;
  payload: string; // JSON string with opportunityId + userId
  prices: { amount: number }[];
}): Promise<{ ok: boolean; invoiceUrl?: string; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        payload: params.payload,
        currency: "XTR",
        prices: params.prices.map((p) => ({
          label: "Unlock opportunity",
          amount: p.amount,
        })),
      }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!data.ok) {
      return {
        ok: false,
        error: `Telegram API error: ${data.description || data.error_code || "unknown"}`,
      };
    }

    // createInvoiceLink returns the URL directly as `result` (string).
    const invoiceUrl: string | undefined =
      typeof data.result === "string" ? data.result : data.result?.url;
    if (!invoiceUrl) {
      return { ok: false, error: "Telegram returned no invoice URL" };
    }

    return { ok: true, invoiceUrl };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Telegram API request timed out (15s)"
          : err.message
        : "Unknown Telegram error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

// ── verifyStarsPayment ────────────────────────────────────────────
// Calls getStarTransactions Bot API method and searches the recent
// transactions for the given telegramChargeId. Returns whether the
// payment was actually received.
//
// NOTE: getStarTransactions returns paginated results. We fetch the
// most recent 100 transactions and search them. For high-volume bots,
// you'd want to store the charge ID at invoice creation time and
// match against the corresponding transaction by date proximity.
export async function verifyStarsPayment(
  telegramChargeId: string
): Promise<{ ok: boolean; paid: boolean }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { ok: false, paid: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}${botToken}/getStarTransactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100, offset: 0 }),
        signal: controller.signal,
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return { ok: false, paid: false };
    }

    const transactions: Record<string, unknown>[] =
      data.result?.transactions || [];

    for (const tx of transactions) {
      // Telegram Star transactions expose a unique `id`. Incoming
      // payments (user → bot) have this id in the `source` object;
      // outgoing charges also expose it at the top level. Match
      // generously to be robust against API shape changes.
      if (tx.id === telegramChargeId) {
        return { ok: true, paid: true };
      }
      const source = tx.source;
      if (source && typeof source === "object") {
        const sourceRecord = source as Record<string, unknown>;
        if (sourceRecord.transaction_id === telegramChargeId) {
          return { ok: true, paid: true };
        }
      }
    }

    return { ok: true, paid: false };
  } catch {
    return { ok: false, paid: false };
  } finally {
    clearTimeout(timeout);
  }
}

// ── processUnlock ─────────────────────────────────────────────────
// Records a successful Stars unlock for an opportunity:
//   1. (Idempotent) If already unlocked by this user → return ok.
//   2. Create OpportunityUnlock record.
//   3. Create StarsTransaction (type=UNLOCK, amount=-starsPaid).
//   4. Increment user.totalUnlocks.
//
// All three writes happen in a single Prisma transaction for
// atomicity. The @@unique([userId, opportunityId]) constraint on
// OpportunityUnlock guarantees idempotency at the DB level — if two
// concurrent requests both pass the pre-check, exactly one will
// succeed and the other will get P2002 (treated as ok / idempotent).
export async function processUnlock(params: {
  userId: string;
  opportunityId: string;
  starsPaid: number;
  telegramChargeId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.$transaction(async (tx) => {
      // Idempotency check inside the transaction to avoid race conditions.
      const existing = await tx.opportunityUnlock.findUnique({
        where: {
          userId_opportunityId: {
            userId: params.userId,
            opportunityId: params.opportunityId,
          },
        },
      });
      if (existing) {
        // Already unlocked — idempotent no-op.
        return;
      }

      // 1. Create the unlock record.
      await tx.opportunityUnlock.create({
        data: {
          userId: params.userId,
          opportunityId: params.opportunityId,
          starsPaid: params.starsPaid,
          telegramChargeId: params.telegramChargeId ?? null,
        },
      });

      // 2. Append a ledger entry (negative = unlock spend).
      await tx.starsTransaction.create({
        data: {
          userId: params.userId,
          amount: -Math.abs(params.starsPaid),
          type: "UNLOCK",
          opportunityId: params.opportunityId,
          telegramChargeId: params.telegramChargeId ?? null,
          status: "COMPLETED",
        },
      });

      // 3. Bump the user's unlock counter.
      await tx.user.update({
        where: { id: params.userId },
        data: { totalUnlocks: { increment: 1 } },
      });
    });

    // 4. Record referral commission (outside transaction — non-critical, don't fail unlock)
    try {
      const { recordReferralCommission } = await import("@/lib/referral");
      await recordReferralCommission(params.userId, params.starsPaid);
    } catch {
      // Silent — referral commission is best-effort, don't fail the unlock
    }

    return { ok: true };
  } catch (err) {
    // P2002 = unique constraint violation — concurrent request already
    // created the unlock. Treat as idempotent success.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: true };
    }
    const msg =
      err instanceof Error ? err.message : "Unknown unlock processing error";
    return { ok: false, error: msg };
  }
}
