"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { type Opportunity, type Stats, regionEmoji } from "@/lib/types";
import { OpportunityCard } from "./OpportunityCard";

interface ExplorerProps {
  opportunities: Opportunity[];
  stats: Stats | null;
  onSelect: (opp: Opportunity) => void;
}

type StatusFilter = "ACTIVE" | "PUBLISHED" | "EXPIRED" | "ALL";

export function Explorer({ opportunities, stats, onSelect }: ExplorerProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [pairFilter, setPairFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [minSpread, setMinSpread] = useState(0);
  const [search, setSearch] = useState("");

  const pairs = useMemo(() => {
    const set = new Set(opportunities.map((o) => o.pair));
    return ["ALL", ...Array.from(set).sort()];
  }, [opportunities]);

  const regions = useMemo(() => {
    const set = new Set(opportunities.map((o) => o.region));
    return ["ALL", ...Array.from(set).sort()];
  }, [opportunities]);

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (pairFilter !== "ALL" && o.pair !== pairFilter) return false;
      if (regionFilter !== "ALL" && o.region !== regionFilter) return false;
      if (o.spreadNet < minSpread) return false;
      if (search) {
        const s = search.toLowerCase();
        const hit =
          o.pair.toLowerCase().includes(s) ||
          o.buyPlatform.toLowerCase().includes(s) ||
          o.sellPlatform.toLowerCase().includes(s) ||
          o.buyMerchant.toLowerCase().includes(s) ||
          o.sellMerchant.toLowerCase().includes(s) ||
          o.fiat.toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
    });
  }, [opportunities, statusFilter, pairFilter, regionFilter, minSpread, search]);

  const statusOptions: { value: StatusFilter; label: string; color: string; count: number }[] = [
    { value: "ACTIVE", label: "Actives", color: "#00C48C", count: stats?.opportunities.active ?? 0 },
    { value: "PUBLISHED", label: "Publiées", color: "#00B5A3", count: stats?.opportunities.published ?? 0 },
    { value: "EXPIRED", label: "Expirées", color: "#6b7280", count: stats?.opportunities.expired ?? 0 },
    { value: "ALL", label: "Toutes", color: "#6C3FC7", count: stats?.opportunities.total ?? 0 },
  ];

  return (
    <section id="opportunities" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-5 w-5 text-[#00B5A3]" />
        <span className="text-xs uppercase tracking-wider text-[#00B5A3] font-medium">Explorer</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Opportunités d&apos;arbitrage
      </h2>
      <p className="text-white/60 mb-6 text-sm">
        Filtre par statut, paire, région ou spread minimum. Clique sur une carte pour voir le guide complet.
      </p>

      {/* Filters */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 space-y-4">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === opt.value
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/5 text-white/50 hover:text-white hover:border-white/10"
              }`}
              style={statusFilter === opt.value ? { borderColor: `${opt.color}50`, color: opt.color } : undefined}
            >
              {opt.label}
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: `${opt.color}25`, color: opt.color }}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + selects */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher paire, plateforme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#00B5A3]"
            />
          </div>
          <SelectFilter
            label="Paire"
            value={pairFilter}
            options={pairs}
            onChange={setPairFilter}
          />
          <SelectFilter
            label="Région"
            value={regionFilter}
            options={regions.map((r) => ({ value: r, label: r === "ALL" ? "Toutes" : `${regionEmoji(r)} ${r}` }))}
            onChange={setRegionFilter}
          />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1 block">
              Spread min: {minSpread.toFixed(1)}%
            </label>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3 w-3 text-white/40" />
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minSpread}
                onChange={(e) => setMinSpread(Number(e.target.value))}
                className="flex-1 accent-[#00B5A3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-white/50">
          <span className="text-white font-semibold">{filtered.length}</span> opportunité{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-12 text-center">
          <div className="text-4xl mb-3" aria-hidden>🔍</div>
          <p className="text-white/60 text-sm">Aucune opportunité ne correspond à ces filtres.</p>
          <p className="text-white/40 text-xs mt-1">Lance un scan ou change tes critères.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp, i) => (
            <OpportunityCard key={opp.id} opp={opp} onSelect={onSelect} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function SelectFilter({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00B5A3]"
      >
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? (opt === "ALL" ? "Toutes" : opt) : opt.label;
          return <option key={v} value={v} className="bg-[#0A1628] text-white">{l}</option>;
        })}
      </select>
    </div>
  );
}
