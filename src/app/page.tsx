"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type Opportunity,
  type Stats,
  type Platform,
  type Channel,
  type LlmModel,
  apiGetStats,
  apiGetOpportunitiesFeed,
  apiGetPlatforms,
  apiGetLlms,
  apiGetUserUnlocks,
  apiGetSeoGuide,
  apiGetConfigGuide,
  timeAgo,
} from "@/lib/types";
import { toast } from "sonner";
import { BottomNav, type TabId } from "@/components/p2p/BottomNav";
import { IntroBanner } from "@/components/p2p/IntroBanner";
import { LockedOpportunityCard } from "@/components/p2p/LockedOpportunityCard";
import { UnlockModal } from "@/components/p2p/UnlockModal";
import { OpportunityDetail } from "@/components/p2p/OpportunityDetail";
import { ChannelsLlms } from "@/components/p2p/ChannelsLlms";
import { SeoToolkitSection } from "@/components/p2p/SeoToolkit";
import { ConfigGuideSection } from "@/components/p2p/ConfigGuide";
import { Footer } from "@/components/p2p/Footer";
import { Activity, Star, Unlock, Globe2, Loader2, Sparkles } from "lucide-react";

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
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [llms, setLlms] = useState<LlmModel[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("opportunities");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [unlockOpp, setUnlockOpp] = useState<Opportunity | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"fr" | "en">("fr");

  const loadAll = useCallback(async () => {
    try {
      const [s, f, p, l] = await Promise.all([
        apiGetStats(),
        apiGetOpportunitiesFeed({ status: "ACTIVE", limit: "50" }),
        apiGetPlatforms(),
        apiGetLlms(),
      ]);
      setStats(s);
      setFeed(f.opportunities);
      setPlatforms(p.platforms);
      setLlms(l.llms);
      setChannels(s.channels);
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

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const r = await res.json();
      if (r.ok) {
        toast.success(
          language === "fr"
            ? `Scan terminé en ${(r.durationMs / 1000).toFixed(1)}s — ${r.opportunitiesCreated} opportunité${r.opportunitiesCreated !== 1 ? "s" : ""} créée${r.opportunitiesCreated !== 1 ? "s" : ""}`
            : `Scan done in ${(r.durationMs / 1000).toFixed(1)}s — ${r.opportunitiesCreated} new opportunit${r.opportunitiesCreated !== 1 ? "ies" : "y"}`,
          { duration: 5000 }
        );
        await loadAll();
      } else {
        toast.error(r.error || (language === "fr" ? "Échec du scan" : "Scan failed"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan error");
    } finally {
      setScanning(false);
    }
  };

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
            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-success text-white text-xs font-semibold shadow-glow disabled:opacity-50"
            >
              {scanning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              {isFr ? "Scanner" : "Scan"}
            </button>
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
                  <p className="text-xs text-white/40">{isFr ? "Ouvre la Mini App depuis @P2PScoutBot" : "Open the Mini App from @P2PScoutBot"}</p>
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

          {/* TAB 3: GUIDE */}
          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SeoToolkitSection />
              <ConfigGuideSection />
              <ChannelsLlms channels={channels} llms={llms} />
            </motion.div>
          )}

          {/* TAB 4: INFO */}
          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl gradient-brand-soft border border-white/10 p-6 mb-4 text-center">
                <div className="text-4xl mb-3" aria-hidden>🔍</div>
                <h2 className="text-xl font-bold gradient-text mb-2">P2P Arbitrage Scout</h2>
                <p className="text-xs text-white/60 mb-4">
                  {isFr ? (
                    "Système mondial de détection d'opportunités d'arbitrage P2P sur 8 plateformes. Signaux FR+EN publiés sur Telegram en moins de 60 secondes."
                  ) : (
                    "Global system detecting P2P arbitrage opportunities across 8 platforms. FR+EN signals published on Telegram in under 60 seconds."
                  )}
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><div className="text-lg font-bold text-[#00C48C]">8</div><div className="text-[9px] text-white/40 uppercase">{isFr ? "Plateformes" : "Platforms"}</div></div>
                  <div><div className="text-lg font-bold text-[#00B5A3]">10</div><div className="text-[9px] text-white/40 uppercase">LLMs</div></div>
                  <div><div className="text-lg font-bold text-[#6C3FC7]">2</div><div className="text-[9px] text-white/40 uppercase">{isFr ? "Canaux" : "Channels"}</div></div>
                  <div><div className="text-lg font-bold text-[#F5A623]">24/7</div><div className="text-[9px] text-white/40 uppercase">{isFr ? "Auto" : "Auto"}</div></div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-2">{isFr ? "Comment ça marche" : "How it works"}</h3>
                <ol className="space-y-2 text-xs text-white/70">
                  <li><strong className="text-[#00B5A3]">1.</strong> {isFr ? "Le scanner détecte les opportunités (spread ≥ 1,5% net) toutes les 5 min" : "Scanner detects opportunities (spread ≥ 1.5% net) every 5 min"}</li>
                  <li><strong className="text-[#00B5A3]">2.</strong> {isFr ? "Le LLM rédige le guide en FR+EN (10 modèles gratuits en rotation)" : "LLM writes the guide in FR+EN (10 free models in rotation)"}</li>
                  <li><strong className="text-[#00B5A3]">3.</strong> {isFr ? "Tu vois les opportunités verrouillées dans l'app" : "You see locked opportunities in the app"}</li>
                  <li><strong className="text-[#00B5A3]">4.</strong> {isFr ? "Tu paies en Telegram Stars pour débloquer les détails" : "Pay with Telegram Stars to unlock details"}</li>
                  <li><strong className="text-[#00B5A3]">5.</strong> {isFr ? "Tu exécutes l'arbitrage en suivant le guide étape par étape" : "Execute the arbitrage following the step-by-step guide"}</li>
                </ol>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-2">{isFr ? "Tarification Stars" : "Stars pricing"}</h3>
                <div className="space-y-1.5 text-xs text-white/70">
                  <div className="flex justify-between"><span>1.5 - 2.0%</span><span className="text-[#F5A623] font-bold">⭐ 10</span></div>
                  <div className="flex justify-between"><span>2.0 - 2.5%</span><span className="text-[#F5A623] font-bold">⭐ 15</span></div>
                  <div className="flex justify-between"><span>2.5 - 3.0%</span><span className="text-[#F5A623] font-bold">⭐ 20</span></div>
                  <div className="flex justify-between"><span>3.0 - 3.5%</span><span className="text-[#F5A623] font-bold">⭐ 25</span></div>
                  <div className="flex justify-between"><span>3.5 - 4.0%</span><span className="text-[#F5A623] font-bold">⭐ 30</span></div>
                  <div className="flex justify-between"><span>≥ 10%</span><span className="text-[#F5A623] font-bold">⭐ 100 (max)</span></div>
                </div>
              </div>

              <div className="rounded-xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-3 mb-4">
                <div className="text-[10px] uppercase tracking-wider text-[#F5A623] font-semibold mb-1">⚠ Disclaimer</div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {isFr ? (
                    "ℹ️ Information éducative, pas un conseil financier. Les prix P2P peuvent changer entre la détection et l'exécution. Ne misez jamais plus que vous ne pouvez vous permettre de perdre."
                  ) : (
                    "ℹ️ Educational information, not financial advice. P2P prices may change between detection and execution. Never bet more than you can afford to lose."
                  )}
                </p>
              </div>

              {stats.lastScan && (
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-xs text-white/50">
                  <div className="flex justify-between"><span>{isFr ? "Dernier scan" : "Last scan"}</span><span>{timeAgo(stats.lastScan.createdAt)}</span></div>
                  <div className="flex justify-between"><span>{isFr ? "Statut" : "Status"}</span><span className="text-[#00C48C]">{stats.lastScan.status}</span></div>
                  <div className="flex justify-between"><span>{isFr ? "Opportunités trouvées" : "Found"}</span><span>{stats.lastScan.opportunitiesFound}</span></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

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
