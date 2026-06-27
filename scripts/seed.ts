import { db } from "../src/lib/db";

// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Seed script
// Realistic data based on actual P2P market conditions (June 2026)
// ─────────────────────────────────────────────────────────────

const PLATFORMS = [
  { name: "Binance P2P", slug: "binance", apiEndpoint: "p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", feeMaker: 0, feeTaker: 0, fiatCount: 119, liquidity: 5, region: "Global", color: "#F0B90B", logo: "B" },
  { name: "Bybit P2P", slug: "bybit", apiEndpoint: "api.bybit.com/v5/p2p/item/online", feeMaker: 0, feeTaker: 0, fiatCount: 60, liquidity: 4, region: "Global", color: "#F7A600", logo: "By" },
  { name: "OKX P2P", slug: "okx", apiEndpoint: "www.okx.com/v3/c2c/tradingOrders/books", feeMaker: 0, feeTaker: 0, fiatCount: 90, liquidity: 4, region: "Global", color: "#2EBD85", logo: "O" },
  { name: "HTX / Huobi", slug: "htx", apiEndpoint: "otc-api.huobi.pro/v1/otc/trade/ad", feeMaker: 0.1, feeTaker: 0.1, fiatCount: 50, liquidity: 3, region: "Asia", color: "#1A2C4E", logo: "H" },
  { name: "KuCoin P2P", slug: "kucoin", apiEndpoint: "www.kucoin.com/v1/otc/ask", feeMaker: 0, feeTaker: 0, fiatCount: 30, liquidity: 3, region: "Global", color: "#23AF91", logo: "K" },
  { name: "MEXC P2P", slug: "mexc", apiEndpoint: "otc.mexc.com/api/otc/item/queryList", feeMaker: 0, feeTaker: 0, fiatCount: 40, liquidity: 3, region: "Global", color: "#1972F5", logo: "M" },
  { name: "Noones", slug: "noones", apiEndpoint: "noones.com/p2p-trading/list-all-trades", feeMaker: 0.5, feeTaker: 0.5, fiatCount: 200, liquidity: 4, region: "Africa", color: "#7B3FE4", logo: "N" },
  { name: "Bitget P2P", slug: "bitget", apiEndpoint: "api.bitget.com/api/v2/p2p/merchantList", feeMaker: 0, feeTaker: 0, fiatCount: 50, liquidity: 3, region: "Asia", color: "#00F0FF", logo: "Bg" },
];

const PAIRS = [
  { symbol: "USDT/XAF", type: "Stablecoin/Fiat", justification: "Fort volume Afrique centrale, peu de concurrence", risk: "LOW", riskEmoji: "🟢", region: "Africa", quoteAsset: "XAF" },
  { symbol: "USDT/NGN", type: "Stablecoin/Fiat", justification: "Marché le plus liquide d'Afrique (Nigeria)", risk: "LOW", riskEmoji: "🟢", region: "Africa", quoteAsset: "NGN" },
  { symbol: "USDT/GHS", type: "Stablecoin/Fiat", justification: "Ghana, 2ème marché P2P Afrique de l'Ouest", risk: "LOW", riskEmoji: "🟢", region: "Africa", quoteAsset: "GHS" },
  { symbol: "USDT/EUR", type: "Stablecoin/Fiat", justification: "Forte liquidité, spreads stables sur toutes plateformes", risk: "LOW", riskEmoji: "🟢", region: "Europe", quoteAsset: "EUR" },
  { symbol: "USDT/USD", type: "Stablecoin/Fiat", justification: "Paire de référence mondiale, spread minimal mais constant", risk: "LOW", riskEmoji: "🟢", region: "Global", quoteAsset: "USD" },
  { symbol: "USDT/KES", type: "Stablecoin/Fiat", justification: "Kenya, marché mobile money très actif (M-Pesa)", risk: "LOW", riskEmoji: "🟡", region: "Africa", quoteAsset: "KES" },
  { symbol: "USDT/INR", type: "Stablecoin/Fiat", justification: "Inde, volume P2P en forte croissance 2026", risk: "LOW", riskEmoji: "🟡", region: "Asia", quoteAsset: "INR" },
  { symbol: "USDT/BRL", type: "Stablecoin/Fiat", justification: "Brésil, fort déséquilibre entre plateformes", risk: "LOW", riskEmoji: "🟡", region: "Americas", quoteAsset: "BRL" },
  { symbol: "USDT/PHP", type: "Stablecoin/Fiat", justification: "Philippines, fort marché remittances", risk: "LOW", riskEmoji: "🟡", region: "Asia", quoteAsset: "PHP" },
  { symbol: "BTC/USDT", type: "Crypto/Stablecoin", justification: "Spreads inter-plateformes sur les gros ordres", risk: "MEDIUM", riskEmoji: "🟡", region: "Global", quoteAsset: "USDT" },
];

const LLMS = [
  { name: "claude-haiku-4-5", provider: "Anthropic (OpenRouter)", strengths: "Rapide, structuré, excellent FR", languageFit: "FR + EN", costPer1k: 0.00025, priority: 1 },
  { name: "gemini-2.5-flash", provider: "Google (OpenRouter)", strengths: "Très rapide, bon multilingue", languageFit: "FR + EN", costPer1k: 0.00030, priority: 2 },
  { name: "gpt-4o-mini", provider: "OpenAI (OpenRouter)", strengths: "Fiable, bon EN, accessible", languageFit: "EN > FR", costPer1k: 0.00015, priority: 3 },
  { name: "llama-3.3-70b", provider: "Meta (OpenRouter)", strengths: "Open source, bon FR Afrique", languageFit: "FR + EN", costPer1k: 0.00020, priority: 4 },
  { name: "mistral-small-3.1", provider: "Mistral (OpenRouter)", strengths: "Natif français, précis, rapide", languageFit: "FR ★", costPer1k: 0.00020, priority: 5 },
  { name: "qwen-2.5-72b", provider: "Alibaba (OpenRouter)", strengths: "Fort en Asie, bon multilingue", languageFit: "EN > FR", costPer1k: 0.00010, priority: 6 },
  { name: "deepseek-chat-v3", provider: "DeepSeek (OpenRouter)", strengths: "Rapport qualité/coût excellent", languageFit: "EN + FR", costPer1k: 0.00014, priority: 7 },
  { name: "phi-4-mini", provider: "Microsoft (OpenRouter)", strengths: "Ultra-rapide, faible latence", languageFit: "EN", costPer1k: 0.00010, priority: 8 },
  { name: "gemma-3-27b", provider: "Google (OpenRouter)", strengths: "Backup Google, bon équilibre", languageFit: "FR + EN", costPer1k: 0.00015, priority: 9 },
  { name: "nous-hermes-3", provider: "Nous Research (OpenRouter)", strengths: "Spécialisé instruction-following", languageFit: "EN > FR", costPer1k: 0.00020, priority: 10 },
];

// Realistic P2P price ranges (June 2026 reference) per USDT
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  "XAF": { min: 595, max: 615 },
  "NGN": { min: 1480, max: 1560 },
  "GHS": { min: 14.5, max: 15.8 },
  "EUR": { min: 0.91, max: 0.96 },
  "USD": { min: 0.998, max: 1.015 },
  "KES": { min: 128, max: 138 },
  "INR": { min: 83, max: 88 },
  "BRL": { min: 5.35, max: 5.7 },
  "PHP": { min: 56, max: 60 },
  "USDT": { min: 0.999, max: 1.003 },
};

const MERCHANT_NAMES = [
  "CryptoExpressPro", "FastTradeNG", "P2P_Master_2026", "GoldenHands", "AfricanTrader",
  "SwiftExchange", "ReliableVendor", "QuickCashP2P", "TrustTradeAfrica", "EuroDirect",
  "NairaFastPay", "CediMaster", "ShillingPro", "PesoDirect", "Real_BRL_Trader",
  "RupeeExpress", "StableCoinHub", "AtlasP2P", "PhoenixTrader", "SaharaCrypto",
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOpportunities(count: number) {
  const opportunities: any[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const pair = pickRandom(PAIRS.filter(p => p.risk === "LOW"));
    const fiat = pair.quoteAsset;
    const range = PRICE_RANGES[fiat] ?? { min: 100, max: 200 };

    const buyPlatform = pickRandom(PLATFORMS);
    let sellPlatform = pickRandom(PLATFORMS);
    while (sellPlatform.slug === buyPlatform.slug) sellPlatform = pickRandom(PLATFORMS);

    const basePrice = randomBetween(range.min, range.max);
    const spreadPct = randomBetween(1.5, 4.5);
    const buyPrice = Number(basePrice.toFixed(2));
    const sellPrice = Number((buyPrice * (1 + spreadPct / 100)).toFixed(2));

    const spreadBrut = Number(((sellPrice - buyPrice) / buyPrice * 100).toFixed(2));
    const feesTotal = Number((buyPlatform.feeMaker + sellPlatform.feeMaker).toFixed(2));
    const spreadNet = Number((spreadBrut - feesTotal - 0.2).toFixed(2));

    if (spreadNet < 1.5) { i--; continue; }

    const detectedAt = new Date(now.getTime() - randomBetween(1, 240) * 60 * 1000);
    const durationMin = Math.floor(randomBetween(10, 45));
    const expiresAt = new Date(detectedAt.getTime() + durationMin * 60 * 1000);

    const isExpired = expiresAt < now;
    const isSuspicious = spreadNet > 10;

    let status = "ACTIVE";
    if (isExpired) status = "EXPIRED";
    if (isSuspicious) status = "SUSPICIOUS";

    opportunities.push({
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
      buyMerchant: pickRandom(MERCHANT_NAMES),
      sellMerchant: pickRandom(MERCHANT_NAMES),
      buyMerchantRating: Number(randomBetween(92, 99).toFixed(1)),
      sellMerchantRating: Number(randomBetween(92, 99).toFixed(1)),
      buyTrades: Math.floor(randomBetween(50, 2500)),
      sellTrades: Math.floor(randomBetween(50, 2500)),
      volumeAvailable: Number(randomBetween(150, 5000).toFixed(0)),
      durationMin,
      status,
      detectedAt,
      expiresAt,
    });
  }
  return opportunities;
}

async function main() {
  console.log("🌱 Seeding P2P Arbitrage Scout database...");

  await db.opportunity.deleteMany();
  await db.platform.deleteMany();
  await db.tradingPair.deleteMany();
  await db.llmModel.deleteMany();
  await db.channel.deleteMany();
  await db.scanLog.deleteMany();
  await db.systemSetting.deleteMany();

  for (const p of PLATFORMS) {
    await db.platform.create({ data: p as any });
  }
  console.log(`✓ ${PLATFORMS.length} platforms seeded`);

  for (const pair of PAIRS) {
    await db.tradingPair.create({ data: pair as any });
  }
  console.log(`✓ ${PAIRS.length} trading pairs seeded`);

  for (const llm of LLMS) {
    await db.llmModel.create({ data: llm as any });
  }
  console.log(`✓ ${LLMS.length} LLMs seeded`);

  await db.channel.create({
    data: {
      language: "FR",
      name: "Arbitrage P2P — Signaux Gratuits 🇫🇷",
      description: "Opportunités d'arbitrage crypto P2P en temps réel, expliquées simplement. Aucune expertise requise.",
      hashtags: "#ArbitrageP2P #CryptoFacile #USDT #GainsCrypto #SansRisque",
      pinnedMessage: "🎯 BIENVENUE sur Arbitrage P2P — Signaux Gratuits\n\nNous détectons en continu les meilleures opportunités d'arbitrage P2P sur 8 plateformes mondiales.\n\nChaque signal est :\n✅ Net de frais (spread ≥ 1,5%)\n✅ Expliqué simplement, sans jargon\n✅ Vérifié sur la fiabilité du vendeur\n\n👉 Ouvre la Mini App : https://t.me/P2PScoutBot/app\n👉 Partage le canal à un ami qui veut gagner sans trader\n\nℹ️ Information éducative, pas un conseil financier.",
      botUsername: "@P2PScoutBot",
      subscriberCount: 1247,
    }
  });

  await db.channel.create({
    data: {
      language: "EN",
      name: "P2P Arbitrage — Free Signals 🌍",
      description: "Real-time P2P crypto arbitrage opportunities, explained simply. No expertise needed.",
      hashtags: "#P2PArbitrage #CryptoProfit #USDT #PassiveIncome #CryptoSignals",
      pinnedMessage: "🎯 WELCOME to P2P Arbitrage — Free Signals\n\nWe continuously detect the best P2P arbitrage opportunities across 8 global platforms.\n\nEvery signal is:\n✅ Net of fees (spread ≥ 1.5%)\n✅ Explained simply, no jargon\n✅ Verified for seller reliability\n\n👉 Open the Mini App: https://t.me/P2PScoutBot/app\n👉 Share the channel with a friend who wants to earn without trading\n\nℹ️ Educational information, not financial advice.",
      botUsername: "@P2PScoutBot",
      subscriberCount: 892,
    }
  });
  console.log("✓ 2 Telegram channels seeded (FR + EN, SEO-optimized)");

  const opportunities = generateOpportunities(28);
  for (const o of opportunities) {
    await db.opportunity.create({ data: o });
  }
  console.log(`✓ ${opportunities.length} opportunities seeded`);

  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const createdAt = new Date(now.getTime() - i * 5 * 60 * 1000);
    const found = Math.floor(randomBetween(0, 6));
    const published = Math.floor(randomBetween(0, found));
    await db.scanLog.create({
      data: {
        status: Math.random() > 0.9 ? "PARTIAL" : "SUCCESS",
        durationMs: Math.floor(randomBetween(8000, 25000)),
        platformsChecked: 8,
        platformsFailed: Math.random() > 0.9 ? 1 : 0,
        opportunitiesFound: found,
        opportunitiesPublished: published,
        createdAt,
      }
    });
  }
  console.log("✓ 24 scan logs seeded (last 2 hours)");

  await db.systemSetting.create({ data: { key: "scanner_active", value: "true" } });
  await db.systemSetting.create({ data: { key: "last_scan_at", value: new Date().toISOString() } });
  await db.systemSetting.create({ data: { key: "spread_threshold", value: "1.5" } });
  await db.systemSetting.create({ data: { key: "buffer_safety", value: "0.2" } });
  await db.systemSetting.create({ data: { key: "cooldown_minutes", value: "30" } });
  console.log("✓ System settings seeded");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
