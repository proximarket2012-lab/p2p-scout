"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Hash, Search, MessageSquare, Pin, Copy, CheckCircle2, AlertTriangle, Sparkles,
} from "lucide-react";
import { type SeoToolkit } from "@/lib/types";
import { apiGetSeoGuide } from "@/lib/types";
import { toast } from "sonner";

export function SeoToolkitSection() {
  const [toolkit, setToolkit] = useState<SeoToolkit | null>(null);

  useEffect(() => {
    apiGetSeoGuide().then((d) => setToolkit(d)).catch(() => toast.error("Failed to load SEO toolkit"));
  }, []);

  if (!toolkit) {
    return <div className="text-center py-20 text-white/40">Chargement du SEO toolkit...</div>;
  }

  return (
    <section id="seo" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-5 w-5 text-[#00B5A3]" />
        <span className="text-xs uppercase tracking-wider text-[#00B5A3] font-medium">SEO Telegram</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        SEO Toolkit — Telegram
      </h2>
      <p className="text-white/60 mb-8 text-sm max-w-3xl">
        Le SEO Telegram repose sur la recherche par mots-clés dans les noms de canaux,
        les descriptions et les messages épinglés. Voici tous les templates prêts à copier,
        avec compteurs de caractères en temps réel pour respecter les limites.
      </p>

      {/* Limits banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#6C3FC7]/10 to-[#00B5A3]/10 border border-white/10 p-5 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LimitCard label="Nom du canal" hard={toolkit.limits.channelName.hard} recommended={toolkit.limits.channelName.recommended} />
          <LimitCard label="Description" hard={toolkit.limits.channelDescription.hard} recommended={toolkit.limits.channelDescription.recommended} highlight />
          <LimitCard label="Message épinglé" hard={toolkit.limits.pinnedMessage.hard} recommended={toolkit.limits.pinnedMessage.recommended} />
          <LimitCard label="Mots par message" hard={toolkit.limits.messageWords.max} recommended={toolkit.limits.messageWords.min} suffix="mots" />
        </div>
      </div>

      {/* Channel templates */}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {toolkit.channelTemplates.map((tpl) => (
          <ChannelTemplateCard key={tpl.language} tpl={tpl} limits={toolkit.limits} />
        ))}
      </div>

      {/* SEO Rules table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-[#6C3FC7]" />
          <h3 className="font-semibold text-white text-sm">Règles SEO Telegram (CDC § 5.3)</h3>
        </div>
        <div className="overflow-x-auto scrollbar-dark">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Élément SEO</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Règle</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Impact</th>
              </tr>
            </thead>
            <tbody>
              {toolkit.rules.map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-white/80 font-medium whitespace-nowrap">{r.element}</td>
                  <td className="py-2.5 px-3 text-white/60">{r.rule}</td>
                  <td className="py-2.5 px-3 text-[#00B5A3] whitespace-nowrap">{r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hashtag library */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(["FR", "EN"] as const).map((lang) => (
          <div key={lang} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-4 w-4 text-[#00B5A3]" />
              <h3 className="font-semibold text-white text-sm">
                Bibliothèque hashtags {lang === "FR" ? "🇫🇷" : "🌍"}
              </h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Primaires (max 5/message)</div>
                <div className="flex flex-wrap gap-1.5">
                  {toolkit.hashtagLibrary[lang].primary.map((h) => (
                    <HashtagChip key={h} tag={h} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Par devise fiat</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(toolkit.hashtagLibrary[lang].byFiat).map(([fiat, h]) => (
                    <HashtagChip key={fiat} tag={h} label={`${fiat}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Secondaires (rotation)</div>
                <div className="flex flex-wrap gap-1.5">
                  {toolkit.hashtagLibrary[lang].secondary.map((h) => (
                    <HashtagChip key={h} tag={h} variant="secondary" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message structure */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(["FR", "EN"] as const).map((lang) => (
          <div key={lang} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-[#00C48C]" />
              <h3 className="font-semibold text-white text-sm">
                Structure du message {lang === "FR" ? "🇫🇷" : "🌍"}
              </h3>
            </div>
            <ol className="space-y-2">
              {toolkit.messageStructure[lang].map((s, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[10px] text-white/60 font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-white/90 font-medium">{s.section}</div>
                    <div className="text-white/40 text-[10px]">{s.constraint}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[#F5A623]" />
          <h3 className="font-semibold text-white text-sm">Disclaimer obligatoire (inséré automatiquement)</h3>
        </div>
        <div className="space-y-3">
          <DisclaimerBlock lang="FR" text={toolkit.disclaimer.FR} />
          <DisclaimerBlock lang="EN" text={toolkit.disclaimer.EN} />
        </div>
      </div>
    </section>
  );
}

function LimitCard({
  label, hard, recommended, suffix = "car.", highlight,
}: { label: string; hard: number; recommended: number; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "bg-[#00B5A3]/10 border-[#00B5A3]/30" : "bg-white/[0.02] border-white/10"}`}>
      <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-lg font-bold ${highlight ? "text-[#00B5A3]" : "text-white"}`}>{recommended}</span>
        <span className="text-[10px] text-white/40">recommandé</span>
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">limite dure: {hard} {suffix}</div>
      {highlight && (
        <div className="text-[10px] text-[#00B5A3] mt-1 font-medium">★ Focus CDC</div>
      )}
    </div>
  );
}

function ChannelTemplateCard({
  tpl, limits,
}: { tpl: SeoToolkit["channelTemplates"][number]; limits: SeoToolkit["limits"] }) {
  const [name, setName] = useState(tpl.name);
  const [desc, setDesc] = useState(tpl.description);
  const [pinned, setPinned] = useState(tpl.pinnedMessage);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success("Copié !");
    setTimeout(() => setCopied(null), 1500);
  };

  const nameOk = name.length <= limits.channelName.recommended;
  const nameHard = name.length <= limits.channelName.hard;
  const descOk = desc.length <= limits.channelDescription.recommended;
  const descHard = desc.length <= limits.channelDescription.hard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/[0.03] border border-white/10 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tpl.language === "FR" ? "🇫🇷" : "🌍"}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">Canal {tpl.language}</h3>
            <div className="text-[10px] text-white/40">Mots-clés: {tpl.primaryKeywords.join(", ")}</div>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center justify-between">
          <span>Nom du canal</span>
          <CharCounter current={name.length} recommended={limits.channelName.recommended} hard={limits.channelName.hard} ok={nameOk} hardOk={nameHard} />
        </label>
        <textarea
          value={name}
          onChange={(e) => setName(e.target.value)}
          rows={1}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-[#00B5A3]"
        />
      </div>

      {/* Description — the SEO-critical one (≤ 150) */}
      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center justify-between">
          <span className="inline-flex items-center gap-1">
            <span>Description</span>
            <span className="text-[#00B5A3]">★ SEO critique</span>
          </span>
          <CharCounter current={desc.length} recommended={limits.channelDescription.recommended} hard={limits.channelDescription.hard} ok={descOk} hardOk={descHard} />
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none ${
            descOk ? "border-[#00B5A3]/40 focus:border-[#00B5A3]" : descHard ? "border-[#F5A623]/40 focus:border-[#F5A623]" : "border-red-500/40 focus:border-red-500"
          }`}
        />
      </div>

      {/* Pinned */}
      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center justify-between">
          <span className="inline-flex items-center gap-1"><Pin className="h-3 w-3" /> Message épinglé</span>
          <CharCounter current={pinned.length} recommended={limits.pinnedMessage.recommended} hard={limits.pinnedMessage.hard} ok={pinned.length <= limits.pinnedMessage.recommended} hardOk={pinned.length <= limits.pinnedMessage.hard} />
        </label>
        <textarea
          value={pinned}
          onChange={(e) => setPinned(e.target.value)}
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/80 resize-y font-mono focus:outline-none focus:border-[#00B5A3] scrollbar-dark"
        />
      </div>

      {/* Hashtags */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Hashtags du canal</div>
        <div className="flex flex-wrap gap-1.5">
          {tpl.hashtags.split(" ").map((h) => (
            <span key={h} className="px-2 py-0.5 rounded-md bg-[#6C3FC7]/15 text-[#00B5A3] text-[10px] font-medium">{h}</span>
          ))}
        </div>
      </div>

      {/* Copy buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <CopyButton label="Nom" copied={copied === "name"} onClick={() => copy("name", name)} />
        <CopyButton label="Description" copied={copied === "desc"} onClick={() => copy("desc", desc)} />
        <CopyButton label="Message épinglé" copied={copied === "pinned"} onClick={() => copy("pinned", pinned)} />
        <CopyButton label="Tout" copied={copied === "all"} onClick={() => copy("all", `NOM: ${name}\n\nDESCRIPTION: ${desc}\n\nÉPINGLÉ:\n${pinned}\n\nHASHTAGS: ${tpl.hashtags}`)} />
      </div>
    </motion.div>
  );
}

function CharCounter({
  current, recommended, hard, ok, hardOk,
}: { current: number; recommended: number; hard: number; ok: boolean; hardOk: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span className={ok ? "text-[#00C48C]" : hardOk ? "text-[#F5A623]" : "text-red-400"}>
        {current}
      </span>
      <span className="text-white/30">/ {recommended}</span>
      <span className="text-white/20">({hard} max)</span>
      {ok ? (
        <CheckCircle2 className="h-3 w-3 text-[#00C48C]" />
      ) : hardOk ? (
        <AlertTriangle className="h-3 w-3 text-[#F5A623]" />
      ) : (
        <AlertTriangle className="h-3 w-3 text-red-400" />
      )}
    </span>
  );
}

function HashtagChip({ tag, label, variant = "primary" }: { tag: string; label?: string; variant?: "primary" | "secondary" }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(tag); toast.success(`${tag} copié`); }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
        variant === "primary"
          ? "bg-[#00B5A3]/15 text-[#00B5A3] hover:bg-[#00B5A3]/25"
          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
      }`}
      title={label ? `Pour ${label}` : "Cliquer pour copier"}
    >
      {tag}
    </button>
  );
}

function DisclaimerBlock({ lang, text }: { lang: "FR" | "EN"; text: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wide text-white/40 font-medium">{lang === "FR" ? "🇫🇷 Français" : "🌍 English"}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(text); toast.success("Disclaimer copié"); }}
          className="inline-flex items-center gap-1 text-[10px] text-white/60 hover:text-white"
        >
          <Copy className="h-3 w-3" /> Copier
        </button>
      </div>
      <p className="text-[11px] text-white/70 leading-relaxed">{text}</p>
    </div>
  );
}

function CopyButton({ label, copied, onClick }: { label: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
        copied ? "bg-[#00C48C]/20 text-[#00C48C]" : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {label}
    </button>
  );
}
