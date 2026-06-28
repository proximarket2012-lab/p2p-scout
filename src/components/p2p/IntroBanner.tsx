"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Lock, Star } from "lucide-react";

interface IntroBannerProps {
  language: "fr" | "en";
  activeCount: number;
  bestSpread: number;
}

export function IntroBanner({ language, activeCount, bestSpread }: IntroBannerProps) {
  const isFr = language === "fr";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl gradient-brand-soft border border-white/10 p-5 mb-5"
    >
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl opacity-40" style={{ background: "#00C48C" }} aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-[#00B5A3]" />
          <span className="text-[10px] uppercase tracking-wider text-[#00B5A3] font-semibold">
            {isFr ? "Opportunités exceptionnelles" : "Exceptional opportunities"}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 leading-tight">
          {isFr ? (
            <>Des opportunités que tu ne trouveras <span className="gradient-text">nulle part ailleurs</span></>
          ) : (
            <>Opportunities you won't find <span className="gradient-text">anywhere else</span></>
          )}
        </h2>
        <p className="text-xs text-white/70 leading-relaxed mb-3">
          {isFr ? (
            <>
              Notre scanner surveille en continu <strong className="text-white">8 plateformes P2P</strong> mondiales
              et détecte les écarts de prix <strong className="text-[#00C48C]">nets de frais ≥ 1,5%</strong> en temps réel.
              Chaque opportunité est rédigée par une IA en langage simple, sans jargon, prête à exécuter en moins de 30 minutes.
            </>
          ) : (
            <>
              Our scanner continuously monitors <strong className="text-white">8 global P2P platforms</strong>
              {" "}and detects price gaps <strong className="text-[#00C48C]">net of fees ≥ 1.5%</strong> in real time.
              Each opportunity is written by AI in plain language, no jargon, ready to execute in under 30 minutes.
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00C48C]/15 border border-[#00C48C]/30">
            <TrendingUp className="h-3 w-3 text-[#00C48C]" />
            <span className="text-[#00C48C] font-semibold">{activeCount} {isFr ? "actives" : "active"}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00B5A3]/15 border border-[#00B5A3]/30">
            <Star className="h-3 w-3 text-[#00B5A3]" />
            <span className="text-[#00B5A3] font-semibold">{isFr ? "Meilleur" : "Best"}: +{bestSpread.toFixed(2)}%</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            <Lock className="h-3 w-3 text-white/50" />
            <span className="text-white/60">{isFr ? "Débloque avec ⭐ Stars" : "Unlock with ⭐ Stars"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
