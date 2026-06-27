"use client";

import { AlertTriangle, Github, Send, Globe2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto relative border-t border-white/10 bg-[#0A1628]">
      <div className="absolute inset-0 bg-radial-glow opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Disclaimer banner */}
        <div className="rounded-2xl bg-[#F5A623]/5 border border-[#F5A623]/30 p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
            <div className="text-xs text-white/70 leading-relaxed">
              <strong className="text-[#F5A623]">ℹ️ Information éducative, pas un conseil financier.</strong>{" "}
              Les prix P2P peuvent changer entre la détection et votre exécution. Ne misez jamais plus
              que vous ne pouvez vous permettre de perdre. Vérifiez toujours les prix avant d&apos;agir.
              Ce système ne garantit aucun bénéfice et décline toute responsabilité en cas de perte.
            </div>
          </div>
        </div>

        {/* Brand + links */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔍</span>
              <span className="font-bold text-white">P2P Arbitrage Scout</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Système mondial de détection & publication d&apos;opportunités d&apos;arbitrage P2P.
              CDC v1.0 · Juin 2026 · Usage mondial.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-medium">Stack</div>
            <ul className="space-y-1 text-xs text-white/60">
              <li>· GitHub Actions (cron 5 min)</li>
              <li>· OpenRouter (10 LLMs round-robin)</li>
              <li>· Telegram Bot + 2 canaux (FR/EN)</li>
              <li>· GitHub Pages (Mini App HTTPS)</li>
              <li>· Coût: 1-5 $/mois</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-medium">Liens</div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#opportunities" className="text-white/60 hover:text-[#00B5A3] inline-flex items-center gap-1.5">
                  <Globe2 className="h-3 w-3" /> Opportunités actives
                </a>
              </li>
              <li>
                <a href="#seo" className="text-white/60 hover:text-[#00B5A3] inline-flex items-center gap-1.5">
                  <Send className="h-3 w-3" /> SEO Toolkit Telegram
                </a>
              </li>
              <li>
                <a href="#config" className="text-white/60 hover:text-[#00B5A3] inline-flex items-center gap-1.5">
                  <Github className="h-3 w-3" /> Guide de configuration
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-white/40">
            © 2026 P2P Arbitrage Scout · Conçu pour la communauté crypto francophone et mondiale
          </p>
          <p className="text-[10px] text-white/30">
            ⚠ Aucune plateforme n&apos;est partenaire. Spreads calculés nets de frais. Disclaimer obligatoire dans chaque message.
          </p>
        </div>
      </div>
    </footer>
  );
}
