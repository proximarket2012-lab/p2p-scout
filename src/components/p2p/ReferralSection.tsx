"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Users, Coins, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  ok: boolean;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  recentReferrals: {
    refereeName: string | null;
    status: string;
    commission: number;
    referredAt: string;
  }[];
}

interface ReferralSectionProps {
  language: "fr" | "en";
  authToken?: string | null;
}

export function ReferralSection({ language }: ReferralSectionProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFr = language === "fr";

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get initData from Telegram WebApp
      const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
      const initData = tg?.initData;
      const headers: Record<string, string> = {};
      if (typeof initData === "string" && initData.length > 0) {
        headers["X-Telegram-Init-Data"] = initData;
      }

      const res = await fetch("/api/referral/stats", { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!stats?.referralLink) return;
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    toast.success(isFr ? "Lien copié !" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!stats?.referralLink) return;
    const shareData = {
      title: "P2P Arbitrage Scout",
      text: isFr
        ? "🚀 Gagne de l'argent avec l'arbitrage crypto P2P ! Des opportunités détectées automatiquement, expliquées simplement. Rejoins-moi :"
        : "🚀 Make money with P2P crypto arbitrage! Opportunities detected automatically, explained simply. Join me:",
      url: stats.referralLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyLink();
      }
    } catch {
      // User cancelled share
    }
  };

  // Use Telegram WebApp share if available
  const shareViaTelegram = () => {
    if (!stats?.referralLink) return;
    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void; switchInlineQuery?: (q: string, t: string) => void } } }).Telegram?.WebApp;
    const shareText = isFr
      ? `🚀 Gagne de l'argent avec l'arbitrage crypto P2P ! Rejoins-moi sur P2P Arbitrage Scout : ${stats.referralLink}`
      : `🚀 Make money with P2P crypto arbitrage! Join me on P2P Arbitrage Scout: ${stats.referralLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent(shareText)}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-[#00B5A3]/30 border-t-[#00B5A3] rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 text-center">
        <p className="text-sm text-white/60">
          {isFr ? "Connecte-toi via Telegram pour accéder au parrainage" : "Sign in via Telegram to access referrals"}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand-soft border border-white/10 p-5">
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl opacity-40" style={{ background: "#F5A623" }} aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-[#F5A623]" />
            <h2 className="text-lg font-bold text-white">
              {isFr ? "Parrainez et gagnez" : "Refer and earn"}
            </h2>
          </div>
          <p className="text-xs text-white/70 leading-relaxed mb-4">
            {isFr ? (
              <>Partagez votre lien personnel et gagnez <strong className="text-[#F5A623]">10,4% des dépenses</strong> de chaque ami que vous parrainez. Chaque fois qu'un ami débloque une opportunité, vous touchez votre part — à vie.</>
            ) : (
              <>Share your personal link and earn <strong className="text-[#F5A623]">10.4% of the spending</strong> of each friend you refer. Every time a friend unlocks an opportunity, you get your cut — for life.</>
            )}
          </p>

          {/* Referral link box */}
          <div className="rounded-xl bg-[#0A1628]/60 border border-white/10 p-3 mb-3">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
              {isFr ? "Votre lien personnel" : "Your personal link"}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-[#00B5A3] truncate font-mono">
                {stats.referralLink}
              </code>
              <button
                onClick={copyLink}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[#00C48C]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-white/60" />
                )}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              onClick={shareViaTelegram}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gradient-success text-white text-xs font-semibold shadow-glow"
            >
              <Share2 className="h-3.5 w-3.5" />
              {isFr ? "Partager sur Telegram" : "Share on Telegram"}
            </button>
            <button
              onClick={shareLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-medium hover:bg-white/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              {isFr ? "Autre" : "Other"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-[#00B5A3]" />
          </div>
          <div className="text-xl font-bold text-white">{stats.totalReferrals}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wide">
            {isFr ? "Filleuls" : "Referrals"}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-[#00C48C]" />
          </div>
          <div className="text-xl font-bold text-white">{stats.activeReferrals}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wide">
            {isFr ? "Actifs" : "Active"}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Coins className="h-4 w-4 text-[#F5A623]" />
          </div>
          <div className="text-xl font-bold text-[#F5A623]">⭐{stats.totalCommission}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wide">
            {isFr ? "Gagné" : "Earned"}
          </div>
        </div>
      </div>

      {/* Recent referrals list */}
      {stats.recentReferrals.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <h3 className="text-sm font-bold text-white mb-3">
            {isFr ? "Vos filleuls" : "Your referrals"}
          </h3>
          <div className="space-y-2">
            {stats.recentReferrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C3FC7] to-[#00B5A3] flex items-center justify-center text-[10px] font-bold text-white">
                    {r.refereeName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-xs text-white font-medium">
                      {r.refereeName || (isFr ? "Utilisateur" : "User")}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {new Date(r.referredAt).toLocaleDateString(isFr ? "fr-FR" : "en-US")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {r.commission > 0 ? (
                    <div className="text-xs font-bold text-[#F5A623]">⭐{r.commission}</div>
                  ) : (
                    <div className="text-[10px] text-white/40">
                      {r.status === "PENDING" ? (isFr ? "En attente" : "Pending") : (isFr ? "Actif" : "Active")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl bg-[#6C3FC7]/5 border border-[#6C3FC7]/30 p-4">
        <h3 className="text-sm font-bold text-[#6C3FC7] mb-2">
          {isFr ? "Comment ça marche" : "How it works"}
        </h3>
        <ol className="space-y-1.5 text-xs text-white/70">
          <li className="flex gap-2"><strong className="text-[#6C3FC7]">1.</strong> {isFr ? "Copiez votre lien personnel ci-dessus" : "Copy your personal link above"}</li>
          <li className="flex gap-2"><strong className="text-[#6C3FC7]">2.</strong> {isFr ? "Partagez-le à vos amis, groupes et canaux" : "Share it with friends, groups and channels"}</li>
          <li className="flex gap-2"><strong className="text-[#6C3FC7]">3.</strong> {isFr ? "Quand un ami s'inscrit et débloque une opportunité, vous gagnez 10,4%" : "When a friend signs up and unlocks an opportunity, you earn 10.4%"}</li>
          <li className="flex gap-2"><strong className="text-[#6C3FC7]">4.</strong> {isFr ? "Vos gains s'accumulent à vie sur chaque dépense de vos filleuls" : "Your earnings accumulate for life on every referral spend"}</li>
        </ol>
      </div>
    </motion.div>
  );
}
