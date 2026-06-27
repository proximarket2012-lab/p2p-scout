"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  type Opportunity, type Stats, type Platform, type LlmModel, type Channel,
  apiGetStats, apiGetOpportunities, apiGetPlatforms, apiGetLlms, apiScan, timeAgo,
} from "@/lib/types";
import { toast } from "sonner";
import { Hero } from "@/components/p2p/Hero";
import { Dashboard } from "@/components/p2p/Dashboard";
import { Explorer } from "@/components/p2p/Explorer";
import { OpportunityDetail } from "@/components/p2p/OpportunityDetail";
import { ChannelsLlms } from "@/components/p2p/ChannelsLlms";
import { SeoToolkitSection } from "@/components/p2p/SeoToolkit";
import { ConfigGuideSection } from "@/components/p2p/ConfigGuide";
import { Footer } from "@/components/p2p/Footer";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [llms, setLlms] = useState<LlmModel[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [s, o, p, l] = await Promise.all([
        apiGetStats(),
        apiGetOpportunities({ status: "ACTIVE", limit: "50" }),
        apiGetPlatforms(),
        apiGetLlms(),
      ]);
      setStats(s);
      setOpportunities(o.opportunities);
      setPlatforms(p.platforms);
      setLlms(l.llms);
      setChannels(s.channels);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 60s (CDC § 6.4 — Mini App refresh auto)
    const interval = setInterval(loadAll, 60_000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const r = await apiScan();
      if (r.ok) {
        toast.success(
          `Scan terminé en ${(r.durationMs / 1000).toFixed(1)}s — ${r.opportunitiesCreated} opportunité${r.opportunitiesCreated !== 1 ? "s" : ""} créée${r.opportunitiesCreated !== 1 ? "s" : ""}${r.platformsFailed > 0 ? ` · ${r.platformsFailed} API${r.platformsFailed !== 1 ? "s" : ""} en panne` : ""}`,
          { duration: 5000 }
        );
        await loadAll();
      } else {
        toast.error("Échec du scan");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan error");
    } finally {
      setScanning(false);
    }
  };

  const handlePublished = useCallback(async (id: string) => {
    // Refresh data after publishing
    await loadAll();
    // Remove from active list since it's now PUBLISHED
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }, [loadAll]);

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
            Initialisation du scanner...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A1628]">
      <Hero
        activeCount={stats.opportunities.active}
        bestSpread={stats.bestSpread}
        platforms={platforms.length}
        lastScanAgo={stats.lastScan ? timeAgo(stats.lastScan.createdAt) : "jamais"}
        scannerActive={stats.scannerActive}
        onScan={handleScan}
        scanning={scanning}
      />

      <main className="flex-1">
        {/* Live alert banner if there are issues */}
        {stats.lastScan && stats.lastScan.platformsFailed > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-[#F5A623] shrink-0" />
              <p className="text-xs text-white/70">
                <strong className="text-[#F5A623]">{stats.lastScan.platformsFailed} API{stats.lastScan.platformsFailed !== 1 ? "s" : ""} en panne</strong> lors du dernier scan.
                Le système continue sans elle(s) — une alerte admin a été envoyée.
              </p>
            </div>
          </div>
        )}

        {stats.opportunities.active > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-xl bg-[#00C48C]/5 border border-[#00C48C]/30 p-3 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-[#00C48C] shrink-0" />
              <p className="text-xs text-white/70">
                <strong className="text-[#00C48C]">{stats.opportunities.active} opportunité{stats.opportunities.active !== 1 ? "s" : ""} active{stats.opportunities.active !== 1 ? "s" : ""}</strong> détectée{stats.opportunities.active !== 1 ? "s" : ""} ·
                Meilleur spread net: <strong className="text-[#00B5A3]">+{stats.bestSpread.toFixed(2)}%</strong>
              </p>
            </div>
          </div>
        )}

        <Dashboard stats={stats} />

        <Explorer opportunities={opportunities} stats={stats} onSelect={setSelectedOpp} />

        <ChannelsLlms channels={channels} llms={llms} />

        <SeoToolkitSection />

        <ConfigGuideSection />
      </main>

      <Footer />

      <OpportunityDetail
        opp={selectedOpp}
        onClose={() => setSelectedOpp(null)}
        onPublished={handlePublished}
      />
    </div>
  );
}
