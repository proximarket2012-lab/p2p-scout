"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, Calculator, Clock, Copy, Loader2, Send, ShieldCheck,
  Star, TrendingUp, AlertTriangle, CheckCircle2, Sparkles,
} from "lucide-react";
import {
  type Opportunity,
  apiGenerate,
  apiPublish,
  formatPrice,
  platformColor,
  platformLogo,
  regionEmoji,
  statusColor,
  statusLabel,
  timeLeft,
} from "@/lib/types";
import { toast } from "sonner";

interface OpportunityDetailProps {
  opp: Opportunity | null;
  onClose: () => void;
  onPublished?: (id: string) => void;
}

type Lang = "FR" | "EN";

export function OpportunityDetail({ opp, onClose, onPublished }: OpportunityDetailProps) {
  const [investment, setInvestment] = useState(100);
  const [lang, setLang] = useState<Lang>("FR");
  const [message, setMessage] = useState<string | null>(null);
  const [llmModel, setLlmModel] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (opp) {
      setInvestment(100);
      setLang("FR");
      setMessage(opp.messageFr || null);
      setLlmModel(opp.llmModel || null);
      setCached(!!opp.messageFr);
    } else {
      setMessage(null);
      setLlmModel(null);
    }
  }, [opp]);

  // Lock body scroll when open
  useEffect(() => {
    if (opp) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [opp]);

  if (!opp) return null;

  const usdtBought = investment / opp.buyPrice;
  const grossSale = usdtBought * opp.sellPrice;
  const buyFeeAmount = investment * (opp.feesTotal / 100) * (opp.buyPlatform === "Noones" ? 1 : 0); // simplified: fees on Noones side only if applicable
  const sellFeeAmount = (grossSale - investment) * 0; // simplified for display
  const netProfit = grossSale - investment - buyFeeAmount - sellFeeAmount;
  const netPct = (netProfit / investment) * 100;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await apiGenerate(opp.id, lang);
      if (r.ok) {
        setMessage(r.message);
        setLlmModel(r.llmModel);
        setCached(r.cached);
        toast.success(r.cached ? "Message récupéré du cache" : `Message généré par ${r.llmModel}`);
      } else {
        toast.error("Échec de génération LLM");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur LLM");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const r = await apiPublish(opp.id);
      if (r.ok) {
        toast.success("Publié sur les canaux Telegram FR + EN");
        onPublished?.(opp.id);
        onClose();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur publication");
    } finally {
      setPublishing(false);
    }
  };

  const copyMessage = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    toast.success("Message copié dans le presse-papier");
  };

  const tl = timeLeft(opp.expiresAt);

  return (
    <AnimatePresence>
      {opp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto scrollbar-dark bg-[#0A1628] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden>{regionEmoji(opp.region)}</span>
                  <span className="font-bold text-white text-lg">{opp.pair}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                    style={{
                      color: statusColor(opp.status),
                      background: `${statusColor(opp.status)}15`,
                      border: `1px solid ${statusColor(opp.status)}30`,
                    }}
                  >
                    {statusLabel(opp.status)}
                  </span>
                </div>
                <div className="text-xs text-white/50">
                  Détecté {new Date(opp.detectedAt).toLocaleString("fr-FR")}
                  {opp.status === "ACTIVE" && (
                    <span className="ml-2 inline-flex items-center gap-1" style={{ color: tl.color }}>
                      <Clock className="h-3 w-3" />
                      Expire dans {tl.label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Hero spread */}
              <div className="relative overflow-hidden rounded-2xl gradient-brand-soft p-5 border border-white/10">
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-40" style={{ background: "#00C48C" }} aria-hidden />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Spread net</div>
                    <div className="text-5xl font-bold text-[#00C48C] text-glow">
                      +{opp.spreadNet.toFixed(2)}%
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      brut +{opp.spreadBrut.toFixed(2)}% − frais {opp.feesTotal.toFixed(2)}% − buffer 0.2%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Durée estimée</div>
                    <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#F5A623]" />
                      ~{opp.durationMin} min
                    </div>
                    <div className="text-xs text-white/50 mt-1">Volume dispo: {opp.volumeAvailable} USDT</div>
                  </div>
                </div>
              </div>

              {/* Step 1 + 2 — buy & sell */}
              <div className="grid sm:grid-cols-2 gap-4">
                <StepCard
                  step={1}
                  title="ACHÈTE ICI"
                  platformName={opp.buyPlatform}
                  merchant={opp.buyMerchant}
                  rating={opp.buyMerchantRating}
                  trades={opp.buyTrades}
                  price={`${formatPrice(opp.buyPrice, opp.fiat)} ${opp.fiat}`}
                  priceLabel="Prix d'achat"
                  color="#00C48C"
                />
                <StepCard
                  step={2}
                  title="REVENDS LÀ"
                  platformName={opp.sellPlatform}
                  merchant={opp.sellMerchant}
                  rating={opp.sellMerchantRating}
                  trades={opp.sellTrades}
                  price={`${formatPrice(opp.sellPrice, opp.fiat)} ${opp.fiat}`}
                  priceLabel="Prix de vente"
                  color="#00B5A3"
                />
              </div>

              {/* Calculator */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-4 w-4 text-[#00B5A3]" />
                  <h3 className="font-semibold text-white">Calculateur de gain</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">
                      Combien veux-tu investir ?
                    </label>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="number"
                        value={investment}
                        min={10}
                        max={10000}
                        step={10}
                        onChange={(e) => setInvestment(Math.max(10, Math.min(10000, Number(e.target.value) || 0)))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00B5A3]"
                      />
                      <span className="text-white/60 text-sm">{opp.fiat}</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={5000}
                      step={10}
                      value={Math.min(investment, 5000)}
                      onChange={(e) => setInvestment(Number(e.target.value))}
                      className="w-full accent-[#00B5A3]"
                    />
                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                      <span>10</span><span>5000</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <CalcRow label={`Tu achètes (${opp.pair.split("/")[0]})`} value={`${usdtBought.toFixed(4)} USDT`} />
                    <CalcRow label="Tu revends (brut)" value={`${grossSale.toFixed(2)} ${opp.fiat}`} color="#00B5A3" />
                    {opp.feesTotal > 0 && (
                      <CalcRow label={`Frais plateforme (${opp.feesTotal}%)`} value={`-${buyFeeAmount.toFixed(2)} ${opp.fiat}`} color="#F5A623" />
                    )}
                    <div className="border-t border-white/10 pt-2">
                      <CalcRow
                        label="BÉNÉFICE NET"
                        value={`${netProfit.toFixed(2)} ${opp.fiat} (+${netPct.toFixed(2)}%)`}
                        color="#00C48C"
                        bold
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LLM message generation */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#6C3FC7]" />
                    <h3 className="font-semibold text-white">Message Telegram généré par LLM</h3>
                  </div>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                    {(["FR", "EN"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLang(l);
                          setMessage(l === "FR" ? opp.messageFr : opp.messageEn);
                          setCached(!!(l === "FR" ? opp.messageFr : opp.messageEn));
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          lang === l ? "gradient-success text-white" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {l === "FR" ? "🇫🇷 FR" : "🌍 EN"}
                      </button>
                    ))}
                  </div>
                </div>

                {message ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl bg-[#0A1628] border border-white/10 p-4 max-h-72 overflow-y-auto scrollbar-dark">
                      <pre className="whitespace-pre-wrap text-xs text-white/85 font-sans leading-relaxed">{message}</pre>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-white/50 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#00B5A3]" />
                        Généré par <span className="text-white/80 font-medium">{llmModel}</span>
                        {cached && <span className="text-[#00B5A3]">· cache</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          Régénérer
                        </button>
                        <button
                          onClick={copyMessage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copier
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 text-[#6C3FC7] mx-auto mb-3" />
                    <p className="text-sm text-white/60 mb-4">
                      Génère le message Telegram prêt à publier en {lang === "FR" ? "français" : "anglais"}.
                      <br />
                      <span className="text-xs text-white/40">Format SEO : 200-350 mots, hashtags, structure CDC</span>
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-white font-medium text-sm shadow-glow disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Génération LLM en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Générer en {lang}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Risk warning */}
              <div className="rounded-xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 leading-relaxed">
                  <strong className="text-[#F5A623]">⚠ ATTENTION :</strong> Les prix P2P changent vite.
                  Vérifie toujours le prix avant d&apos;agir. Si le prix a bougé de plus de 2 {opp.fiat},
                  attends la prochaine alerte. Ne mise jamais plus que tu ne peux te permettre de perdre.
                </div>
              </div>

              {/* Publish CTA */}
              {opp.status === "ACTIVE" && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handlePublish}
                    disabled={!message || publishing}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl gradient-success text-white font-semibold shadow-glow disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-success-glow transition-all"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publication...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Publier sur Telegram FR + EN
                      </>
                    )}
                  </button>
                  {!message && (
                    <p className="text-xs text-white/40 w-full text-center">
                      Génère d&apos;abord le message avant de publier
                    </p>
                  )}
                </div>
              )}

              {opp.status === "PUBLISHED" && opp.publishedAt && (
                <div className="rounded-xl bg-[#00B5A3]/5 border border-[#00B5A3]/30 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00B5A3] shrink-0" />
                  <div className="text-sm text-white/80">
                    Publié le <span className="font-medium text-white">{new Date(opp.publishedAt).toLocaleString("fr-FR")}</span> sur les canaux FR + EN.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepCard({
  step, title, platformName, merchant, rating, trades, price, priceLabel, color,
}: {
  step: number; title: string; platformName: string; merchant: string;
  rating: number; trades: number; price: string; priceLabel: string; color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl opacity-30" style={{ background: color }} aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: color }}>
            {step}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{title}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: platformColor(platformName) }}
            aria-hidden
          >
            {platformLogo(platformName)}
          </span>
          <div>
            <div className="text-sm font-semibold text-white">{platformName}</div>
            <div className="text-[10px] text-white/50">Vendeur: {merchant}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] uppercase text-white/40">{priceLabel}</div>
            <div className="font-bold text-base" style={{ color }}>{price}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-white/40">Fiabilité</div>
            <div className="flex items-center gap-1 text-white/80">
              <Star className="h-3 w-3" style={{ color }} fill={color} />
              <span className="font-medium">{rating}%</span>
              <span className="text-[10px] text-white/40">· {trades} trades</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalcRow({
  label, value, color, bold,
}: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-white/60 ${bold ? "font-semibold" : ""}`}>{label}</span>
      <span
        className={bold ? "font-bold text-base" : "font-medium"}
        style={{ color: color ?? "white" }}
      >
        {value}
      </span>
    </div>
  );
}
