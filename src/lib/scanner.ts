// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Scanner Engine
// Simulates the 8-platform P2P scan and creates realistic opportunities
// (CDC § 7.1 — spread net calculation with 0.2% safety buffer)
// ─────────────────────────────────────────────────────────────
import "server-only";
import { db } from "@/lib/db";

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
  platformsChecked: number;
  platformsFailed: number;
  opportunitiesFound: number;
  opportunitiesCreated: number;
  durationMs: number;
  errors: string[];
}

export async function runScan(): Promise<ScanResult> {
  const startedAt = Date.now();
  const errors: string[] = [];

  // Load enabled platforms & low-risk pairs
  const platforms = await db.platform.findMany({ where: { enabled: true } });
  const pairs = await db.tradingPair.findMany({
    where: { enabled: true, risk: "LOW" },
  });

  let platformsFailed = 0;
  // Simulate occasional API failure (10%)
  for (const p of platforms) {
    if (Math.random() > 0.93) {
      platformsFailed++;
      errors.push(`${p.name}: connection timeout`);
    }
  }

  // Generate 3-8 new opportunities
  const numOpps = Math.floor(rand(3, 9));
  const created: string[] = [];

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

    // Skip if below threshold
    if (spreadNet < 1.5) continue;

    const detectedAt = new Date();
    const durationMin = Math.floor(rand(10, 45));
    const expiresAt = new Date(detectedAt.getTime() + durationMin * 60 * 1000);
    const isSuspicious = spreadNet > 10;

    const created_opp = await db.opportunity.create({
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
    created.push(created_opp.id);
  }

  // Expire old opportunities (past their expiresAt)
  await db.opportunity.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const durationMs = Date.now() - startedAt;

  // Log the scan
  await db.scanLog.create({
    data: {
      status: platformsFailed > 2 ? "PARTIAL" : "SUCCESS",
      durationMs,
      platformsChecked: platforms.length,
      platformsFailed,
      opportunitiesFound: numOpps,
      opportunitiesPublished: 0,
      error: errors.length ? errors.join("; ") : null,
    },
  });

  // Update last scan time
  await db.systemSetting.upsert({
    where: { key: "last_scan_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_scan_at", value: new Date().toISOString() },
  });

  return {
    success: true,
    platformsChecked: platforms.length,
    platformsFailed,
    opportunitiesFound: numOpps,
    opportunitiesCreated: created.length,
    durationMs,
    errors,
  };
}
