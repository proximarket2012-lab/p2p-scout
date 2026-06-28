"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type Opportunity,
  type Stats,
  apiGetStats,
  apiGetOpportunitiesFeed,
  apiGetUserUnlocks,
} from "@/lib/types";
import { toast } from "sonner";
import { BottomNav, type TabId } from "@/components/p2p/BottomNav";
import { IntroBanner } from "@/components/p2p/IntroBanner";
import { LockedOpportunityCard } from "@/components/p2p/LockedOpportunityCard";
import { UnlockModal } from "@/components/p2p/UnlockModal";
import { OpportunityDetail } from "@/components/p2p/OpportunityDetail";
import { Star, Unlock, Globe2, Sparkles } from "lucide-react";

interface CurrentUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  language: "fr" | "en";
  starsBalance: number;
  totalUnlocks: number;
  isPremium: boolean;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [feed, setFeed] = useState<Opportunity[]>([]);
  const [unlocks, setUnlocks] = useState<Opportunity[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("opportunities");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [unlockOpp, setUnlockOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"fr" | "en">("fr");

  const loadAll = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([
        apiGetStats(),
        apiGetOpportunitiesFeed({ status: "ACTIVE", limit: "50" }),
      ]);
      setStats(s);
      setFeed(f.opportunities);
      if (f.user) {
        setUser(f.user as CurrentUser);
        setLanguage(f.user.language as "fr" | "en");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnlocks = useCallback(async () => {
    if (!user) return;
    try {
      const u = await apiGetUserUnlocks();
      setUnlocks(u.opportunities);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60_000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (user) loadUnlocks();
  }, [user, loadUnlocks]);

  // Set Telegram WebApp theme + BackButton
  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } }).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.("#0A1628");
        tg.setBackgroundColor?.("#0A1628");
      } catch {}
    }
  }, []);

  const handleUnlocked = useCallback(async (oppId: string) => {
    setUnlockOpp(null);
    await Promise.all([loadAll(), loadUnlocks()]);
    // Find the now-unlocked opp and open detail
    const u = await apiGetUserUnlocks();
    const found = u.opportunities.find((o) => o.id === oppId);
    if (found) setSelectedOpp(found);
  }, [loadAll, loadUnlocks]);

  const isFr = language === "fr";
  const unlockedIds = new Set(unlocks.map((u) => u.id));

  // Loading state
  if (loading || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A1628]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-5xl mb-4 animate-pulse-soft" aria-hidden>🔍</div>
          <div className="text-2xl font-bold gradient-text mb-2">P2P Arbitrage Scout</div>
          <div className="flex items-center gap-2 justify-center text-sm text-white/50">
            <span className="h-3 w-3 border-2 border-[#00B5A3]/30 border-t-[#00B5A3] rounded-full animate-spin" />
            {isFr ? "Initialisation..." : "Loading..."}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A1628] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <div>
              <div className="text-sm font-bold text-white leading-none">P2P Arbitrage</div>
              <div className="text-[10px] text-[#00B5A3] font-medium">Scout</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <button
              onClick={() => setLanguage(isFr ? "en" : "fr")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-white/70 hover:bg-white/10"
              aria-label="Switch language"
            >
              <Globe2 className="h-3 w-3" />
              {isFr ? "🇫🇷 FR" : "🇬🇧 EN"}
            </button>
            {/* Live indicator (read-only — scans run automatically every 5 min) */}
            {stats.scannerActive && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00C48C]/15 border border-[#00C48C]/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00C48C]" />
                </span>
                <span className="text-[10px] text-[#00C48C] font-medium">{isFr ? "Live" : "Live"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 pt-4">
        <AnimatePresence mode="wait">
          {/* TAB 1: OPPORTUNITIES (home) */}
          {activeTab === "opportunities" && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <IntroBanner
                language={language}
                activeCount={stats.opportunities.active}
                bestSpread={stats.bestSpread}
              />

              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                  <div className="text-xl font-bold text-[#00C48C]">{stats.opportunities.active}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">{isFr ? "Actives" : "Active"}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                  <div className="text-xl font-bold text-[#00B5A3]">+{stats.bestSpread.toFixed(1)}%</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">{isFr ? "Meilleur" : "Best"}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                  <div className="text-xl font-bold text-[#6C3FC7]">{user?.totalUnlocks ?? 0}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wide">{isFr ? "Débloqués" : "Unlocked"}</div>
                </div>
              </div>

              {/* Section title */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00B5A3]" />
                  {isFr ? "Opportunités disponibles" : "Available opportunities"}
                </h2>
                <span className="text-[11px] text-white/40">{feed.length} {isFr ? "résultats" : "results"}</span>
              </div>

              {/* Opportunity grid */}
              {feed.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center">
                  <div className="text-3xl mb-2" aria-hidden>🔍</div>
                  <p className="text-sm text-white/60">{isFr ? "Aucune opportunité active." : "No active opportunities."}</p>
                  <p className="text-xs text-white/40 mt-1">{isFr ? "Lance un scan ou patiente." : "Run a scan or wait."}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {feed.map((opp, i) => (
                    <LockedOpportunityCard
                      key={opp.id}
                      opp={opp}
                      language={language}
                      onUnlock={(o) => setUnlockOpp(o)}
                      isUnlocked={unlockedIds.has(opp.id)}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: MY UNLOCKS */}
          {activeTab === "unlocks" && (
            <motion.div
              key="unlocks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!user ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center">
                  <Unlock className="h-10 w-10 text-white/30 mx-auto mb-3" />
                  <p className="text-sm text-white/60 mb-1">{isFr ? "Connecte-toi via Telegram" : "Sign in via Telegram"}</p>
                  <p className="text-xs text-white/40">{isFr ? "Ouvre la Mini App depuis @P2PScout2026Bot" : "Open the Mini App from @P2PScout2026Bot"}</p>
                </div>
              ) : unlocks.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center">
                  <Star className="h-10 w-10 text-[#F5A623]/50 mx-auto mb-3" />
                  <p className="text-sm text-white/60 mb-1">{isFr ? "Aucune opportunité débloquée" : "No unlocked opportunities"}</p>
                  <p className="text-xs text-white/40">{isFr ? "Va dans l'onglet Opportunités pour débloquer" : "Go to Opportunities tab to unlock"}</p>
                  <button
                    onClick={() => setActiveTab("opportunities")}
                    className="mt-4 px-4 py-2 rounded-lg gradient-success text-white text-xs font-semibold"
                  >
                    {isFr ? "Voir les opportunités" : "See opportunities"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-[#00B5A3]" />
                      {isFr ? "Mes opportunités débloquées" : "My unlocked opportunities"}
                    </h2>
                    <span className="text-[11px] text-white/40">{unlocks.length}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {unlocks.map((opp, i) => (
                      <LockedOpportunityCard
                        key={opp.id}
                        opp={opp}
                        language={language}
                        onUnlock={(o) => setSelectedOpp(o)}
                        isUnlocked={true}
                        index={i}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* TAB 3: GUIDE — Comment faire un arbitrage P2P (guide utilisateur) */}
          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Intro */}
              <div className="rounded-2xl gradient-brand-soft border border-white/10 p-5 mb-4">
                <h2 className="text-lg font-bold text-white mb-2">
                  {isFr ? "📖 Guide : comment profiter d'une opportunité" : "📖 Guide: how to profit from an opportunity"}
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  {isFr ? (
                    "L'arbitrage P2P consiste à acheter une crypto moins chère sur une plateforme et la revendre plus chère sur une autre, en gardant la différence. Voici comment faire étape par étape."
                  ) : (
                    "P2P arbitrage means buying crypto cheaper on one platform and selling it higher on another, keeping the difference. Here's how to do it step by step."
                  )}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-4">
                <GuideStep
                  num={1}
                  title={isFr ? "Choisis une opportunité" : "Pick an opportunity"}
                  desc={isFr
                    ? "Dans l'onglet Opportunités, choisis une opportunité avec un spread net intéressant (le % en vert). Plus le spread est élevé, plus tu gagnes."
                    : "In the Opportunities tab, pick an opportunity with an interesting net spread (the green %). Higher spread = more profit."}
                  color="#00C48C"
                  isFr={isFr}
                />
                <GuideStep
                  num={2}
                  title={isFr ? "Débloque avec tes Stars" : "Unlock with Stars"}
                  desc={isFr
                    ? "Clique sur 'Débloquer' et paie le prix en Telegram Stars. Tu accèdes immédiatement à tous les détails : vendeurs, prix exacts, calcul du bénéfice."
                    : "Click 'Unlock' and pay the Telegram Stars price. You immediately get all details: sellers, exact prices, profit calculation."}
                  color="#F5A623"
                  isFr={isFr}
                />
                <GuideStep
                  num={3}
                  title={isFr ? "Achète sur la plateforme 1" : "Buy on platform 1"}
                  desc={isFr
                    ? "Ouvre la plateforme d'achat indiquée (ex: Binance P2P). Cherche la paire (ex: USDT/XAF). Choisis le vendeur recommandé. Achète au prix indiqué."
                    : "Open the buy platform (e.g., Binance P2P). Search for the pair (e.g., USDT/XAF). Pick the recommended seller. Buy at the indicated price."}
                  color="#00B5A3"
                  isFr={isFr}
                />
                <GuideStep
                  num={4}
                  title={isFr ? "Revends sur la plateforme 2" : "Sell on platform 2"}
                  desc={isFr
                    ? "Ouvre la plateforme de vente indiquée (ex: Noones). Cherche la même paire. Choisis l'acheteur recommandé. Revends au prix indiqué."
                    : "Open the sell platform (e.g., Noones). Search for the same pair. Pick the recommended buyer. Sell at the indicated price."}
                  color="#6C3FC7"
                  isFr={isFr}
                />
                <GuideStep
                  num={5}
                  title={isFr ? "Empoche ton bénéfice" : "Pocket your profit"}
                  desc={isFr
                    ? "La différence entre le prix d'achat et le prix de vente, moins les frais, est ton bénéfice net. Le guide débloqué te montre le calcul exact."
                    : "The difference between buy and sell price, minus fees, is your net profit. The unlocked guide shows you the exact calculation."}
                  color="#00C48C"
                  isFr={isFr}
                />
              </div>

              {/* Tips */}
              <div className="rounded-2xl bg-[#00C48C]/5 border border-[#00C48C]/30 p-4 mb-4">
                <h3 className="text-sm font-bold text-[#00C48C] mb-2 flex items-center gap-2">
                  💡 {isFr ? "Conseils pour réussir" : "Tips for success"}
                </h3>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex gap-2"><span className="text-[#00C48C]">✓</span> {isFr ? "Agis vite : les prix changent en quelques minutes" : "Act fast: prices change in minutes"}</li>
                  <li className="flex gap-2"><span className="text-[#00C48C]">✓</span> {isFr ? "Vérifie toujours le prix avant de confirmer une transaction" : "Always verify the price before confirming a transaction"}</li>
                  <li className="flex gap-2"><span className="text-[#00C48C]">✓</span> {isFr ? "Choisis des vendeurs avec ≥ 95% de rating et ≥ 100 trades" : "Pick sellers with ≥ 95% rating and ≥ 100 trades"}</li>
                  <li className="flex gap-2"><span className="text-[#00C48C]">✓</span> {isFr ? "Préfère les stablecoins (USDT) pour éviter la volatilité" : "Prefer stablecoins (USDT) to avoid volatility"}</li>
                  <li className="flex gap-2"><span className="text-[#00C48C]">✓</span> {isFr ? "Commence avec un petit montant (50-100 USDT) pour tester" : "Start with a small amount (50-100 USDT) to test"}</li>
                </ul>
              </div>

              {/* Warning */}
              <div className="rounded-2xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-4">
                <h3 className="text-sm font-bold text-[#F5A623] mb-2 flex items-center gap-2">
                  ⚠️ {isFr ? "Risques à connaître" : "Risks to know"}
                </h3>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex gap-2"><span className="text-[#F5A623]">!</span> {isFr ? "Les prix peuvent bouger entre la détection et ton exécution" : "Prices may move between detection and your execution"}</li>
                  <li className="flex gap-2"><span className="text-[#F5A623]">!</span> {isFr ? "Un vendeur peut annuler la transaction (choisis des vendeurs fiables)" : "A seller may cancel the transaction (pick reliable sellers)"}</li>
                  <li className="flex gap-2"><span className="text-[#F5A623]">!</span> {isFr ? "Ne mise jamais plus que tu ne peux te permettre de perdre" : "Never bet more than you can afford to lose"}</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* TAB 4: INFO — À propos + pricing + disclaimer (sans détails techniques) */}
          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* About */}
              <div className="rounded-2xl gradient-brand-soft border border-white/10 p-6 mb-4 text-center">
                <div className="text-4xl mb-3" aria-hidden>🔍</div>
                <h2 className="text-xl font-bold gradient-text mb-2">P2P Arbitrage Scout</h2>
                <p className="text-xs text-white/60 mb-4">
                  {isFr ? (
                    "Trouve et profite des meilleures opportunités d'arbitrage crypto P2P. Achète bas, vends haut, empoches la différence."
                  ) : (
                    "Find and profit from the best P2P crypto arbitrage opportunities. Buy low, sell high, pocket the difference."
                  )}
                </p>
              </div>

              {/* How it works (user perspective) */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-3">{isFr ? "Comment ça marche" : "How it works"}</h3>
                <ol className="space-y-2 text-xs text-white/70">
                  <li className="flex gap-2"><strong className="text-[#00B5A3]">1.</strong> {isFr ? "Notre scanner détecte les opportunités en temps réel" : "Our scanner detects opportunities in real time"}</li>
                  <li className="flex gap-2"><strong className="text-[#00B5A3]">2.</strong> {isFr ? "Tu vois les opportunités verrouillées avec leur spread" : "You see locked opportunities with their spread"}</li>
                  <li className="flex gap-2"><strong className="text-[#00B5A3]">3.</strong> {isFr ? "Tu débloques les détails avec tes Telegram Stars" : "You unlock details with your Telegram Stars"}</li>
                  <li className="flex gap-2"><strong className="text-[#00B5A3]">4.</strong> {isFr ? "Tu suis le guide étape par étape pour profiter de l'opportunité" : "You follow the step-by-step guide to profit"}</li>
                </ol>
              </div>

              {/* Stars pricing */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-3">{isFr ? "💰 Tarification Stars" : "💰 Stars pricing"}</h3>
                <p className="text-[11px] text-white/50 mb-3">
                  {isFr ? "Le prix dépend du spread : plus l'opportunité est rentable, plus elle coûte en Stars." : "Price depends on spread: the more profitable, the more Stars."}
                </p>
                <div className="space-y-1.5 text-xs text-white/70">
                  <div className="flex justify-between"><span>1.5 - 2.0% spread</span><span className="text-[#F5A623] font-bold">⭐ 10</span></div>
                  <div className="flex justify-between"><span>2.0 - 2.5%</span><span className="text-[#F5A623] font-bold">⭐ 15</span></div>
                  <div className="flex justify-between"><span>2.5 - 3.0%</span><span className="text-[#F5A623] font-bold">⭐ 20</span></div>
                  <div className="flex justify-between"><span>3.0 - 3.5%</span><span className="text-[#F5A623] font-bold">⭐ 25</span></div>
                  <div className="flex justify-between"><span>3.5 - 4.0%</span><span className="text-[#F5A623] font-bold">⭐ 30</span></div>
                  <div className="flex justify-between"><span>≥ 10%</span><span className="text-[#F5A623] font-bold">⭐ 100 (max)</span></div>
                </div>
              </div>

              {/* Get Stars */}
              <div className="rounded-2xl bg-[#6C3FC7]/5 border border-[#6C3FC7]/30 p-4 mb-4">
                <h3 className="text-sm font-bold text-[#6C3FC7] mb-2">{isFr ? "⭐ Obtenir des Stars" : "⭐ Get Stars"}</h3>
                <p className="text-xs text-white/70 mb-2">
                  {isFr ? "Achète des Stars Telegram directement dans l'app Telegram :" : "Buy Telegram Stars directly in the Telegram app:"}
                </p>
                <ol className="space-y-1 text-xs text-white/60">
                  <li>1. {isFr ? "Ouvre Telegram → Settings → Telegram Stars" : "Open Telegram → Settings → Telegram Stars"}</li>
                  <li>2. {isFr ? "Choisis un pack (100 Stars ≈ 1.99$)" : "Pick a pack (100 Stars ≈ $1.99)"}</li>
                  <li>3. {isFr ? "Paie par carte, mobile money ou crypto" : "Pay by card, mobile money or crypto"}</li>
                </ol>
              </div>

              {/* Disclaimer */}
              <div className="rounded-2xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-4">
                <div className="text-[10px] uppercase tracking-wider text-[#F5A623] font-semibold mb-1">⚠ Disclaimer</div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {isFr ? (
                    "ℹ️ Information éducative, pas un conseil financier. Les prix P2P peuvent changer entre la détection et l'exécution. Ne misez jamais plus que vous ne pouvez vous permettre de perdre. Vérifiez toujours les prix avant d'agir."
                  ) : (
                    "ℹ️ Educational information, not financial advice. P2P prices may change between detection and execution. Never bet more than you can afford to lose. Always verify prices before acting."
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        language={language}
        unlocksCount={unlocks.length}
      />

      {/* Modals */}
      <UnlockModal
        opp={unlockOpp}
        language={language}
        isAlreadyUnlocked={unlockOpp ? unlockedIds.has(unlockOpp.id) : false}
        onClose={() => setUnlockOpp(null)}
        onUnlocked={handleUnlocked}
      />

      <OpportunityDetail
        opp={selectedOpp}
        onClose={() => setSelectedOpp(null)}
      />
    </div>
  );
}

// ── GuideStep component (used in Guide tab) ────────────────────
function GuideStep({ num, title, desc, color, isFr }: {
  num: number;
  title: string;
  desc: string;
  color: string;
  isFr: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex gap-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
        style={{ background: color }}
      >
        {num}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
