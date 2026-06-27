# 🔍 P2P Arbitrage Scout

Système mondial de détection & publication d'opportunités d'arbitrage P2P sur 8 plateformes, avec signaux Telegram FR + EN générés par LLM (10 modèles gratuits OpenRouter en rotation).

![Status](https://img.shields.io/badge/status-production%20ready-00C48C) ![Cost](https://img.shields.io/badge/cost-0$/mois-00B5A3) ![License](https://img.shields.io/badge/license-MIT-6C3FC7)

## ✨ Fonctionnalités

- **8 plateformes P2P surveillées** : Binance, Bybit, OKX, HTX, KuCoin, MEXC, Noones, Bitget
- **10 paires de trading** sans risque (USDT/XAF, NGN, GHS, EUR, USD, KES, INR, BRL, PHP + BTC/USDT)
- **10 LLMs gratuits OpenRouter** en rotation round-robin (Nemotron 550B, Hermes 405B, GPT-OSS 120B, Qwen3 80B, Gemma 4 ×2, GPT-OSS 20B, Laguna ×2, LFM 1.2B)
- **2 canaux Telegram** (FR + EN) avec SEO optimisé (descriptions ≤ 150 caractères)
- **Pipeline auto-publish** : détection → LLM rédige FR + EN → publication en < 60 secondes
- **Mini App Next.js 16** : dashboard, explorer, calculateur de gain, SEO toolkit, guide de config
- **Cron bypass** pour Vercel Hobby (1 cron/jour) via 4 méthodes externes gratuites

## 🏗️ Stack technique

| Composant | Technologie | Coût |
|-----------|-------------|------|
| Framework | Next.js 16 + TypeScript | 0 $ |
| UI | Tailwind CSS 4 + shadcn/ui | 0 $ |
| DB | Prisma + SQLite (dev) / Neon Postgres (prod) | 0 $ |
| LLM | OpenRouter (10 modèles free) | 0 $ |
| Hébergement | Vercel Hobby + GitHub Pages | 0 $ |
| Bot | Telegram Bot API | 0 $ |
| **Total** | | **0 $/mois** |

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
bun install

# 2. Configurer l'environnement
cp .env.example .env
# Édite .env avec tes clés (ou laisse DATABASE_URL SQLite pour dev local)

# 3. Initialiser la base de données
bun run db:push
bun run scripts/seed.ts

# 4. Lancer le serveur de dev
bun run dev
# → http://localhost:3000
```

## 📖 Documentation

- **Guide PDF complet** : [`download/guide-personnalise.pdf`](download/guide-personnalise.pdf) (15 pages, tous les détails de configuration)
- **Guide de config interactif** : accessible dans la Mini App → section "Guide pas-à-pas"
- **SEO Toolkit** : accessible dans la Mini App → section "SEO Toolkit Telegram"

## 🤖 Pipeline automatique

```
Scan (toutes les 5 min via cron externe)
  → Détection opportunités (spread ≥ 1.5% net)
  → LLM round-robin rédige FR + EN (10 modèles gratuits)
  → Publication sur 2 canaux Telegram
  → Log + déduplication 30 min
```

**Idempotence** : verrou distribué (ScanLock) + debounce 2 min → safe pour crons externes multiples.

## 🔐 Sécurité

- Tous les secrets dans Vercel Environment Variables (chiffrement AES-256)
- Endpoint `/api/scan/trigger` protégé par `CRON_API_KEY` (optionnel)
- Aucun secret dans le code source
- Disclaimer obligatoire dans chaque message publié

## ⚠️ Avertissement

ℹ️ Information éducative, pas un conseil financier. Les prix P2P peuvent changer entre la détection et l'exécution. Ne misez jamais plus que vous ne pouvez vous permettre de perdre. Vérifiez toujours les prix avant d'agir.

## 📄 Licence

MIT — Utilise librement, modifie, partage.

---

Conçu pour la communauté crypto francophone et mondiale · CDC v1.0 · Juin 2026
