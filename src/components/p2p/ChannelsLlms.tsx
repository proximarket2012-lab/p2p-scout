"use client";

import { motion } from "framer-motion";
import { Cpu, Radio, Send, Users } from "lucide-react";
import { type Channel, type LlmModel } from "@/lib/types";

interface ChannelsLlmsProps {
  channels: Channel[];
  llms: LlmModel[];
}

export function ChannelsLlms({ channels, llms }: ChannelsLlmsProps) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="h-5 w-5 text-[#00B5A3]" />
        <span className="text-xs uppercase tracking-wider text-[#00B5A3] font-medium">Infrastructure</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Canaux Telegram & LLMs en rotation
      </h2>
      <p className="text-white/60 mb-8 text-sm max-w-3xl">
        2 canaux (FR + EN) avec SEO optimisé, et 10 modèles LLM en round-robin pour éviter les rate limits.
      </p>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} />
        ))}
      </div>

      {/* LLMs rotation table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#6C3FC7]" />
            <h3 className="font-semibold text-white text-sm">Rotation des 10 LLMs (round-robin)</h3>
          </div>
          <span className="text-xs text-white/50">{llms.length} modèles actifs</span>
        </div>
        <div className="overflow-x-auto scrollbar-dark">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">#</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Modèle</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Fournisseur</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Points forts</th>
                <th className="text-left py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Langue</th>
                <th className="text-right py-2 px-3 text-white/50 font-medium uppercase tracking-wide">$/1K</th>
                <th className="text-right py-2 px-3 text-white/50 font-medium uppercase tracking-wide">Utilisé</th>
              </tr>
            </thead>
            <tbody>
              {llms.map((llm) => (
                <motion.tr
                  key={llm.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 px-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full gradient-success text-[10px] font-bold text-white">
                      {llm.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white font-medium font-mono">{llm.name}</td>
                  <td className="py-2.5 px-3 text-white/60">{llm.provider}</td>
                  <td className="py-2.5 px-3 text-white/60 max-w-[200px] truncate" title={llm.strengths}>{llm.strengths}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 text-[10px]">
                      {llm.languageFit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-white/70 font-mono">${llm.costPer1k.toFixed(5)}</td>
                  <td className="py-2.5 px-3 text-right text-white/50">{llm.useCount}×</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ChannelCard({ channel }: { channel: Channel }) {
  const flag = channel.language === "FR" ? "🇫🇷" : "🌍";
  const isFr = channel.language === "FR";
  const accentColor = isFr ? "#00B5A3" : "#6C3FC7";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-20" style={{ background: accentColor }} aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>{flag}</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Canal {channel.language}</div>
              <div className="font-bold text-white text-sm">{channel.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <Users className="h-3 w-3" /> abonnés
            </div>
            <div className="text-sm font-bold text-[#00C48C]">{channel.subscriberCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Description (SEO)</div>
            <p className="text-white/80 leading-relaxed">{channel.description}</p>
            <div className="text-[10px] text-white/40 mt-0.5">
              {channel.description.length} caractères / 150 recommandés
              {channel.description.length <= 150 ? (
                <span className="text-[#00C48C] ml-1">✓</span>
              ) : (
                <span className="text-[#F5A623] ml-1">⚠ dépasse</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Hashtags</div>
            <div className="flex flex-wrap gap-1">
              {channel.hashtags.split(" ").map((h) => (
                <span key={h} className="px-1.5 py-0.5 rounded bg-[#6C3FC7]/15 text-[#00B5A3] text-[10px] font-medium">{h}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Send className="h-3 w-3 text-white/40" />
            <span className="text-[10px] text-white/50">Bot admin: {channel.botUsername}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
