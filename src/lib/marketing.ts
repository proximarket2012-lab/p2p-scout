// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Marketing Engine
// Freemium funnel: low-spread (≤1%) opportunities published FREE on Telegram
// channels with powerful CTA driving users to the Mini App where higher-spread
// (≥1.5%) opportunities are locked behind Stars payment.
//
// Marketing message types:
// 1. FREEMIUM_LOW_SPREAD — real opportunity with spread 0.5-1%, CTA to Mini App
// 2. PREMIUM_TEASER — teaser about a high-spread opp (2-5%+) without revealing details
// 3. DAILY_TOP — daily recap of best opportunities (sent once per day)
// 4. VIRAL_HOOK — shareable message to grow the channel
// ─────────────────────────────────────────────────────────────
import "server-only";
import { db } from "@/lib/db";
import { publishToBothChannels, sendTelegramMessage } from "@/lib/telegram";
import { selectNextLlm, markLlmUsed } from "@/lib/llm";
import type { OpportunityInput } from "@/lib/llm";

// ── System prompts for marketing messages ──────────────────────

const FREEMIUM_PROMPT_FR = `Tu es un expert en marketing crypto. Tu rédiges un message Telegram court et percutant pour une opportunité d'arbitrage P2P à spread faible (≤1%).

OBJECTIF : Donner envie à l'utilisateur d'ouvrir la Mini App pour accéder à des opportunités beaucoup plus rentables (jusqu'à +5% et plus).

STRUCTURE OBLIGATOIRE (max 120 mots) :
🚨 [EMOJI] OPPORTUNITÉ GRATUITE : +[spread]% sur [paire]
📊 Achète sur [plateforme achat] → Revends sur [plateforme vente]
💡 Cette opportunité est RÉELLE mais le gain est modeste.
🔥 Dans la Mini App, des milliers d'opportunités à +2% à +5%+ t'attendent !
👉 Débloque celle qui te plaît avec tes ⭐ Stars pour t'en approprier les détails exclusifs.
📲 Ouvre la Mini App : [URL bot]

RÈGLES :
- Langage simple, zéro jargon technique
- Crée un sentiment d'urgence et d'exclusivité
- Mentionne que l'utilisateur peut "s'approprier" une opportunité en la débloquant
- Termine par un appel à l'action irrésistible vers la Mini App
- Hashtags : #ArbitrageP2P #CryptoFacile #USDT + [paire fiat]
- Termine par le disclaimer : "ℹ️ Information éducative, pas un conseil financier."

Réponds UNIQUEMENT avec le message formaté.`;

const FREEMIUM_PROMPT_EN = `You are a crypto marketing expert. You write a short punchy Telegram message for a low-spread (≤1%) P2P arbitrage opportunity.

GOAL: Make the user want to open the Mini App to access much more profitable opportunities (up to +5% and beyond).

MANDATORY STRUCTURE (max 120 words):
🚨 [EMOJI] FREE OPPORTUNITY: +[spread]% on [pair]
📊 Buy on [buy platform] → Sell on [sell platform]
💡 This opportunity is REAL but the profit is modest.
🔥 In the Mini App, thousands of opportunities at +2% to +5%+ await you!
👉 Unlock the one you like with your ⭐ Stars to own its exclusive details.
📲 Open the Mini App: [bot URL]

RULES:
- Simple language, zero technical jargon
- Create urgency and exclusivity
- Mention the user can "own" an opportunity by unlocking it
- End with an irresistible call-to-action to the Mini App
- Hashtags: #P2PArbitrage #CryptoProfit #USDT + [fiat pair]
- End with disclaimer: "ℹ️ Educational information, not financial advice."

Respond ONLY with the formatted message.`;

const PREMIUM_TEASER_PROMPT_FR = `Tu es un expert en marketing crypto. Tu rédiges un message Telegram "teaser" court (max 80 mots) qui annonce une opportunité à spread élevé SANS révéler les détails.

OBJECTIF : Créer un FOMO (fear of missing out) massif pour pousser à ouvrir la Mini App.

STRUCTURE :
🔥 [EMOJI] ALERTE : opportunité exceptionnelle détectée !
💥 +[spread]% NET sur [paire] ([région])
⏱ Disparait dans [durée] minutes...
🔒 Détails verrouillés — débloque avec tes ⭐ Stars pour la t'en approprier
📲 Ouvre la Mini App maintenant : [URL bot]

RÈGLES : Langage simple, urgence forte, zéro jargon. Hashtags max 3.
Termine par : "ℹ️ Information éducative, pas un conseil financier."`;

const PREMIUM_TEASER_PROMPT_EN = `You are a crypto marketing expert. Write a short "teaser" Telegram message (max 80 words) announcing a high-spread opportunity WITHOUT revealing details.

GOAL: Create massive FOMO to push users to open the Mini App.

STRUCTURE:
🔥 [EMOJI] ALERT: exceptional opportunity detected!
💥 +[spread]% NET on [pair] ([region])
⏱ Disappears in [duration] minutes...
🔒 Details locked — unlock with your ⭐ Stars to own it
📲 Open the Mini App now: [bot URL]

RULES: Simple language, strong urgency, zero jargon. Max 3 hashtags.
End with: "ℹ️ Educational information, not financial advice."`;

const VIRAL_HOOK_PROMPT_FR = `Tu es un expert en marketing viral. Tu rédiges un message Telegram court (max 100 mots) pour inciter au partage et faire grandir la communauté.

OBJECTIF : Maximiser le partage et les nouveaux abonnés.

STRUCTURE :
🚀 [EMOJI ACCROCHEUR] [TITRE COURT PERCUTANT]
[2-3 phrases sur le concept : "Des opportunités d'arbitrage crypto détectées automatiquement, expliquées simplement, débloquables avec des Stars"]
👉 Partage ce canal à un ami qui veut gagner sans trader
📲 Ouvre la Mini App pour voir les opportunités du moment : [URL bot]

RÈGLES : Ton enthousiaste, zéro jargon, appel au partage clair. Hashtags : #ArbitrageP2P #CryptoFacile #GagnerSansTrader
Termine par : "ℹ️ Information éducative, pas un conseil financier."`;

const VIRAL_HOOK_PROMPT_EN = `You are a viral marketing expert. Write a short Telegram message (max 100 words) to encourage sharing and grow the community.

GOAL: Maximize shares and new subscribers.

STRUCTURE:
🚀 [CATCHY EMOJI] [SHORT PUNCHY TITLE]
[2-3 sentences on the concept: "Crypto arbitrage opportunities detected automatically, explained simply, unlockable with Stars"]
👉 Share this channel with a friend who wants to earn without trading
📲 Open the Mini App to see current opportunities: [bot URL]

RULES: Enthusiastic tone, zero jargon, clear call to share. Hashtags: #P2PArbitrage #CryptoProfit #PassiveIncome
End with: "ℹ️ Educational information, not financial advice."`;

// ── Build user prompts from opportunity data ───────────────────

function buildFreemiumUserPrompt(opp: OpportunityInput, botUrl: string, lang: "FR" | "EN"): string {
  if (lang === "FR") {
    return `Données de l'opportunité (spread faible, publiée GRATUITEMENT) :
PAIRE : ${opp.pair} (${opp.region})
ACHAT : ${opp.buyPlatform} — VENTE : ${opp.sellPlatform}
SPREAD NET : +${opp.spreadNet}% (modeste — les opportunités premium dans la Mini App vont jusqu'à +5%+)
URL BOT : ${botUrl}

Rédige le message freemium FR selon la structure demandée.`;
  }
  return `Opportunity data (low spread, published FREE):
PAIR: ${opp.pair} (${opp.region})
BUY: ${opp.buyPlatform} — SELL: ${opp.sellPlatform}
NET SPREAD: +${opp.spreadNet}% (modest — premium opportunities in the Mini App go up to +5%+)
BOT URL: ${botUrl}

Write the freemium EN message following the required structure.`;
}

function buildTeaserUserPrompt(opp: OpportunityInput, botUrl: string, lang: "FR" | "EN"): string {
  if (lang === "FR") {
    return `Opportunité premium (détails cachés) :
PAIRE : ${opp.pair} (${opp.region})
SPREAD NET : +${opp.spreadNet}% (ÉLEVÉ — ne révèle pas les plateformes ni les vendeurs)
DURÉE AVANT EXPIRATION : ${opp.durationMin} minutes
URL BOT : ${botUrl}

Rédige le teaser FR sans révéler les détails.`;
  }
  return `Premium opportunity (details hidden):
PAIR: ${opp.pair} (${opp.region})
NET SPREAD: +${opp.spreadNet}% (HIGH — do not reveal platforms or sellers)
DURATION BEFORE EXPIRY: ${opp.durationMin} minutes
BOT URL: ${botUrl}

Write the EN teaser without revealing details.`;
}

function buildViralUserPrompt(botUrl: string, activeCount: number, bestSpread: number, lang: "FR" | "EN"): string {
  if (lang === "FR") {
    return `Contexte :
URL BOT : ${botUrl}
OPPORTUNITÉS ACTIVES : ${activeCount}
MEILLEUR SPREAD : +${bestSpread}%

Rédige le message viral FR.`;
  }
  return `Context:
BOT URL: ${botUrl}
ACTIVE OPPORTUNITIES: ${activeCount}
BEST SPREAD: +${bestSpread}%

Write the viral EN message.`;
}

// ── Generate marketing message (both FR + EN) ──────────────────

async function generateMarketingMessage(
  type: "FREEMIUM_LOW_SPREAD" | "PREMIUM_TEASER" | "VIRAL_HOOK",
  opp: OpportunityInput | null,
  botUrl: string,
  activeCount: number = 0,
  bestSpread: number = 0
): Promise<{ fr: string | null; en: string | null; llmModel: string | null }> {
  const prompts = {
    FREEMIUM_LOW_SPREAD: { fr: FREEMIUM_PROMPT_FR, en: FREEMIUM_PROMPT_EN },
    PREMIUM_TEASER: { fr: PREMIUM_TEASER_PROMPT_FR, en: PREMIUM_TEASER_PROMPT_EN },
    VIRAL_HOOK: { fr: VIRAL_HOOK_PROMPT_FR, en: VIRAL_HOOK_PROMPT_EN },
  };

  const selected = prompts[type];

  // Build user prompts based on type
  const userPromptFr = type === "VIRAL_HOOK"
    ? buildViralUserPrompt(botUrl, activeCount, bestSpread, "FR")
    : opp ? buildFreemiumUserPrompt(opp, botUrl, "FR") : buildViralUserPrompt(botUrl, activeCount, bestSpread, "FR");

  const userPromptEn = type === "VIRAL_HOOK"
    ? buildViralUserPrompt(botUrl, activeCount, bestSpread, "EN")
    : opp ? (type === "PREMIUM_TEASER" ? buildTeaserUserPrompt(opp, botUrl, "EN") : buildFreemiumUserPrompt(opp, botUrl, "EN")) : buildViralUserPrompt(botUrl, activeCount, bestSpread, "EN");

  // Use the generateBothLanguages helper but with custom prompts
  // We need to call the LLM directly with our custom system prompts
  const frMessage = await callLlmWithPrompt(selected.fr, userPromptFr);
  const enMessage = await callLlmWithPrompt(selected.en, userPromptEn);

  return {
    fr: frMessage?.content ?? null,
    en: enMessage?.content ?? null,
    llmModel: frMessage?.llmModel ?? enMessage?.llmModel ?? null,
  };
}

// Helper: call LLM with a custom system prompt (bypasses the default CDC prompts)
async function callLlmWithPrompt(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; llmModel: string } | null> {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  if (!hasOpenRouter) {
    console.error("[Marketing LLM] OPENROUTER_API_KEY not set — cannot generate marketing message");
    return null;
  }

  const skipIds = new Set<string>();

  for (let attempt = 0; attempt < 3; attempt++) {
    const nextLlm = await selectNextLlm(skipIds);
    if (!nextLlm) break;

    try {
      const apiKey = process.env.OPENROUTER_API_KEY!;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://p2p-arbitrage-scout.vercel.app",
            "X-Title": "P2P Arbitrage Scout Marketing",
          },
          body: JSON.stringify({
            model: nextLlm.name,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 800,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.status === 429 || res.status === 402) throw new Error(`Rate limit on ${nextLlm.name}`);
        if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? "";
        if (!content.trim()) throw new Error("Empty response");
        await markLlmUsed(nextLlm.id);
        return { content: content.trim(), llmModel: nextLlm.name };
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    } catch (err) {
      console.error(`[Marketing LLM] ${nextLlm.name} failed:`, err);
      await markLlmUsed(nextLlm.id);
      skipIds.add(nextLlm.id);
    }
  }

  console.error("[Marketing LLM] All OpenRouter models failed");
  return null;
}

// ── Main: run marketing campaign ────────────────────────────────

export interface MarketingResult {
  ok: boolean;
  freemiumSent: number;
  teasersSent: number;
  viralSent: number;
  errors: string[];
}

export async function runMarketingCampaign(
  opportunities: { freemium: OpportunityInput[]; premium: OpportunityInput[] },
  botUrl: string
): Promise<MarketingResult> {
  const errors: string[] = [];
  let freemiumSent = 0;
  let teasersSent = 0;
  let viralSent = 0;

  // Get active count + best spread for viral message context
  const activeCount = await db.opportunity.count({ where: { status: "ACTIVE" } });
  const bestOpp = await db.opportunity.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { spreadNet: "desc" },
  });
  const bestSpread = bestOpp?.spreadNet ?? 0;

  // 1. Send 1 freemium message (low-spread opportunity with CTA)
  if (opportunities.freemium.length > 0) {
    const freemiumOpp = opportunities.freemium[0];
    try {
      const msg = await generateMarketingMessage("FREEMIUM_LOW_SPREAD", freemiumOpp, botUrl, activeCount, bestSpread);
      if (msg.fr && msg.en) {
        const tgResult = await publishToBothChannels(msg.fr, msg.en);
        if (tgResult.fr.ok && tgResult.en.ok) {
          await db.marketingCampaign.create({
            data: {
              type: "FREEMIUM_LOW_SPREAD",
              messageFr: msg.fr,
              messageEn: msg.en,
              llmModel: msg.llmModel,
            },
          });
          freemiumSent++;
        } else {
          errors.push(`Freemium Telegram send failed: FR=${tgResult.fr.error} EN=${tgResult.en.error}`);
        }
      } else {
        errors.push("Freemium LLM generation failed (no content)");
      }
    } catch (err) {
      errors.push(`Freemium error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // 2. Send 1 premium teaser (high-spread opportunity, details hidden)
  if (opportunities.premium.length > 0) {
    const teaserOpp = opportunities.premium[0];
    try {
      const msg = await generateMarketingMessage("PREMIUM_TEASER", teaserOpp, botUrl, activeCount, bestSpread);
      if (msg.fr && msg.en) {
        const tgResult = await publishToBothChannels(msg.fr, msg.en);
        if (tgResult.fr.ok && tgResult.en.ok) {
          await db.marketingCampaign.create({
            data: {
              type: "PREMIUM_TEASER",
              messageFr: msg.fr,
              messageEn: msg.en,
              llmModel: msg.llmModel,
            },
          });
          teasersSent++;
        } else {
          errors.push(`Teaser Telegram send failed: FR=${tgResult.fr.error} EN=${tgResult.en.error}`);
        }
      } else {
        errors.push("Teaser LLM generation failed (no content)");
      }
    } catch (err) {
      errors.push(`Teaser error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // 3. Send 1 viral hook (every ~6 hours = every ~72 scans at 5min interval)
  const lastViral = await db.marketingCampaign.findFirst({
    where: { type: "VIRAL_HOOK" },
    orderBy: { sentAt: "desc" },
  });
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  if (!lastViral || lastViral.sentAt < sixHoursAgo) {
    try {
      const msg = await generateMarketingMessage("VIRAL_HOOK", null, botUrl, activeCount, bestSpread);
      if (msg.fr && msg.en) {
        const tgResult = await publishToBothChannels(msg.fr, msg.en);
        if (tgResult.fr.ok && tgResult.en.ok) {
          await db.marketingCampaign.create({
            data: {
              type: "VIRAL_HOOK",
              messageFr: msg.fr,
              messageEn: msg.en,
              llmModel: msg.llmModel,
            },
          });
          viralSent++;
        } else {
          errors.push(`Viral Telegram send failed: FR=${tgResult.fr.error} EN=${tgResult.en.error}`);
        }
      }
    } catch (err) {
      errors.push(`Viral error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return {
    ok: true,
    freemiumSent,
    teasersSent,
    viralSent,
    errors,
  };
}
