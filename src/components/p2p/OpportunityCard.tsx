"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Star, TrendingUp } from "lucide-react";
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

interface OpportunityCardProps {
  opp: Opportunity;
  onSelect: (opp: Opportunity) => void;
  index?: number;
}

export function OpportunityCard({ opp, onSelect, index = 0 }: OpportunityCardProps) {
  const tl = timeLeft(opp.expiresAt);
  const isExpired = opp.status === "EXPIRED";
  const isSuspicious = opp.status === "SUSPICIOUS";
  const isPublished = !!opp.publishedAt;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(opp)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className="group text-left w-full relative overflow-hidden rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:border-[#6C3FC7]/40 transition-all shadow-card hover:shadow-glow"
    >
      {/* Status + Published badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        {isPublished && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
            style={{
              color: "#00B5A3",
              background: "#00B5A315",
              border: "1px solid #00B5A330",
            }}
          >
            ✓ Publié FR+EN
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{
            color: statusColor(opp.status),
            background: `${statusColor(opp.status)}15`,
            border: `1px solid ${statusColor(opp.status)}30`,
          }}
        >
          {statusLabel(opp.status)}
        </span>
      </div>

      {/* Pair + region */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden>{regionEmoji(opp.region)}</span>
        <span className="font-bold text-white text-base tracking-tight">{opp.pair}</span>
      </div>

      {/* Spread (hero number) */}
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
          brut +{opp.spreadBrut.toFixed(2)}% · frais {opp.feesTotal.toFixed(2)}% · buffer 0.2%
        </div>
      </div>

      {/* Buy → Sell platforms */}
      <div className="flex items-center gap-2 mb-4">
        <PlatformPill name={opp.buyPlatform} label="ACHAT" />
        <ArrowRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
        <PlatformPill name={opp.sellPlatform} label="VENTE" />
      </div>

      {/* Merchant info */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <MerchantInfo
          name={opp.buyMerchant}
          rating={opp.buyMerchantRating}
          trades={opp.buyTrades}
          price={`${formatPrice(opp.buyPrice, opp.fiat)} ${opp.fiat}`}
          side="buy"
        />
        <MerchantInfo
          name={opp.sellMerchant}
          rating={opp.sellMerchantRating}
          trades={opp.sellTrades}
          price={`${formatPrice(opp.sellPrice, opp.fiat)} ${opp.fiat}`}
          side="sell"
        />
      </div>

      {/* Footer: timer + detected + CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          {!isExpired && !isSuspicious && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" style={{ color: tl.color }} />
              <span style={{ color: tl.color }}>{opp.status === "ACTIVE" ? tl.label : "—"}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {timeAgo(opp.detectedAt)}
          </span>
          {isPublished && (
            <span className="inline-flex items-center gap-1 text-[#00B5A3]">
              <ShieldCheck className="h-3 w-3" />
              Publié FR + EN
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-[#00B5A3] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          Voir le guide <ArrowRight className="h-3 w-3" />
        </span>
      </div>

      {isSuspicious && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F5A623]" aria-hidden />
      )}
    </motion.button>
  );
}

function PlatformPill({ name, label }: { name: string; label: string }) {
  const color = platformColor(name);
  const logo = platformLogo(name);
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white shrink-0"
          style={{ background: color }}
          aria-hidden
        >
          {logo}
        </span>
        <span className="text-xs font-medium text-white truncate">{name}</span>
      </div>
    </div>
  );
}

function MerchantInfo({
  name, rating, trades, price, side,
}: { name: string; rating: number; trades: number; price: string; side: "buy" | "sell" }) {
  const color = side === "buy" ? "#00C48C" : "#00B5A3";
  return (
    <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5">
      <div className="text-[9px] uppercase tracking-wide text-white/40 mb-0.5">{side === "buy" ? "Vendeur" : "Acheteur"}</div>
      <div className="text-white/90 text-xs font-medium truncate">{name}</div>
      <div className="flex items-center gap-1 mt-1">
        <Star className="h-2.5 w-2.5" style={{ color }} fill={color} />
        <span className="text-[10px] text-white/60">{rating}% · {trades} trades</span>
      </div>
      <div className="text-[10px] font-semibold mt-1" style={{ color }}>{price}</div>
    </div>
  );
}
