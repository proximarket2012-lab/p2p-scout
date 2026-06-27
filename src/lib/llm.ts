// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — LLM Engine v2
// Uses OpenRouter API (10 free models in round-robin rotation)
// with automatic fallback on rate limits (429) or errors.
// Falls back to z-ai-web-dev-sdk (ZAI) if OPENROUTER_API_KEY is not set.
// Backend only — NEVER import this module from client code.
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
// Returns the LLM with the oldest lastUsedAt (or null) among enabled, ordered by priority.
// Excludes LLMs in the skipIds set (failed recently with rate limit / error).
export async function selectNextLlm(skipIds: Set<string> = new Set()): Promise<{ id: string; name: string; provider: string } | null> {
  const llms = await db.llmModel.findMany({
    where: { enabled: true, id: { notIn: Array.from(skipIds) } },
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

// ── OpenRouter API call ──────────────────────────────────────────
// Real call to OpenRouter with the specific model name from the DB.
// Handles 429 (rate limit) by throwing — the caller will try the next model.
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout per CDC § 4

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://p2p-arbitrage-scout.vercel.app",
        "X-Title": "P2P Arbitrage Scout",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      throw new Error(`Rate limit (429) on ${model}`);
    }
    if (res.status === 402) {
      throw new Error(`Payment required (402) on ${model} — free tier exhausted`);
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status} on ${model}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content || content.trim().length === 0) {
      throw new Error(`Empty response from ${model}`);
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// ── ZAI fallback (used when OPENROUTER_API_KEY is not set) ───────
async function callZai(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
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
    throw new Error("Empty ZAI response");
  }
  return content.trim();
}

// ── Generate message (single language) with full fallback chain ─
// Tries up to 5 LLMs in rotation. On rate limit / error, marks the LLM as used
// (so it's skipped for the next 5 min) and tries the next one.
// If OPENROUTER_API_KEY is not set, falls back to ZAI SDK.
export async function generateOpportunityMessage(
  opp: OpportunityInput,
  language: "FR" | "EN"
): Promise<{ content: string; llmModel: string; llmId: string } | null> {
  const systemPrompt = language === "FR" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  const userPrompt = buildUserPrompt(opp, language);

  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  // If no OpenRouter key, use ZAI directly (demo/dev mode)
  if (!hasOpenRouter) {
    try {
      const content = await callZai(systemPrompt, userPrompt);
      // Still rotate the DB counter so the UI shows round-robin activity
      const nextLlm = await selectNextLlm();
      if (nextLlm) await markLlmUsed(nextLlm.id);
      return {
        content,
        llmModel: nextLlm?.name ?? "zai-fallback",
        llmId: nextLlm?.id ?? "zai",
      };
    } catch (err) {
      console.error("[LLM] ZAI fallback failed:", err);
      return null;
    }
  }

  // OpenRouter mode: try up to 5 models in rotation
  const skipIds = new Set<string>();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const nextLlm = await selectNextLlm(skipIds);
    if (!nextLlm) {
      console.error("[LLM] No more LLMs available in rotation");
      break;
    }

    try {
      const content = await callOpenRouter(nextLlm.name, systemPrompt, userPrompt);
      await markLlmUsed(nextLlm.id);
      return { content, llmModel: nextLlm.name, llmId: nextLlm.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[LLM] ${nextLlm.name} failed (attempt ${attempt + 1}/${maxAttempts}): ${msg}`);
      // Mark as used so it's skipped for the next rotation cycle (oldest lastUsedAt moves forward)
      await markLlmUsed(nextLlm.id);
      skipIds.add(nextLlm.id);
      // Continue to next model in the loop
    }
  }

  // All OpenRouter models exhausted — final fallback to ZAI
  console.warn("[LLM] All OpenRouter models failed, falling back to ZAI");
  try {
    const content = await callZai(systemPrompt, userPrompt);
    return { content, llmModel: "zai-emergency", llmId: "zai" };
  } catch (err) {
    console.error("[LLM] ZAI emergency fallback also failed:", err);
    return null;
  }
}

// ── Generate both FR + EN (sequential for proper rotation) ───────
export async function generateBothLanguages(
  opp: OpportunityInput
): Promise<{ fr: string | null; en: string | null; llmModel: string | null }> {
  // Run sequentially so the round-robin picks 2 different models (FR first, then EN)
  const frResult = await generateOpportunityMessage(opp, "FR");
  const enResult = await generateOpportunityMessage(opp, "EN");
  return {
    fr: frResult?.content ?? null,
    en: enResult?.content ?? null,
    llmModel: frResult?.llmModel ?? enResult?.llmModel ?? null,
  };
}
