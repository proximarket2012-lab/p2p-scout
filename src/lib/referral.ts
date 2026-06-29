// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Referral System
// Generates personalized referral links, tracks referrals,
// and records commission on Stars purchases.
// ─────────────────────────────────────────────────────────────
import "server-only";
import { db } from "@/lib/db";

const COMMISSION_RATE = 0.104; // 10.4% (Telegram Stars affiliate rate)
const BOT_USERNAME = "P2PScout2026Bot";

// Generate a personalized referral link for a user
export function getReferralLink(telegramId: string): string {
  return `https://t.me/${BOT_USERNAME}?start=ref_${telegramId}`;
}

// Track a referral — called when a new user opens the bot via a ref link.
// referrerTgId = the Telegram ID extracted from the start parameter (ref_XXX)
// refereeTgId = the new user's Telegram ID
// refereeDbId = the new user's DB ID
export async function trackReferral(
  referrerTgId: string,
  refereeTgId: string,
  refereeDbId: string
): Promise<{ ok: boolean; alreadyReferred: boolean; error?: string }> {
  // Don't allow self-referral
  if (referrerTgId === refereeTgId) {
    return { ok: false, alreadyReferred: false, error: "Self-referral not allowed" };
  }

  // Find the referrer in DB
  const referrer = await db.user.findUnique({
    where: { telegramId: referrerTgId },
  });
  if (!referrer) {
    return { ok: false, alreadyReferred: false, error: "Referrer not found" };
  }

  // Check if this referee was already referred by someone
  const existing = await db.referral.findFirst({
    where: { refereeId: refereeDbId },
  });
  if (existing) {
    return { ok: true, alreadyReferred: true };
  }

  // Create the referral record
  try {
    await db.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: refereeDbId,
        referrerTgId,
        refereeTgId,
        status: "PENDING",
      },
    });
    return { ok: true, alreadyReferred: false };
  } catch {
    // Unique constraint violation = already referred
    return { ok: true, alreadyReferred: true };
  }
}

// Record commission when a referee makes a Stars purchase.
// Called from the unlock flow (processUnlock or stars/verify).
// Returns the commission amount in Stars.
export async function recordReferralCommission(
  refereeDbId: string,
  starsSpent: number
): Promise<{ commission: number; referrerId: string | null }> {
  // Find the referral for this referee
  const referral = await db.referral.findFirst({
    where: { refereeId: refereeDbId },
  });
  if (!referral) {
    return { commission: 0, referrerId: null };
  }

  const commission = Math.floor(starsSpent * COMMISSION_RATE);
  if (commission <= 0) {
    return { commission: 0, referrerId: referral.referrerId };
  }

  // Update the referral with accumulated commission
  await db.referral.update({
    where: { id: referral.id },
    data: {
      totalCommission: { increment: commission },
      status: "ACTIVE",
      activatedAt: new Date(),
    },
  });

  return { commission, referrerId: referral.referrerId };
}

// Get referral stats for a user (for the Mini App dashboard)
export async function getReferralStats(dbUserId: string): Promise<{
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  recentReferrals: {
    refereeName: string | null;
    status: string;
    commission: number;
    referredAt: Date;
  }[];
}> {
  const user = await db.user.findUnique({
    where: { id: dbUserId },
    select: { telegramId: true },
  });

  const referralLink = user ? getReferralLink(user.telegramId) : "";

  const referrals = await db.referral.findMany({
    where: { referrerId: dbUserId },
    orderBy: { referredAt: "desc" },
    take: 20,
  });

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "ACTIVE").length;
  const totalCommission = referrals.reduce((sum, r) => sum + r.totalCommission, 0);

  // Get referee names
  const refereeIds = referrals.map((r) => r.refereeId);
  const referees = await db.user.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true, firstName: true, username: true },
  });
  const refereeMap = new Map(referees.map((r) => [r.id, r]));

  return {
    referralLink,
    totalReferrals,
    activeReferrals,
    totalCommission,
    recentReferrals: referrals.map((r) => ({
      refereeName: refereeMap.get(r.refereeId)?.firstName || refereeMap.get(r.refereeId)?.username || null,
      status: r.status,
      commission: r.totalCommission,
      referredAt: r.referredAt,
    })),
  };
}
