"use client";

import { motion } from "framer-motion";
import { Activity, Radio, Zap, Globe2 } from "lucide-react";

interface HeroProps {
  activeCount: number;
  bestSpread: number;
  platforms: number;
  lastScanAgo: string;
  scannerActive: boolean;
  publishedCount: number;
  onScan: () => void;
  scanning: boolean;
}

export function Hero({ activeCount, bestSpread, platforms, lastScanAgo, scannerActive, publishedCount, onScan, scanning }: HeroProps) {
  return (
    <header className="relative overflow-hidden bg-radial-glow">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00C48C]/10 border border-[#00C48C]/30">
            <span className="relative flex h-2 w-2">
              {scannerActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C48C]" />
            </span>
            <span className="text-xs font-medium text-[#00C48C]">
              {scannerActive ? "Scanner actif" : "Scanner en pause"}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Radio className="h-3 w-3 text-[#00B5A3]" />
            <span className="text-xs text-white/70">Dernière mise à jour {lastScanAgo}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#6C3FC7]/20 to-[#00B5A3]/20 border border-white/10 mb-5">
            <Zap className="h-3.5 w-3.5 text-[#00B5A3]" />
            <span className="text-xs font-medium text-white/80 tracking-wide">
              8 Plateformes · 2 Canaux TG · 10 LLMs · 24/7
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="block text-white">P2P Arbitrage</span>
            <span className="block gradient-text text-glow">Scout</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            Système mondial de détection & publication d&apos;opportunités d&apos;arbitrage P2P.
            Signaux <span className="text-[#00C48C] font-medium">FR + EN</span>, nets de frais,
            publiés sur Telegram en <span className="text-[#00B5A3] font-medium">moins de 60 secondes</span>.
            Aucune expertise requise.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onScan}
              disabled={scanning}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl gradient-success text-white font-semibold shadow-glow hover:shadow-success-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scan en cours...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Lancer un scan
                </>
              )}
            </button>
            <a
              href="#opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Voir les opportunités
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <StatCard label="Opportunités actives" value={activeCount.toString()} color="#00C48C" emoji="🟢" />
          <StatCard label="Meilleur spread net" value={`+${bestSpread.toFixed(2)}%`} color="#00B5A3" emoji="📈" />
          <StatCard label="Auto-publiées (FR+EN)" value={publishedCount.toString()} color="#6C3FC7" emoji="📨" />
          <StatCard label="Plateformes surveillées" value={platforms.toString()} color="#F5A623" emoji="🏦" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-10 flex items-center gap-2 text-sm text-white/50"
        >
          <Globe2 className="h-4 w-4" />
          <span>Données actualisées en continu · Moteur LLM round-robin · Publication Telegram simultanée FR + EN</span>
        </motion.div>
      </div>
    </header>
  );
}

function StatCard({ label, value, color, emoji }: { label: string; value: string; color: string; emoji: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors shadow-card">
      <div
        className="absolute top-0 right-0 h-20 w-20 rounded-full blur-2xl opacity-30"
        style={{ background: color }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg" aria-hidden>{emoji}</span>
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/50 font-medium">{label}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}
