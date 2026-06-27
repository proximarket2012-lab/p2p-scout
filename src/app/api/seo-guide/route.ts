import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// SEO Telegram Toolkit — character-limited content per CDC § 5.3
// Telegram hard limits:
//   - Channel name: 255 chars (we target ≤ 50 for SEO)
//   - Channel description: 255 chars (CDC enforces 150 for SEO discipline)
//   - Message: 4096 chars (CDC targets 200-350 words)
//   - Hashtags: no hard limit but max 5 per message for SEO
// ─────────────────────────────────────────────────────────────

const SEO_TOOLKIT = {
  limits: {
    channelName: { hard: 255, recommended: 50 },
    channelDescription: { hard: 255, recommended: 150 },
    pinnedMessage: { hard: 4096, recommended: 800 },
    messageWords: { min: 200, max: 350 },
    hashtagsPerMessage: { max: 5 },
    hookLine: { max: 80 },
    title: { max: 60 },
  },

  channelTemplates: [
    {
      language: "FR",
      name: "Arbitrage P2P — Signaux Gratuits 🇫🇷",
      nameLength: 36,
      description: "Opportunités d'arbitrage crypto P2P en temps réel, expliquées simplement. Aucune expertise requise.",
      descriptionLength: 99,
      hashtags: "#ArbitrageP2P #CryptoFacile #USDT #GainsCrypto #SansRisque",
      primaryKeywords: ["arbitrage p2p", "crypto", "signaux gratuits", "temps réel", "usdt"],
      pinnedMessage: "🎯 BIENVENUE sur Arbitrage P2P — Signaux Gratuits\n\nNous détectons en continu les meilleures opportunités d'arbitrage P2P sur 8 plateformes mondiales.\n\nChaque signal est :\n✅ Net de frais (spread ≥ 1,5%)\n✅ Expliqué simplement, sans jargon\n✅ Vérifié sur la fiabilité du vendeur\n\n👉 Ouvre la Mini App : https://t.me/P2PScoutBot/app\n👉 Partage le canal à un ami qui veut gagner sans trader\n\nℹ️ Information éducative, pas un conseil financier.",
    },
    {
      language: "EN",
      name: "P2P Arbitrage — Free Signals 🌍",
      nameLength: 32,
      description: "Real-time P2P crypto arbitrage opportunities, explained simply. No expertise needed.",
      descriptionLength: 85,
      hashtags: "#P2PArbitrage #CryptoProfit #USDT #PassiveIncome #CryptoSignals",
      primaryKeywords: ["p2p arbitrage", "crypto", "free signals", "real-time", "usdt"],
      pinnedMessage: "🎯 WELCOME to P2P Arbitrage — Free Signals\n\nWe continuously detect the best P2P arbitrage opportunities across 8 global platforms.\n\nEvery signal is:\n✅ Net of fees (spread ≥ 1.5%)\n✅ Explained simply, no jargon\n✅ Verified for seller reliability\n\n👉 Open the Mini App: https://t.me/P2PScoutBot/app\n👉 Share the channel with a friend who wants to earn without trading\n\nℹ️ Educational information, not financial advice.",
    },
  ],

  rules: [
    {
      element: "Titre du canal",
      rule: "Inclure \"Arbitrage P2P\" + \"Gratuit\" + émoji drapeau",
      impact: "Découvrabilité ★★★★★",
    },
    {
      element: "Description canal",
      rule: "150 caractères max, 3-5 mots-clés primaires, promesse claire",
      impact: "Indexation ★★★★☆",
    },
    {
      element: "Message épinglé",
      rule: "Expliquer le concept + lien Mini App + invitation à partager",
      impact: "Rétention ★★★★★",
    },
    {
      element: "Hashtags/message",
      rule: "Max 5 hashtags, toujours les mêmes (consistance = force)",
      impact: "Recherche ★★★★☆",
    },
    {
      element: "Fréquence",
      rule: "3 messages minimum/jour = signal de canal actif pour TG",
      impact: "Classement ★★★☆☆",
    },
    {
      element: "Emoji en début",
      rule: "Emoji accrocheur = meilleur taux de lecture dans les previews",
      impact: "CTR ★★★★☆",
    },
    {
      element: "Longueur message",
      rule: "200-350 mots : assez long pour la valeur, assez court pour lire",
      impact: "Engagement ★★★★☆",
    },
  ],

  hashtagLibrary: {
    FR: {
      primary: ["#ArbitrageP2P", "#CryptoFacile", "#USDT", "#GainsCrypto", "#SansRisque"],
      byFiat: {
        XAF: "#XAF", NGN: "#NGN", GHS: "#GHS", EUR: "#EUR", USD: "#USD",
        KES: "#KES", INR: "#INR", BRL: "#BRL", PHP: "#PHP",
      },
      secondary: ["#GagnerAvecCrypto", "#PassiveIncome", "#CryptoAfrique", "#CryptoFrancophone"],
    },
    EN: {
      primary: ["#P2PArbitrage", "#CryptoProfit", "#USDT", "#PassiveIncome", "#CryptoSignals"],
      byFiat: {
        XAF: "#XAF", NGN: "#NGN", GHS: "#GHS", EUR: "#EUR", USD: "#USD",
        KES: "#KES", INR: "#INR", BRL: "#BRL", PHP: "#PHP",
      },
      secondary: ["#CryptoEarn", "#P2PCrypto", "#ArbitrageTrading", "#CryptoAfrica"],
    },
  },

  messageStructure: {
    FR: [
      { section: "🚨 TITRE", constraint: "max 60 caractères, emoji accrocheur" },
      { section: "📊 CE QUE TU VAS FAIRE", constraint: "1 phrase simple" },
      { section: "👉 ÉTAPE 1 : ACHÈTE ICI", constraint: "plateforme + prix + vendeur" },
      { section: "👉 ÉTAPE 2 : REVENDS LÀ", constraint: "plateforme + prix + acheteur" },
      { section: "💰 CE QUE TU GAGNES", constraint: "calcul détaillé achat/frais/vente/bénéfice" },
      { section: "⏱ TEMPS ESTIMÉ", constraint: "durée totale" },
      { section: "⚠ ATTENTION", constraint: "1 risque + 1 conseil" },
      { section: "ℹ️ DISCLAIMER", constraint: "clause obligatoire (fixe)" },
      { section: "# HASHTAGS", constraint: "max 5 hashtags pertinents" },
    ],
    EN: [
      { section: "🚨 TITLE", constraint: "max 60 chars, catchy emoji" },
      { section: "📊 WHAT YOU'LL DO", constraint: "1 simple sentence" },
      { section: "👉 STEP 1: BUY HERE", constraint: "platform + price + seller" },
      { section: "👉 STEP 2: SELL THERE", constraint: "platform + price + buyer" },
      { section: "💰 WHAT YOU EARN", constraint: "detailed buy/fees/sell/profit calc" },
      { section: "⏱ ESTIMATED TIME", constraint: "total duration" },
      { section: "⚠ WARNING", constraint: "1 risk + 1 tip" },
      { section: "ℹ️ DISCLAIMER", constraint: "mandatory clause (fixed)" },
      { section: "# HASHTAGS", constraint: "max 5 relevant hashtags" },
    ],
  },

  disclaimer: {
    FR: "ℹ️ Ceci est une information éducative, pas un conseil financier. Les prix peuvent changer entre la détection et votre exécution. Ne misez jamais plus que vous ne pouvez vous permettre de perdre. Vérifiez toujours les prix avant d'agir.",
    EN: "ℹ️ This is educational information, not financial advice. Prices may change between detection and your execution. Never bet more than you can afford to lose. Always verify prices before acting.",
  },
};

export async function GET() {
  return NextResponse.json(SEO_TOOLKIT);
}
