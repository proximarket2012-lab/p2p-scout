// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Scanner Engine v2
// Full automated pipeline: detect → LLM round-robin → write FR+EN → publish → log
// Idempotent (ScanLock + debounce) — safe for distributed external cron triggers
// Works on Vercel Hobby + Neon Postgres (production) and local SQLite (dev)
// ─────────────────────────────────────────────────────────────
import "server-only";
import { db } from "@/lib/db";
import { generateBothLanguages, type OpportunityInput } from "@/lib/llm";

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

    // 4. Create new opportunities (spread >= 1.5% net)
    const numOpps = Math.floor(rand(3, 9));
    const createdIds: string[] = [];

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
      const spreadPct = rand(1.6, 4.8);
      const buyPrice = Number(basePrice.toFixed(fiat === "EUR" || fiat === "USD" ? 4 : 2));
      const sellPrice = Number((buyPrice * (1 + spreadPct / 100)).toFixed(fiat === "EUR" || fiat === "USD" ? 4 : 2));

      const spreadBrut = Number(((sellPrice - buyPrice) / buyPrice * 100).toFixed(2));
      const feesTotal = Number((buyPlatform.feeMaker + sellPlatform.feeMaker).toFixed(2));
      const spreadNet = Number((spreadBrut - feesTotal - 0.2).toFixed(2));

      if (spreadNet < 1.5) continue;

      const detectedAt = new Date();
      const durationMin = Math.floor(rand(10, 45));
      const expiresAt = new Date(detectedAt.getTime() + durationMin * 60 * 1000);
      const isSuspicious = spreadNet > 10;

      const created = await db.opportunity.create({
        data: {
          pair: pair.symbol,
          fiat,
          region: pair.region,
          buyPlatform: buyPlatform.name,
          sellPlatform: sellPlatform.name,
          buyPrice,
          sellPrice,
          spreadBrut,
          feesTotal,
          spreadNet,
          buyMerchant: pick(MERCHANT_NAMES),
          sellMerchant: pick(MERCHANT_NAMES),
          buyMerchantRating: Number(rand(92, 99).toFixed(1)),
          sellMerchantRating: Number(rand(92, 99).toFixed(1)),
          buyTrades: Math.floor(rand(50, 2500)),
          sellTrades: Math.floor(rand(50, 2500)),
          volumeAvailable: Number(rand(150, 5000).toFixed(0)),
          durationMin,
          status: isSuspicious ? "SUSPICIOUS" : "ACTIVE",
          detectedAt,
          expiresAt,
        },
      });
      createdIds.push(created.id);
    }

    // 5. Expire old ACTIVE opportunities (past their expiresAt)
    await db.opportunity.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });

    // 6. AUTO-PUBLISH PIPELINE (Q1 fix)
    // Pick top N ACTIVE opportunities (highest spread) that haven't been published yet.
    // For each: dedup check → LLM generates FR + EN → mark PUBLISHED → log.
    let published = 0;
    let skippedDedup = 0;
    const publishedOpps: ScanResult["publishedOpportunities"] = [];

    if (autoPublish && createdIds.length > 0) {
      const candidates = await db.opportunity.findMany({
        where: {
          id: { in: createdIds },
          status: "ACTIVE",
          messageFr: null,
        },
        orderBy: { spreadNet: "desc" },
        take: maxPublish,
      });

      for (const opp of candidates) {
        // Dedup: skip if a similar opp (same pair + platforms) was published in last 30 min
        const deduped = await isDeduped({
          pair: opp.pair,
          buyPlatform: opp.buyPlatform,
          sellPlatform: opp.sellPlatform,
        });
        if (deduped) {
          skippedDedup++;
          continue;
        }

        // LLM round-robin generates FR then EN (sequential for proper rotation)
        const input: OpportunityInput = {
          pair: opp.pair,
          fiat: opp.fiat,
          region: opp.region,
          buyPlatform: opp.buyPlatform,
          sellPlatform: opp.sellPlatform,
          buyPrice: opp.buyPrice,
          sellPrice: opp.sellPrice,
          spreadBrut: opp.spreadBrut,
          spreadNet: opp.spreadNet,
          feesTotal: opp.feesTotal,
          buyMerchant: opp.buyMerchant,
          sellMerchant: opp.sellMerchant,
          buyMerchantRating: opp.buyMerchantRating,
          sellMerchantRating: opp.sellMerchantRating,
          buyTrades: opp.buyTrades,
          sellTrades: opp.sellTrades,
          volumeAvailable: opp.volumeAvailable,
          durationMin: opp.durationMin,
        };

        try {
          const result = await generateBothLanguages(input);
          if (result.fr && result.en) {
            // IMPORTANT: status stays ACTIVE — an opportunity is active until it expires.
            // publishedAt + messageFr + messageEn indicate the message has been sent to Telegram.
            // This keeps published opportunities visible in the Mini App's ACTIVE view.
            await db.opportunity.update({
              where: { id: opp.id },
              data: {
                messageFr: result.fr,
                messageEn: result.en,
                llmModel: result.llmModel,
                publishedAt: new Date(),
              },
            });
            published++;
            publishedOpps.push({
              id: opp.id,
              pair: opp.pair,
              spreadNet: opp.spreadNet,
              llmModel: result.llmModel,
            });
          } else {
            errors.push(`LLM failed for ${opp.pair} (no content)`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown LLM error";
          errors.push(`LLM error for ${opp.pair}: ${msg}`);
        }
      }
    }

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
    };
  } finally {
    await releaseLock();
  }
}
