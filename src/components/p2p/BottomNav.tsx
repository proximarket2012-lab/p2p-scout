"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Unlock, BookOpen, Info } from "lucide-react";

export type TabId = "opportunities" | "unlocks" | "guide" | "info";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  language: "fr" | "en";
  unlocksCount: number;
}

const TABS: { id: TabId; icon: typeof LayoutGrid; fr: string; en: string }[] = [
  { id: "opportunities", icon: LayoutGrid, fr: "Opportunités", en: "Opportunities" },
  { id: "unlocks", icon: Unlock, fr: "Mes déblocages", en: "My unlocks" },
  { id: "guide", icon: BookOpen, fr: "Guide", en: "Guide" },
  { id: "info", icon: Info, fr: "Info", en: "Info" },
];

export function BottomNav({ active, onChange, language, unlocksCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto max-w-2xl px-3 py-2">
        <div className="grid grid-cols-4 gap-1.5">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            const label = language === "fr" ? tab.fr : tab.en;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-colors"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl gradient-brand-soft border border-[#6C3FC7]/30"
                    transition={{ type: "spring", damping: 22, stiffness: 320 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative z-10"
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? "text-[#00B5A3]" : "text-white/40"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {tab.id === "unlocks" && unlocksCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#6C3FC7] text-white text-[9px] font-bold flex items-center justify-center">
                        {unlocksCount > 99 ? "99+" : unlocksCount}
                      </span>
                    )}
                  </div>
                </motion.div>
                <span
                  className={`relative z-10 text-[10px] font-medium transition-colors ${
                    isActive ? "text-[#00B5A3]" : "text-white/40"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
