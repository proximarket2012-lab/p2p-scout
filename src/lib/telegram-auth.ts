// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Telegram WebApp Auth
// Parses Telegram Mini App `initData` to authenticate users,
// then upserts them in the User table (Prisma).
// Backend only — NEVER import this module from client code.
// ─────────────────────────────────────────────────────────────
import "server-only";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

// Raw Telegram user object as received in initData's `user` param.
// Field names are snake_case to match Telegram's JSON shape exactly.
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

// Alias for the Prisma User record stored in our database.
// Exported so callers can request both the raw Telegram payload
// (TelegramUser) and the persisted DB record (DBUser = User).
export type DBUser = User;

// Simple HTTP error thrown by requireCurrentUser when no valid initData.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// ── parseTelegramInitData ─────────────────────────────────────────
// Parse the query-string format Telegram sends in WebApp initData.
// The `user` parameter is URL-encoded JSON; we decode + parse it.
//
// NOTE: We DO NOT validate the HMAC hash signature here.
// TODO (production): validate the `hash` field using the bot token:
//   1. secret_key = HMAC-SHA256("WebAppData", bot_token)
//   2. data_check_string = sorted key=value pairs joined by \n (excluding hash)
//   3. hash = HMAC-SHA256(secret_key, data_check_string) as hex
//   4. Compare with the `hash` param. Reject if mismatch.
// See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function parseTelegramInitData(
  initData: string
): { user: TelegramUser | null; valid: boolean } {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (!userJson) {
      return { user: null, valid: false };
    }
    const parsed = JSON.parse(userJson) as TelegramUser;
    // Basic shape validation — Telegram guarantees an integer `id`.
    if (typeof parsed.id !== "number" || !Number.isFinite(parsed.id)) {
      return { user: null, valid: false };
    }
    // TODO (production): validate hash with crypto.createHmac("sha256", secretKey).
    return { user: parsed, valid: true };
  } catch {
    return { user: null, valid: false };
  }
}

// ── getCurrentUser ────────────────────────────────────────────────
// Extract initData from the request (header `X-Telegram-Init-Data`
// OR query param `tgWebAppData`), parse the user, upsert in DB.
// Returns null if no valid initData is present.
export async function getCurrentUser(req: Request): Promise<User | null> {
  // 1. Extract initData — header takes priority, query param is fallback
  //    (useful for GET requests where the client cannot set headers).
  const headerInitData = req.headers.get("x-telegram-init-data");
  let queryInitData: string | null = null;
  try {
    const url = new URL(req.url);
    queryInitData = url.searchParams.get("tgWebAppData");
  } catch {
    // req.url may be relative in some Next.js runtime contexts —
    // fall back to no query param.
    queryInitData = null;
  }
  const initData = headerInitData || queryInitData;
  if (!initData) {
    return null;
  }

  // 2. Parse + validate
  const { user, valid } = parseTelegramInitData(initData);
  if (!valid || !user) {
    return null;
  }

  // 3. Normalize language: "fr" for any fr* language_code, else "en".
  const language =
    user.language_code && user.language_code.toLowerCase().startsWith("fr")
      ? "fr"
      : "en";

  // 4. Upsert in DB by telegramId (unique).
  //    Update mutable fields on every request to keep lastSeenAt fresh.
  const dbUser = await db.user.upsert({
    where: { telegramId: String(user.id) },
    create: {
      telegramId: String(user.id),
      username: user.username ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      languageCode: user.language_code ?? null,
      language,
      isPremium: Boolean(user.is_premium),
      lastSeenAt: new Date(),
    },
    update: {
      username: user.username ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      languageCode: user.language_code ?? null,
      language,
      isPremium: Boolean(user.is_premium),
      lastSeenAt: new Date(),
    },
  });

  return dbUser;
}

// ── requireCurrentUser ────────────────────────────────────────────
// Like getCurrentUser but throws a 401 HttpError if no valid initData.
// Returns both `user` (the upserted Prisma User) and `dbUser` (alias
// to the same record, for callers that want to distinguish the raw
// Telegram payload from the DB record in their own logic).
export async function requireCurrentUser(req: Request): Promise<{
  user: User;
  dbUser: DBUser;
}> {
  const dbUser = await getCurrentUser(req);
  if (!dbUser) {
    throw new HttpError(
      401,
      "Unauthorized — no valid Telegram initData (provide X-Telegram-Init-Data header or tgWebAppData query param)"
    );
  }
  return { user: dbUser, dbUser };
}
