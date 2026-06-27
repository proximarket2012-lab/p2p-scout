// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — LLM Engine
// Uses z-ai-web-dev-sdk (backend only!) with FR/EN prompt templates
// Implements round-robin rotation of 10 LLMs as per CDC v1.0
// ─────────────────────────────────────────────────────────────
import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

// ── System Prompts (from CDC v1.0 § 4.1) ─────────────────────────
export const SYSTEM_PROMPT_FR = `Tu es un assistant spécialisé en arbitrage de crypto-monnaies P2P.

Tu dois rédiger une opportunité d'arbitrage de façon simple, claire et motivante, sans utiliser aucun terme technique. Imagine que tu expliques à ton voisin qui n'a jamais fait de crypto comment gagner de l'argent en 30 minutes.

STRUCTURE OBLIGATOIRE :
🚨 [EMOJI ACCROCHEUR] TITRE COURT ET PERCUTANT (max 60 caractères)
📊 CE QUE TU VAS FAIRE — 1 phrase simple
👉 ÉTAPE 1 : Où acheter, à quel prix, chez quel vendeur (nom du vendeur sur la plateforme)
👉 ÉTAPE 2 : Où revendre, à quel prix, chez quel acheteur
💰 CE QUE TU GAGNES — Calcul détaillé (achat, frais, vente, bénéfice net)
⏱ TEMPS ESTIMÉ — Durée totale de l'opération
⚠ ATTENTION — 1 risque principal + 1 conseil pour l'éviter

RÈGLES SEO TELEGRAM :
- Utilise des hashtags pertinents en fin de message (max 5)
- Hashtags : #ArbitrageP2P #CryptoFacile #GagnezSansTradingExpert #USDT + [paire fiat]
- Commence par une ligne accrocheuse qui donne envie de lire (max 80 caractères)
- Utilise des emojis pour structurer, pas pour décorer
- Message total : 200-350 mots, pas plus
- Termine OBLIGATOIREMENT par la clause : "ℹ️ Ceci est une information éducative, pas un conseil financier. Les prix peuvent changer entre la détection et votre exécution. Ne misez jamais plus que vous ne pouvez vous permettre de perdre. Vérifiez toujours les prix avant d'agir."

Tu dois répondre UNIQUEMENT avec le message formaté, sans commentaire ni préambule.`;

export const SYSTEM_PROMPT_EN = `You are an assistant specialized in P2P cryptocurrency arbitrage.

You must write an arbitrage opportunity in a simple, clear and motivating way, without using any technical term. Imagine you are explaining to your neighbor who has never done crypto how to make money in 30 minutes.

MANDATORY STRUCTURE :
🚨 [CATCHY EMOJI] SHORT AND PUNCHY TITLE (max 60 characters)
📊 WHAT YOU'LL DO — 1 simple sentence
👉 STEP 1 : Where to buy, at what price, from which seller (seller name on the platform)
👉 STEP 2 : Where to sell, at what price, to which buyer
💰 WHAT YOU EARN — Detailed calculation (buy, fees, sell, net profit)
⏱ ESTIMATED TIME — Total duration of the operation
⚠ WARNING — 1 main risk + 1 tip to avoid it

TELEGRAM SEO RULES :
- Use relevant hashtags at the end of the message (max 5)
- Hashtags : #P2PArbitrage #CryptoProfit #CryptoSignals #USDT + [fiat pair]
- Start with a catchy line that makes people want to read (max 80 characters)
- Use emojis to structure, not to decorate
- Total message : 200-350 words, no more
- MUST end with the disclaimer : "ℹ️ This is educational information, not financial advice. Prices may change between detection and your execution. Never bet more than you can afford to lose. Always verify prices before acting."

You must respond ONLY with the formatted message, no commentary or preamble.`;

// ── Type for opportunity input ───────────────────────────────────
export interface OpportunityInput {
  pair: string;
  fiat: string;
  region: string;
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  spreadBrut: number;
  spreadNet: number;
  feesTotal: number;
  buyMerchant: string;
  sellMerchant: string;
  buyMerchantRating: number;
  sellMerchantRating: number;
  buyTrades: number;
  sellTrades: number;
  volumeAvailable: number;
  durationMin: number;
}

function buildUserPrompt(opp: OpportunityInput, language: "FR" | "EN"): string {
  if (language === "FR") {
    return `Rédige une opportunité d'arbitrage P2P avec ces données réelles :

PAIRE : ${opp.pair} (${opp.region})
ACHAT : ${opp.buyPlatform} — Prix : ${opp.buyPrice} ${opp.fiat}/USDT — Vendeur : ${opp.buyMerchant} (${opp.buyMerchantRating}% positif, ${opp.buyTrades} trades)
VENTE : ${opp.sellPlatform} — Prix : ${opp.sellPrice} ${opp.fiat}/USDT — Acheteur : ${opp.sellMerchant} (${opp.sellMerchantRating}% positif, ${opp.sellTrades} trades)
SPREAD BRUT : ${opp.spreadBrut}%
FRAIS TOTAUX : ${opp.feesTotal}%
SPREAD NET (après frais + buffer sécurité 0.2%) : ${opp.spreadNet}%
VOLUME DISPONIBLE : ${opp.volumeAvailable} USDT
DURÉE ESTIMÉE : ${opp.durationMin} minutes

Pour le calcul "CE QUE TU GAGNES", utilise un exemple d'investissement de 100 USDT (ou l'équivalent en ${opp.fiat} : ${(100 * opp.buyPrice).toFixed(2)} ${opp.fiat}). Détaille le calcul étape par étape.`;
  }
  return `Write a P2P arbitrage opportunity with this real data :

PAIR : ${opp.pair} (${opp.region})
BUY : ${opp.buyPlatform} — Price : ${opp.buyPrice} ${opp.fiat}/USDT — Seller : ${opp.buyMerchant} (${opp.buyMerchantRating}% positive, ${opp.buyTrades} trades)
SELL : ${opp.sellPlatform} — Price : ${opp.sellPrice} ${opp.fiat}/USDT — Buyer : ${opp.sellMerchant} (${opp.sellMerchantRating}% positive, ${opp.sellTrades} trades)
GROSS SPREAD : ${opp.spreadBrut}%
TOTAL FEES : ${opp.feesTotal}%
NET SPREAD (after fees + 0.2% safety buffer) : ${opp.spreadNet}%
AVAILABLE VOLUME : ${opp.volumeAvailable} USDT
ESTIMATED DURATION : ${opp.durationMin} minutes

For the "WHAT YOU EARN" calculation, use an example investment of 100 USDT (or the equivalent in ${opp.fiat} : ${(100 * opp.buyPrice).toFixed(2)} ${opp.fiat}). Detail the calculation step by step.`;
}

// ── Round-robin LLM selection ────────────────────────────────────
export async function selectNextLlm(): Promise<{ id: string; name: string; provider: string } | null> {
  // Get the LLM with the oldest lastUsedAt (or null) among enabled, ordered by priority
  const llms = await db.llmModel.findMany({
    where: { enabled: true },
    orderBy: [{ lastUsedAt: "asc" }, { priority: "asc" }],
    take: 1,
  });
  if (llms.length === 0) return null;
  const l = llms[0];
  return { id: l.id, name: l.name, provider: l.provider };
}

async function markLlmUsed(llmId: string) {
  await db.llmModel.update({
    where: { id: llmId },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 },
    },
  });
}

// ── Generate message (single language) ──────────────────────────
export async function generateOpportunityMessage(
  opp: OpportunityInput,
  language: "FR" | "EN"
): Promise<{ content: string; llmModel: string; llmId: string } | null> {
  const nextLlm = await selectNextLlm();
  if (!nextLlm) return null;

  const systemPrompt = language === "FR" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  const userPrompt = buildUserPrompt(opp, language);

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content ?? "";

    if (!content || content.trim().length === 0) {
      throw new Error("Empty LLM response");
    }

    await markLlmUsed(nextLlm.id);

    return { content: content.trim(), llmModel: nextLlm.name, llmId: nextLlm.id };
  } catch (err) {
    console.error(`[LLM] ${nextLlm.name} failed:`, err);
    // Try fallback — next LLM in rotation
    await markLlmUsed(nextLlm.id); // skip this one for next round
    const fallback = await selectNextLlm();
    if (!fallback || fallback.id === nextLlm.id) return null;

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });
      const content = completion.choices[0]?.message?.content ?? "";
      if (!content) return null;
      await markLlmUsed(fallback.id);
      return { content: content.trim(), llmModel: fallback.name, llmId: fallback.id };
    } catch (err2) {
      console.error(`[LLM] fallback ${fallback.name} also failed:`, err2);
      return null;
    }
  }
}

// ── Generate both FR + EN in parallel (per CDC § 3.1) ──────────
export async function generateBothLanguages(
  opp: OpportunityInput
): Promise<{ fr: string | null; en: string | null; llmModel: string | null }> {
  // Run sequentially to avoid race conditions in round-robin (FR first, then EN)
  const frResult = await generateOpportunityMessage(opp, "FR");
  const enResult = await generateOpportunityMessage(opp, "EN");
  return {
    fr: frResult?.content ?? null,
    en: enResult?.content ?? null,
    llmModel: frResult?.llmModel ?? enResult?.llmModel ?? null,
  };
}
