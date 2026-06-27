"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, CheckCircle2, ChevronRight, Clock, Code2, Copy, Lightbulb,
  ListChecks, Rocket, Wrench,
} from "lucide-react";
import { type ConfigGuide } from "@/lib/types";
import { apiGetConfigGuide } from "@/lib/types";
import { toast } from "sonner";

export function ConfigGuideSection() {
  const [guide, setGuide] = useState<ConfigGuide | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiGetConfigGuide().then(setGuide).catch(() => toast.error("Failed to load config guide"));
  }, []);

  if (!guide) {
    return <div className="text-center py-20 text-white/40">Chargement du guide de configuration...</div>;
  }

  const step = guide.steps.find((s) => s.id === activeStep);
  const phase = guide.phases.find((p) => p.id === step?.phaseId);

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section id="config" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-5 w-5 text-[#6C3FC7]" />
        <span className="text-xs uppercase tracking-wider text-[#6C3FC7] font-medium">Guide pas-à-pas</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Configuration complète du système
      </h2>
      <p className="text-white/60 mb-8 text-sm max-w-3xl">
        11 étapes détaillées pour mettre en production P2P Arbitrage Scout — de la création du bot Telegram
        au déploiement de la Mini App. Chaque étape inclut commandes, code YAML et conseils pratiques.
      </p>

      {/* Phases overview */}
      <div className="rounded-2xl bg-gradient-to-r from-[#6C3FC7]/10 to-[#00B5A3]/10 border border-white/10 p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-4 w-4 text-[#F5A623]" />
          <h3 className="font-semibold text-white text-sm">Plan d&apos;implémentation — 6 phases</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {guide.phases.map((p) => (
            <div key={p.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-success text-[10px] font-bold text-white">
                  {p.id}
                </span>
                <span className="text-xs font-semibold text-white">{p.title.split("—")[1]?.trim() || p.title}</span>
              </div>
              <div className="text-[10px] text-white/50 mb-2">{p.objective}</div>
              <div className="flex flex-wrap gap-1">
                {p.tasks.slice(0, 3).map((t, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/60">{t.length > 30 ? t.slice(0, 28) + "…" : t}</span>
                ))}
                {p.tasks.length > 3 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">+{p.tasks.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps navigation */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 mb-6 overflow-x-auto scrollbar-dark">
        <div className="flex gap-2 min-w-max">
          {guide.steps.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                activeStep === s.id
                  ? "gradient-success text-white border-transparent shadow-glow"
                  : "bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/10"
              }`}
            >
              <span className="opacity-60 mr-1.5">{s.id}.</span>
              {s.title.length > 32 ? s.title.slice(0, 30) + "…" : s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Active step content */}
      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-success text-white font-bold">
                    {step.id}
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#00B5A3]">
                      {phase?.title}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{step.title}</h3>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/60">
                  <Clock className="h-3 w-3" /> {step.duration}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
                    step.difficulty === "Débutant"
                      ? "bg-[#00C48C]/15 text-[#00C48C]"
                      : step.difficulty === "Intermédiaire"
                      ? "bg-[#F5A623]/15 text-[#F5A623]"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  <Wrench className="h-3 w-3" /> {step.difficulty}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/70 mb-5 leading-relaxed">{step.description}</p>

            {/* Instructions */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-[#00B5A3]" />
                <h4 className="font-semibold text-white text-sm">Instructions pas-à-pas</h4>
              </div>
              <ol className="space-y-2">
                {step.instructions.map((ins, i) => {
                  const key = `${step.id}-${i}`;
                  const isChecked = checked.has(key);
                  return (
                    <li key={i}>
                      <button
                        onClick={() => toggleCheck(key)}
                        className="flex items-start gap-3 w-full text-left p-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border shrink-0 mt-0.5 transition-all ${
                            isChecked ? "bg-[#00C48C] border-[#00C48C]" : "border-white/20 group-hover:border-white/40"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </span>
                        <span className={`text-xs leading-relaxed ${isChecked ? "text-white/40 line-through" : "text-white/85"}`}>
                          <span className="text-white/40 mr-1.5">{i + 1}.</span>
                          {ins.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Code block */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#6C3FC7]" />
                  <h4 className="font-semibold text-white text-sm">{step.code.title}</h4>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(step.code.content); toast.success("Code copié"); }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Copy className="h-3 w-3" /> Copier
                </button>
              </div>
              <div className="relative rounded-xl bg-[#0A1628] border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-8 bg-white/[0.02] border-b border-white/5 flex items-center px-3 gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F5A623]/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00C48C]/60" />
                  <span className="ml-2 text-[10px] text-white/40 font-mono">{step.code.language}</span>
                </div>
                <pre className="pt-10 p-4 overflow-x-auto scrollbar-dark text-[11px] leading-relaxed font-mono text-white/85">
                  <code>{step.code.content}</code>
                </pre>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-3 flex gap-3">
              <Lightbulb className="h-4 w-4 text-[#F5A623] shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#F5A623] font-semibold mb-1">Astuce pro</div>
                <p className="text-xs text-white/75 leading-relaxed">{step.tip}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => setActiveStep(Math.max(1, step.id - 1))}
                disabled={step.id === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Étape précédente
              </button>
              <span className="text-xs text-white/40">Étape {step.id} / {guide.steps.length}</span>
              <button
                onClick={() => setActiveStep(Math.min(guide.steps.length, step.id + 1))}
                disabled={step.id === guide.steps.length}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#00B5A3] hover:bg-[#00B5A3]/10 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                Étape suivante <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final checklist */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#00C48C]/10 to-[#00B5A3]/10 border border-[#00C48C]/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-[#00C48C]" />
          <h3 className="font-bold text-white text-base">Checklist finale — mise en production</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {guide.finalChecklist.map((item, i) => {
            const key = `final-${i}`;
            const isChecked = checked.has(key);
            return (
              <button
                key={i}
                onClick={() => toggleCheck(key)}
                className="flex items-start gap-2 text-left p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 mt-0.5 transition-all ${
                    isChecked ? "bg-[#00C48C] border-[#00C48C]" : "border-white/20"
                  }`}
                >
                  {isChecked && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                </span>
                <span className={`text-xs ${isChecked ? "text-white/40 line-through" : "text-white/85"}`}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <div className="text-xs text-white/60">
            {checked.size} / {guide.finalChecklist.length + guide.steps.reduce((acc, s) => acc + s.instructions.length, 0)} étapes cochées
          </div>
        </div>
      </div>
    </section>
  );
}
