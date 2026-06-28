"use client";

import { motion } from "framer-motion";
import { Lock, Star, ArrowRight, Clock, TrendingUp, Eye } from "lucide-react";
import {
  type Opportunity,
  formatPrice,
  platformColor,
  platformLogo,
  regionEmoji,
  statusColor,
  statusLabel,
  timeAgo,
  timeLeft,
} from "@/lib/types";

interface LockedOpportunityCardProps {
  opp: Opportunity;
  language: "fr" | "en";
  onUnlock: (opp: Opportunity) => void;
  isUnlocked?: boolean;
  index?: number;
}

export function LockedOpportunityCard({
  opp,
  language,
  onUnlock,
  isUnlocked = false,
  index = 0,
}: LockedOpportunityCardProps) {
  const tl = timeLeft(opp.expiresAt);
  const isFr = language === "fr";
  const starsPrice = opp.starsPrice ?? 25;
  const isExpired = opp.status === "EXPIRED";
  const isSuspicious = opp.status === "SUSPICIOUS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#6C3FC7]/40 transition-all shadow-card"
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
        {isUnlocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: "#00B5A3", background: "#00B5A315", border: "1px solid #00B5A330" }}>
            ✓ {isFr ? "Débloqué" : "Unlocked"}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: statusColor(opp.status), background: `${statusColor(opp.status)}15`, border: `1px solid ${statusColor(opp.status)}30` }}>
          {statusLabel(opp.status)}
        </span>
      </div>

      {/* Stars price badge (top-left, prominent) */}
      {!isUnlocked && !isExpired && (
        <div className="absolute top-3 left-3 z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFD700] text-[#0A1628] text-[11px] font-bold shadow-lg">
            <Star className="h-3 w-3" fill="#0A1628" />
            {starsPrice}
          </div>
        </div>
      )}

      <div className="p-5 pt-12">
        {/* Pair + region */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg" aria-hidden>{regionEmoji(opp.region)}</span>
          <span className="font-bold text-white text-base tracking-tight">{opp.pair}</span>
        </div>

        {/* Spread (always visible) */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: opp.spreadNet >= 3 ? "#00C48C" : opp.spreadNet >= 2 ? "#00B5A3" : "#F5A623" }}
            >
              +{opp.spreadNet.toFixed(2)}%
            </span>
            <span className="text-xs text-white/40 uppercase tracking-wide">net</span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {isFr ? "brut" : "gross"} +{opp.spreadBrut.toFixed(2)}% · {isFr ? "frais" : "fees"} {opp.feesTotal.toFixed(2)}% · buffer 0.2%
          </div>
        </div>

        {/* Buy → Sell platforms (always visible) */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">{isFr ? "Achat" : "Buy"}</div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white shrink-0"
                style={{ background: platformColor(opp.buyPlatform) }} aria-hidden>
                {platformLogo(opp.buyPlatform)}
              </span>
              <span className="text-xs font-medium text-white truncate">{opp.buyPlatform}</span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">{isFr ? "Vente" : "Sell"}</div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white shrink-0"
                style={{ background: platformColor(opp.sellPlatform) }} aria-hidden>
                {platformLogo(opp.sellPlatform)}
              </span>
              <span className="text-xs font-medium text-white truncate">{opp.sellPlatform}</span>
            </div>
          </div>
        </div>

        {/* LOCKED CONTENT — blurred preview */}
        {!isUnlocked ? (
          <div className="relative rounded-xl bg-[#0A1628]/60 border border-white/5 p-3 mb-4 overflow-hidden">
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-md bg-[#0A1628]/40 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#6C3FC7]/20 border border-[#6C3FC7]/40 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#6C3FC7]" />
                </div>
                <span className="text-[10px] text-white/60 font-medium">
                  {isFr ? "Contenu verrouillé" : "Locked content"}
                </span>
              </div>
            </div>
            {/* Fake content (blurred underneath) */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Vendeur" : "Seller"}</span>
                <span className="text-white/20 blur-sm">█████████</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Prix achat" : "Buy price"}</span>
                <span className="text-white/20 blur-sm">████ {opp.fiat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Prix vente" : "Sell price"}</span>
                <span className="text-white/20 blur-sm">████ {opp.fiat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Bénéfice net" : "Net profit"}</span>
                <span className="text-[#00C48C]/30 blur-sm">+████ {opp.fiat}</span>
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED CONTENT — full data */
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 mb-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Vendeur" : "Seller"}</span>
                <span className="text-white font-medium">{opp.buyMerchant || "—"} ({opp.buyMerchantRating ?? "—"}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Prix achat" : "Buy price"}</span>
                <span className="text-[#00C48C] font-bold">{formatPrice(opp.buyPrice, opp.fiat)} {opp.fiat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">{isFr ? "Prix vente" : "Sell price"}</span>
                <span className="text-[#00B5A3] font-bold">{formatPrice(opp.sellPrice, opp.fiat)} {opp.fiat}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-white/40">{isFr ? "Volume dispo" : "Volume"}</span>
                <span className="text-white/80">{opp.volumeAvailable ?? "—"} USDT</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 text-[11px] text-white/50">
            {!isExpired && !isSuspicious && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" style={{ color: tl.color }} />
                <span style={{ color: tl.color }}>{tl.label}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {timeAgo(opp.detectedAt)}
            </span>
          </div>

          {/* CTA button */}
          {!isUnlocked && !isExpired ? (
            <button
              onClick={() => onUnlock(opp)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-success text-white text-xs font-semibold shadow-glow hover:shadow-success-glow transition-all group-hover:scale-105"
            >
              <Star className="h-3 w-3" fill="white" />
              {isFr ? "Débloquer" : "Unlock"}
            </button>
          ) : isUnlocked ? (
            <button
              onClick={() => onUnlock(opp)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition-colors"
            >
              <Eye className="h-3 w-3" />
              {isFr ? "Voir détails" : "View details"}
            </button>
          ) : null}
        </div>
      </div>

      {isSuspicious && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F5A623]" aria-hidden />
      )}
    </motion.div>
  );
}
