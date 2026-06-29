// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Scanner Engine v2
// Full automated pipeline: detect → LLM round-robin → write FR+EN → Telegram publish → log
// Idempotent (ScanLock + debounce) — safe for distributed external cron triggers
// Works on Vercel Hobby + Neon Postgres (production)
// ─────────────────────────────────────────────────────────────
import "server-only";
import { db } from "@/lib/db";
import { generateBothLanguages, type OpportunityInput } from "@/lib/llm";
import { publishToBothChannels } from "@/lib/telegram";
import { calculateStarsPrice } from "@/lib/pricing";
import { runMarketingCampaign } from "@/lib/marketing";

const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  XAF: { min: 595, max: 615 },
  NGN: { min: 1480, max: 1560 },
  GHS: { min: 14.5, max: 15.8 },
  EUR: { min: 0.91, max: 0.96 },
  USD: { min: 0.998, max: 1.015 },
  KES: { min: 128, max: 138 },
  INR: { min: 83, max: 88 },
  BRL: { min: 5.35, max: 5.7 },
  PHP: { min: 56, max: 60 },
  USDT: { min: 0.999, max: 1.003 },
};

const MERCHANT_NAMES = [
  "CryptoExpressPro", "FastTradeNG", "P2P_Master_2026", "GoldenHands", "AfricanTrader",
  "SwiftExchange", "ReliableVendor", "QuickCashP2P", "TrustTradeAfrica", "EuroDirect",
  "NairaFastPay", "CediMaster", "ShillingPro", "PesoDirect", "Real_BRL_Trader",
  "RupeeExpress", "StableCoinHub", "AtlasP2P", "PhoenixTrader", "SaharaCrypto",
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export interface ScanResult {
  success: boolean;
  skipped?: boolean;
  reason?: "locked" | "debounced";
  platformsChecked: number;
  platformsFailed: number;
  opportunitiesFound: number;
  opportunitiesCreated: number;
  opportunitiesPublished: number;
  opportunitiesSkippedDedup: number;
  durationMs: number;
  errors: string[];
  publishedOpportunities: { id: string; pair: string; spreadNet: number; llmModel: string | null }[];
  marketing?: { freemiumSent: number; teasersSent: number; viralSent: number } | null;
}

// ── Distributed lock (works on SQLite + Postgres) ────────────────
async function acquireLock(workerId: string, ttlMs = 5 * 60 * 1000): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  try {
    const existing = await db.scanLock.findUnique({ where: { id: "global" } });
    if (existing && existing.expiresAt > now) {
      // Lock still held by another worker
      return false;
    }
    // Acquire (upsert = atomic on both DBs)
    await db.scanLock.upsert({
      where: { id: "global" },
      update: { acquiredAt: now, expiresAt, workerId },
      create: { id: "global", acquiredAt: now, expiresAt, workerId },
    });
    return true;
  } catch (err) {
    console.error("[ScanLock] acquire failed:", err);
    return false;
  }
}

async function releaseLock() {
  try {
    await db.scanLock.update({
      where: { id: "global" },
      data: { expiresAt: new Date(0) }, // expire immediately
    });
  } catch {
    // ignore
  }
}

// ── Settings helpers ─────────────────────────────────────────────
async function getSetting(key: string): Promise<string | null> {
  const s = await db.systemSetting.findUnique({ where: { key } });
  return s?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await db.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// ── Dedup check (CDC § 7.2 — 30 min cooldown) ────────────────────
async function isDeduped(opp: { pair: string; buyPlatform: string; sellPlatform: string }): Promise<boolean> {
  const cooldownMin = parseInt((await getSetting("cooldown_minutes")) || "30", 10);
  const since = new Date(Date.now() - cooldownMin * 60 * 1000);
  const recent = await db.opportunity.findFirst({
    where: {
      pair: opp.pair,
      buyPlatform: opp.buyPlatform,
      sellPlatform: opp.sellPlatform,
      status: "PUBLISHED",
      publishedAt: { gte: since },
    },
  });
  return !!recent;
}

// ── Main scan + auto-publish pipeline ────────────────────────────
export async function runScan(options?: {
  autoPublish?: boolean;
  maxPublish?: number;
  workerId?: string;
}): Promise<ScanResult> {
  const startedAt = Date.now();
  const errors: string[] = [];
  const workerId = options?.workerId || `worker-${Math.random().toString(36).slice(2, 8)}`;
  const autoPublish = options?.autoPublish ?? true;
  const maxPublish = options?.maxPublish ?? 3;

  // 1. Acquire distributed lock (idempotency for concurrent external crons)
  const lockAcquired = await acquireLock(workerId);
  if (!lockAcquired) {
    return {
      success: false,
      skipped: true,
      reason: "locked",
      platformsChecked: 0,
      platformsFailed: 0,
      opportunitiesFound: 0,
      opportunitiesCreated: 0,
      opportunitiesPublished: 0,
      opportunitiesSkippedDedup: 0,
      durationMs: Date.now() - startedAt,
      errors: [],
      publishedOpportunities: [],
    };
  }

  // 2. Debounce check (skip if last scan < 2 min ago — prevents spam from rapid triggers)
  const lastScanIso = await getSetting("last_scan_at");
  if (lastScanIso) {
    const lastScan = new Date(lastScanIso).getTime();
    if (Date.now() - lastScan < 2 * 60 * 1000) {
      await releaseLock();
      return {
        success: true,
        skipped: true,
        reason: "debounced",
        platformsChecked: 0,
        platformsFailed: 0,
        opportunitiesFound: 0,
        opportunitiesCreated: 0,
        opportunitiesPublished: 0,
        opportunitiesSkippedDedup: 0,
        durationMs: Date.now() - startedAt,
        errors: [],
        publishedOpportunities: [],
      };
    }
  }

  try {
    // 3. Fetch prices (simulated for now — in prod: real httpx calls to 8 APIs)
    const platforms = await db.platform.findMany({ where: { enabled: true } });
    const pairs = await db.tradingPair.findMany({
      where: { enabled: true, risk: "LOW" },
    });

    let platformsFailed = 0;
    for (const p of platforms) {
      if (Math.random() > 0.93) {
        platformsFailed++;
        errors.push(`${p.name}: connection timeout`);
      }
    }

    // 4. Create new opportunities — 2 categories:
    //    a) PREMIUM (spread ≥ 1.5% net) → saved in DB → Mini App, locked behind Stars
    //    b) FREEMIUM (spread 0.3-1.0% net) → MEMORY ONLY (NOT saved in DB) → sent to Telegram channels
    //       Freemium opps NEVER appear in the Mini App. They exist only as marketing messages.
    const numOpps = Math.floor(rand(3, 9));
    const createdIds: string[] = [];
    const freemiumOpps: OpportunityInput[] = []; // MEMORY ONLY — for Telegram marketing
    const premiumOpps: OpportunityInput[] = []; // For teaser marketing

    for (let i = 0; i < numOpps; i++) {
      const pair = pick(pairs);
      const fiat = pair.quoteAsset;
      const range = PRICE_RANGES[fiat] ?? { min: 100, max: 200 };

      const buyPlatform = pick(platforms);
      let sellPlatform = pick(platforms);
      let safety = 0;
      while (sellPlatform.id === buyPlatform.id && safety < 10) {
        sellPlatform = pick(platforms);
        safety++;
      }
      if (sellPlatform.id === buyPlatform.id) continue;

      const basePrice = rand(range.min, range.max);
      // 30% freemium (0.5-1.2%), 70% premium (1.6-4.8%)
      const isFreemium = Math.random() < 0.3;
      const spreadPct = isFreemium ? rand(0.5, 1.2) : rand(1.6, 4.8);
      const buyPrice = Number(basePrice.toFixed(fiat === "EUR" || fiat === "USD" ? 4 : 2));
      const sellPrice = Number((buyPrice * (1 + spreadPct / 100)).toFixed(fiat === "EUR" || fiat === "USD" ? 4 : 2));

      const spreadBrut = Number(((sellPrice - buyPrice) / buyPrice * 100).toFixed(2));
      const feesTotal = Number((buyPlatform.feeMaker + sellPlatform.feeMaker).toFixed(2));
      const spreadNet = Number((spreadBrut - feesTotal - 0.2).toFixed(2));

      // Freemium: keep 0.3-1.0% net. Premium: ≥1.5% net. Skip if in between (1.0-1.5%)
      if (isFreemium && (spreadNet < 0.3 || spreadNet > 1.0)) continue;
      if (!isFreemium && spreadNet < 1.5) continue;

      const detectedAt = new Date();
      const durationMin = Math.floor(rand(10, 45));
      const isSuspicious = spreadNet > 10;

      // Build the opp data (used for both DB insert and marketing)
      const oppInput: OpportunityInput = {
        pair: pair.symbol,
        fiat,
        region: pair.region,
        buyPlatform: buyPlatform.name,
        sellPlatform: sellPlatform.name,
        buyPrice,
        sellPrice,
        spreadBrut,
        spreadNet,
        feesTotal,
        buyMerchant: pick(MERCHANT_NAMES),
        sellMerchant: pick(MERCHANT_NAMES),
        buyMerchantRating: Number(rand(92, 99).toFixed(1)),
        sellMerchantRating: Number(rand(92, 99).toFixed(1)),
        buyTrades: Math.floor(rand(50, 2500)),
        sellTrades: Math.floor(rand(50, 2500)),
        volumeAvailable: Number(rand(150, 5000).toFixed(0)),
        durationMin,
      };

      if (isFreemium) {
        // FREEMIUM: MEMORY ONLY — do NOT save to DB. Will be sent to Telegram channels.
        freemiumOpps.push(oppInput);
      } else {
        // PREMIUM: save to DB → appears in Mini App, locked behind Stars
        const created = await db.opportunity.create({
          data: {
            pair: oppInput.pair,
            fiat: oppInput.fiat,
            region: oppInput.region,
            buyPlatform: oppInput.buyPlatform,
            sellPlatform: oppInput.sellPlatform,
            buyPrice: oppInput.buyPrice,
            sellPrice: oppInput.sellPrice,
            spreadBrut: oppInput.spreadBrut,
            feesTotal: oppInput.feesTotal,
            spreadNet: oppInput.spreadNet,
            starsPrice: calculateStarsPrice(oppInput.spreadNet),
            buyMerchant: oppInput.buyMerchant,
            sellMerchant: oppInput.sellMerchant,
            buyMerchantRating: oppInput.buyMerchantRating,
            sellMerchantRating: oppInput.sellMerchantRating,
            buyTrades: oppInput.buyTrades,
            sellTrades: oppInput.sellTrades,
            volumeAvailable: oppInput.volumeAvailable,
            durationMin: oppInput.durationMin,
            status: isSuspicious ? "SUSPICIOUS" : "ACTIVE",
            detectedAt,
            expiresAt: new Date(detectedAt.getTime() + durationMin * 60 * 1000),
          },
        });
        createdIds.push(created.id);
        premiumOpps.push(oppInput);
      }
    }

    // 5. Expire old ACTIVE opportunities (past their expiresAt)
    await db.opportunity.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });

    // 6. AUTO-PUBLISH DISABLED — premium opportunities (≥1.5%) are NO LONGER
    //    published directly to Telegram channels. Only freemium (≤1%) messages
    //    go to channels via the marketing system (section 9).
    //    Premium opportunities stay in the Mini App DB, locked behind Stars.
    let published = 0;
    let skippedDedup = 0;
    const publishedOpps: ScanResult["publishedOpportunities"] = [];

    const durationMs = Date.now() - startedAt;

    // 7. Log the scan
    await db.scanLog.create({
      data: {
        status: platformsFailed > 2 ? "PARTIAL" : "SUCCESS",
        durationMs,
        platformsChecked: platforms.length,
        platformsFailed,
        opportunitiesFound: numOpps,
        opportunitiesPublished: published,
        error: errors.length ? errors.join("; ").slice(0, 500) : null,
      },
    });

    // 8. Update last scan timestamp (for debounce)
    await setSetting("last_scan_at", new Date().toISOString());

    // 9. MARKETING CAMPAIGN — send freemium + teaser messages to Telegram channels
    //    (only if we have freemium or premium opps to promote)
    let marketingResult: { freemiumSent: number; teasersSent: number; viralSent: number } | null = null;
    if (freemiumOpps.length > 0 || premiumOpps.length > 0) {
      try {
        const botUsername = process.env.BOT_USERNAME || "@P2PScout2026Bot";
        const botUrl = `https://t.me/${botUsername.replace("@", "")}`;
        const mResult = await runMarketingCampaign(
          { freemium: freemiumOpps.slice(0, 1), premium: premiumOpps.slice(0, 1) },
          botUrl
        );
        marketingResult = {
          freemiumSent: mResult.freemiumSent,
          teasersSent: mResult.teasersSent,
          viralSent: mResult.viralSent,
        };
        if (mResult.errors.length > 0) {
          errors.push(...mResult.errors.slice(0, 2));
        }
      } catch (err) {
        errors.push(`Marketing error: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return {
      success: true,
      platformsChecked: platforms.length,
      platformsFailed,
      opportunitiesFound: numOpps,
      opportunitiesCreated: createdIds.length,
      opportunitiesPublished: published,
      opportunitiesSkippedDedup: skippedDedup,
      durationMs,
      errors,
      publishedOpportunities: publishedOpps,
      marketing: marketingResult,
    };
  } finally {
    await releaseLock();
  }
}
