"use client";

import { motion } from "framer-motion";
import { Activity, BarChart3, Globe2, TrendingUp, Zap, Clock, Server, Cpu } from "lucide-react";
import { type Stats, regionEmoji, timeAgo } from "@/lib/types";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Area, AreaChart,
} from "recharts";

interface DashboardProps {
  stats: Stats;
}

export function Dashboard({ stats }: DashboardProps) {
  const lastScan = stats.lastScan;
  const historyData = stats.history7d.map((h) => ({
    date: new Date(h.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
    opportunities: h.count,
    published: h.published,
    avgSpread: h.avgSpread,
  }));

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-5 w-5 text-[#00C48C]" />
        <span className="text-xs uppercase tracking-wider text-[#00C48C] font-medium">Tableau de bord</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Vue d&apos;ensemble du système
      </h2>
      <p className="text-white/60 mb-6 text-sm">
        Statut temps réel du scanner, historique 7 jours et performance par paire/région.
      </p>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <KpiCard
          icon={<Zap className="h-4 w-4" />}
          label="Actives maintenant"
          value={stats.opportunities.active}
          color="#00C48C"
          sub={`sur ${stats.opportunities.total} total`}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Spread moyen"
          value={`${stats.avgSpreadActive.toFixed(2)}%`}
          color="#00B5A3"
          sub={`meilleur: +${stats.bestSpread.toFixed(2)}%`}
        />
        <KpiCard
          icon={<Globe2 className="h-4 w-4" />}
          label="Plateformes OK"
          value={`${stats.counts.platforms - (lastScan?.platformsFailed ?? 0)}/${stats.counts.platforms}`}
          color="#6C3FC7"
          sub={`${lastScan?.platformsFailed ?? 0} en panne`}
        />
        <KpiCard
          icon={<Cpu className="h-4 w-4" />}
          label="LLMs en rotation"
          value={stats.counts.llms}
          color="#F5A623"
          sub="round-robin"
        />
      </div>

      {/* Last scan + scan history */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {/* Last scan card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-[#00B5A3]" />
            <h3 className="font-semibold text-white text-sm">Dernier scan</h3>
          </div>
          {lastScan ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Statut</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color: lastScan.status === "SUCCESS" ? "#00C48C" : lastScan.status === "PARTIAL" ? "#F5A623" : "#ef4444",
                    background: `${lastScan.status === "SUCCESS" ? "#00C48C" : lastScan.status === "PARTIAL" ? "#F5A623" : "#ef4444"}15`,
                  }}
                >
                  {lastScan.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Durée</span>
                <span className="text-white font-medium">{(lastScan.durationMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Plateformes checkées</span>
                <span className="text-white font-medium">{lastScan.platformsChecked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Opportunités trouvées</span>
                <span className="text-[#00C48C] font-medium">{lastScan.opportunitiesFound}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Publiées</span>
                <span className="text-[#00B5A3] font-medium">{lastScan.opportunitiesPublished}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-white/50">Il y a</span>
                <span className="text-white/80 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(lastScan.createdAt)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/40">Aucun scan enregistré.</p>
          )}
        </div>

        {/* Scan history bar chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[#6C3FC7]" />
            <h3 className="font-semibold text-white text-sm">Derniers scans (opportunités trouvées)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scanLogs.slice(0, 24).reverse().map((l, i) => ({
                name: `-${24 - i}`,
                found: l.opportunitiesFound,
                published: l.opportunitiesPublished,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip
                  contentStyle={{
                    background: "#0A1628",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Bar dataKey="found" fill="#6C3FC7" radius={[3, 3, 0, 0]} name="Trouvées" />
                <Bar dataKey="published" fill="#00B5A3" radius={[3, 3, 0, 0]} name="Publiées" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7-day history area chart */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-[#00C48C]" />
          <h3 className="font-semibold text-white text-sm">Historique 7 jours — opportunités détectées</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorOpps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C3FC7" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6C3FC7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B5A3" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#00B5A3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip
                contentStyle={{ background: "#0A1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              />
              <Area type="monotone" dataKey="opportunities" stroke="#6C3FC7" strokeWidth={2} fill="url(#colorOpps)" name="Détectées" />
              <Area type="monotone" dataKey="published" stroke="#00B5A3" strokeWidth={2} fill="url(#colorPub)" name="Publiées" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution by pair + region */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Distribution par paire (actives)</h3>
          <div className="space-y-2">
            {stats.byPair.length === 0 && <p className="text-xs text-white/40">Aucune opportunité active.</p>}
            {stats.byPair.map((p) => {
              const max = Math.max(...stats.byPair.map((x) => x.count), 1);
              return (
                <div key={p.pair} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-white/70 font-medium shrink-0">{p.pair}</div>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.count / max) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full gradient-success"
                    />
                  </div>
                  <div className="text-xs text-white/60 w-12 text-right">{p.count}</div>
                  <div className="text-xs text-[#00C48C] w-12 text-right">+{p.maxSpread.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Distribution par région (actives)</h3>
          <div className="space-y-2">
            {stats.byRegion.length === 0 && <p className="text-xs text-white/40">Aucune opportunité active.</p>}
            {stats.byRegion.map((r) => {
              const max = Math.max(...stats.byRegion.map((x) => x.count), 1);
              return (
                <div key={r.region} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-white/70 font-medium shrink-0 inline-flex items-center gap-1">
                    <span>{regionEmoji(r.region)}</span>
                    {r.region}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.count / max) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #00B5A3, #00C48C)" }}
                    />
                  </div>
                  <div className="text-xs text-white/60 w-10 text-right">{r.count}</div>
                  <div className="text-xs text-[#00C48C] w-14 text-right">+{r.avgSpread.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 5 last 7 days */}
      {stats.top7d.length > 0 && (
        <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-[#F5A623]" />
            <h3 className="font-semibold text-white text-sm">Top 5 — meilleures opportunités (7 derniers jours)</h3>
          </div>
          <div className="space-y-2">
            {stats.top7d.map((opp, i) => (
              <div key={opp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ background: i === 0 ? "#F5A623" : i === 1 ? "#6C3FC7" : "#00B5A3" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{opp.pair} · {opp.buyPlatform} → {opp.sellPlatform}</div>
                  <div className="text-[10px] text-white/40">{new Date(opp.detectedAt).toLocaleDateString("fr-FR")}</div>
                </div>
                <div className="text-sm font-bold text-[#00C48C]">+{opp.spreadNet.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function KpiCard({
  icon, label, value, color, sub,
}: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-4 shadow-card"
    >
      <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl opacity-30" style={{ background: color }} aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">{label}</span>
        </div>
        <div className="text-xl sm:text-2xl font-bold" style={{ color }}>{value}</div>
        {sub && <div className="text-[10px] text-white/40 mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}
