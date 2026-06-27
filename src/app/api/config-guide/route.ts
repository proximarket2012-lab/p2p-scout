import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Step-by-step configuration guide (CDC § 9 — Plan d'implémentation)
// Each step is detailed with code snippets, commands, copy-paste templates.
// ─────────────────────────────────────────────────────────────

const CONFIG_GUIDE = {
  phases: [
    {
      id: 1,
      title: "Phase 1 — Fondations (2-3 jours)",
      objective: "Repo GitHub prêt + Canaux Telegram actifs + Bot créé",
      tasks: [
        "Créer le repository GitHub (privé recommandé)",
        "Configurer les GitHub Secrets",
        "Créer le bot Telegram via @BotFather",
        "Créer les 2 canaux Telegram (FR + EN)",
        "Tester les 8 APIs P2P manuellement",
      ],
    },
    {
      id: 2,
      title: "Phase 2 — Scanner (3-4 jours)",
      objective: "Scanner fonctionnel en local",
      tasks: [
        "Écrire fetch_prices.py pour les 8 APIs",
        "Implémenter calculate_spreads.py (spread net)",
        "Implémenter filter.py (seuil 1,5%)",
        "Tester les données en local",
      ],
    },
    {
      id: 3,
      title: "Phase 3 — LLM + Publisher (2-3 jours)",
      objective: "Premiers messages publiés sur Telegram",
      tasks: [
        "Créer un compte OpenRouter + clé API",
        "Écrire les prompts système FR/EN",
        "Tester la rotation des 10 LLMs",
        "Écrire publish_telegram.py",
      ],
    },
    {
      id: 4,
      title: "Phase 4 — GitHub Actions (1-2 jours)",
      objective: "Système tournant en production 24/7",
      tasks: [
        "Créer scanner.yml avec cron 5 min",
        "Créer daily_report.yml (rapport quotidien 8h UTC)",
        "Créer health_check.yml (toutes les 2h)",
        "Tester 3 cycles complets",
      ],
    },
    {
      id: 5,
      title: "Phase 5 — Mini App (4-5 jours)",
      objective: "Mini App accessible sur Telegram",
      tasks: [
        "Design HTML/CSS/JS mobile-first",
        "Intégration telegram-web-app.js",
        "Lecture JSON GitHub Raw",
        "Déploiement GitHub Pages",
      ],
    },
    {
      id: 6,
      title: "Phase 6 — Optimisation (2-3 jours)",
      objective: "Système optimisé et calibré",
      tasks: [
        "Affiner les seuils de spread",
        "Tester le SEO Telegram",
        "Optimiser les prompts LLM",
        "A/B test FR vs EN",
      ],
    },
  ],

  steps: [
    // ── STEP 1: BotFather ────────────────────────────────────
    {
      id: 1,
      phaseId: 1,
      title: "Créer le Bot Telegram via @BotFather",
      duration: "5 minutes",
      difficulty: "Débutant",
      description: "Le Bot Telegram sera l'administrateur des 2 canaux et publiera les messages automatiquement. Tu le crées une seule fois via le BotFather officiel de Telegram.",
      instructions: [
        { text: "Ouvre Telegram et cherche @BotFather (compte vérifié avec ✅)" },
        { text: "Envoie la commande /newbot" },
        { text: "BotFather te demande un nom. Choisis : P2P Scout Bot" },
        { text: "BotFather te demande un username (doit finir par \"bot\"). Choisis : P2PScoutBot" },
        { text: "BotFather te renvoie un token API au format 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ. COPIE-LE immédiatement." },
        { text: "Stocke ce token dans GitHub Secrets sous le nom TELEGRAM_BOT_TOKEN" },
      ],
      code: {
        language: "bash",
        title: "Tester le bot en ligne de commande",
        content: `# Test rapide que le bot répond
curl "https://api.telegram.org/bot<TON_TOKEN>/getMe"

# Réponse attendue :
# {"ok":true,"result":{"id":123456789,"is_bot":true,"first_name":"P2P Scout Bot","username":"P2PScoutBot"}}`,
      },
      tip: "Ne partage JAMAIS ce token. Si tu le fuites, reset-le immédiatement via /revoke dans BotFather.",
    },

    // ── STEP 2: Channels creation ────────────────────────────
    {
      id: 2,
      phaseId: 1,
      title: "Créer les 2 canaux Telegram (FR + EN)",
      duration: "10 minutes",
      difficulty: "Débutant",
      description: "Crée 2 canaux publics (Pas de groupes !) — un en français, un en anglais. Le nom et la description doivent être SEO-optimisés : Telegram indexe ces champs dans sa recherche interne. La description a une limite dure de 255 caractères mais le CDC recommande 150 maximum pour rester punchy et bien indexé.",
      instructions: [
        { text: "Dans Telegram → menu → Nouveau Canal" },
        { text: "Choisis \"Canal public\" (obligatoire pour la découvrabilité SEO)" },
        { text: "Nom du canal FR : Arbitrage P2P — Signaux Gratuits 🇫🇷" },
        { text: "Description FR (max 150 car) : Opportunités d'arbitrage crypto P2P en temps réel, expliquées simplement. Aucune expertise requise." },
        { text: "Répète pour le canal EN : P2P Arbitrage — Free Signals 🌍" },
        { text: "Description EN : Real-time P2P crypto arbitrage opportunities, explained simply. No expertise needed." },
        { text: "Ajoute le bot (@P2PScoutBot) comme admin des 2 canaux avec droits de publication" },
        { text: "Récupère le chat_id de chaque canal via @userinfobot" },
      ],
      code: {
        language: "bash",
        title: "Récupérer le chat_id d'un canal public",
        content: `# Remplace @ton_canal par le username public du canal
curl "https://api.telegram.org/bot<TON_TOKEN>/getChat?chat_id=@ArbitrageP2P_FR"

# Réponse :
# {"ok":true,"result":{"id":-1001234567890,"title":"Arbitrage P2P — Signaux Gratuits 🇫🇷",...}}

# Le chat_id est -1001234567890 (négatif !). Stocke-le dans GitHub Secrets :
#   TELEGRAM_CHANNEL_FR_ID = -1001234567890
#   TELEGRAM_CHANNEL_EN_ID = -1001234567891`,
      },
      tip: "Garde la description ≤ 150 caractères. Telegram tronque au-delà dans la preview de recherche, et un texte court = meilleur taux de clic.",
    },

    // ── STEP 3: OpenRouter ───────────────────────────────────
    {
      id: 3,
      phaseId: 3,
      title: "Créer un compte OpenRouter + clé API",
      duration: "5 minutes",
      difficulty: "Débutant",
      description: "OpenRouter donne accès à 10 modèles LLM via une seule clé API. Coût estimé : 1-5$/mois pour ~50 appels/jour. Le tier gratuit permet même 0$ les premiers mois.",
      instructions: [
        { text: "Va sur https://openrouter.ai/keys" },
        { text: "Crée un compte (Google/GitHub login)" },
        { text: "Clique sur \"Create Key\"" },
        { text: "Donne un nom : p2p-scout-production" },
        { text: "Copie la clé au format sk-or-v1-xxxxx..." },
        { text: "Ajoute 5$ de crédits (carte ou crypto) — optionnel les premiers mois" },
        { text: "Stocke la clé dans GitHub Secrets sous OPENROUTER_API_KEY" },
      ],
      code: {
        language: "bash",
        title: "Tester la clé OpenRouter",
        content: `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -d '{
    "model": "anthropic/claude-haiku-4-5",
    "messages": [{"role":"user","content":"Dis bonjour en 3 mots"}]
  }'`,
      },
      tip: "OpenRouter applique un rate limit de 20 req/min en gratuit. La rotation des 10 LLMs le contourne naturellement.",
    },

    // ── STEP 4: GitHub Secrets ───────────────────────────────
    {
      id: 4,
      phaseId: 1,
      title: "Configurer les GitHub Secrets",
      duration: "10 minutes",
      difficulty: "Débutant",
      description: "Tous les secrets (tokens Telegram, clé OpenRouter) doivent être stockés dans GitHub Secrets — jamais dans le code source. Chiffrement AES-256 natif, aucune fuite possible dans les logs.",
      instructions: [
        { text: "Va sur ton repo GitHub → Settings → Secrets and variables → Actions" },
        { text: "Clique sur \"New repository secret\"" },
        { text: "Ajoute les 4 secrets ci-dessous (un par un)" },
      ],
      code: {
        language: "yaml",
        title: "Liste des secrets à créer",
        content: `# Secrets obligatoires (4) :
TELEGRAM_BOT_TOKEN         = 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHANNEL_FR_ID     = -1001234567890
TELEGRAM_CHANNEL_EN_ID     = -1001234567891
OPENROUTER_API_KEY         = sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

# Secrets optionnels (alertes) :
ADMIN_TELEGRAM_ID          = 987654321  # ton ID personnel pour alerts`,
      },
      tip: "Rotation recommandée des tokens tous les 90 jours pour la sécurité.",
    },

    // ── STEP 5: GitHub Actions scanner.yml ───────────────────
    {
      id: 5,
      phaseId: 4,
      title: "Déployer le workflow scanner.yml (cron 5 min)",
      duration: "20 minutes",
      difficulty: "Intermédiaire",
      description: "Le workflow scanner.yml est le cœur du système. Il s'exécute toutes les 5 minutes via GitHub Actions cron, appelle les 8 APIs en parallèle, calcule les spreads, filtre > 1,5%, génère les messages via LLM, publie sur Telegram.",
      instructions: [
        { text: "Crée le fichier .github/workflows/scanner.yml dans ton repo" },
        { text: "Colle le code YAML ci-dessous" },
        { text: "Commit + push sur main" },
        { text: "Vérifie dans l'onglet Actions que le workflow se déclenche" },
        { text: "Force un premier run manuel via \"Run workflow\"" },
      ],
      code: {
        language: "yaml",
        title: ".github/workflows/scanner.yml",
        content: `name: P2P Scanner
on:
  schedule:
    - cron: "*/5 * * * *"   # toutes les 5 minutes
  workflow_dispatch:         # déclenchement manuel

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install deps
        run: pip install httpx python-telegram-bot openai

      - name: Run scanner
        env:
          OPENROUTER_API_KEY: \${{ secrets.OPENROUTER_API_KEY }}
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_FR_ID: \${{ secrets.TELEGRAM_CHANNEL_FR_ID }}
          TELEGRAM_CHANNEL_EN_ID: \${{ secrets.TELEGRAM_CHANNEL_EN_ID }}
        run: python src/main.py`,
      },
      tip: "GitHub Free = 2000 min/mois. À 3 min/run × 288 runs/jour × 30 jours = 25 920 min ❌ Dépassement. Solution : cron \"*/15 * * * *\" = 8 640 min/mois ✅ OU passe au plan Pro.",
    },

    // ── STEP 6: daily_report.yml ─────────────────────────────
    {
      id: 6,
      phaseId: 4,
      title: "Déployer le workflow daily_report.yml (rapport 8h UTC)",
      duration: "10 minutes",
      difficulty: "Intermédiaire",
      description: "Chaque matin à 8h00 UTC, ce workflow génère un résumé des meilleures opportunités de la veille et le publie sur les 2 canaux. Excellent pour la rétention (les abonnés ont une raison de revenir chaque matin).",
      instructions: [
        { text: "Crée le fichier .github/workflows/daily_report.yml" },
        { text: "Colle le code ci-dessous" },
        { text: "Commit + push" },
      ],
      code: {
        language: "yaml",
        title: ".github/workflows/daily_report.yml",
        content: `name: Daily Report
on:
  schedule:
    - cron: "0 8 * * *"   # 8h00 UTC chaque jour
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install httpx python-telegram-bot openai
      - name: Generate daily report
        env:
          OPENROUTER_API_KEY: \${{ secrets.OPENROUTER_API_KEY }}
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_FR_ID: \${{ secrets.TELEGRAM_CHANNEL_FR_ID }}
          TELEGRAM_CHANNEL_EN_ID: \${{ secrets.TELEGRAM_CHANNEL_EN_ID }}
        run: python src/daily_report.py`,
      },
      tip: "8h00 UTC = 9h00 Paris / 10h00 Douala / 11h00 Lagos. Parfait pour toucher l'Afrique au réveil.",
    },

    // ── STEP 7: health_check.yml ─────────────────────────────
    {
      id: 7,
      phaseId: 4,
      title: "Déployer le workflow health_check.yml (toutes les 2h)",
      duration: "10 minutes",
      difficulty: "Intermédiaire",
      description: "Vérifie que toutes les APIs sont accessibles et que les tokens Telegram sont valides. Envoie une alerte à l'admin si > 2 APIs sont down ou si le token Telegram est invalide.",
      instructions: [
        { text: "Crée le fichier .github/workflows/health_check.yml" },
        { text: "Colle le code ci-dessous" },
        { text: "Commit + push" },
      ],
      code: {
        language: "yaml",
        title: ".github/workflows/health_check.yml",
        content: `name: Health Check
on:
  schedule:
    - cron: "0 */2 * * *"   # toutes les 2 heures
  workflow_dispatch:

jobs:
  health:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install httpx python-telegram-bot
      - name: Check APIs + tokens
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          ADMIN_TELEGRAM_ID: \${{ secrets.ADMIN_TELEGRAM_ID }}
        run: python src/health_check.py`,
      },
      tip: "Si tu reçois une alerte à 3h du matin, ne panique pas : les APIs P2P ont parfois des maintenances nocturnes. Vérifie le canal @BinanceAPI sur Telegram pour les statuts.",
    },

    // ── STEP 8: GitHub Pages Mini App ────────────────────────
    {
      id: 8,
      phaseId: 5,
      title: "Déployer la Mini App sur GitHub Pages",
      duration: "15 minutes",
      difficulty: "Intermédiaire",
      description: "GitHub Pages héberge gratuitement la Mini App avec HTTPS automatique (requis par Telegram). URL finale : https://USERNAME.github.io/p2p-scout-app",
      instructions: [
        { text: "Va sur ton repo → Settings → Pages" },
        { text: "Source : GitHub Actions" },
        { text: "Crée .github/workflows/deploy_miniapp.yml (voir code)" },
        { text: "Commit + push" },
        { text: "Patiente 2-3 min pour le déploiement" },
        { text: "Vérifie l'URL : https://USERNAME.github.io/p2p-scout-app" },
        { text: "Configure le bouton Mini App via @BotFather → /newapp" },
      ],
      code: {
        language: "yaml",
        title: ".github/workflows/deploy_miniapp.yml",
        content: `name: Deploy Mini App
on:
  push:
    branches: [main]
    paths: ["miniapp/**"]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./miniapp
      - uses: actions/deploy-pages@v4`,
      },
      tip: "Telegram exige HTTPS pour les Mini Apps. GitHub Pages fournit HTTPS automatiquement — parfait.",
    },

    // ── STEP 9: BotFather /newapp ────────────────────────────
    {
      id: 9,
      phaseId: 5,
      title: "Configurer le bouton Mini App dans Telegram",
      duration: "5 minutes",
      difficulty: "Débutant",
      description: "Une fois la Mini App déployée, configure le bouton qui apparaît dans le menu du bot. Les utilisateurs pourront ouvrir la Mini App sans quitter Telegram.",
      instructions: [
        { text: "Ouvre @BotFather dans Telegram" },
        { text: "Envoie /newapp" },
        { text: "Sélectionne @P2PScoutBot" },
        { text: "Titre : P2P Arbitrage Scout" },
        { text: "Description : Mini App pour explorer les opportunités d'arbitrage P2P en temps réel" },
        { text: "Image : upload une capture d'écran 640x360" },
        { text: "URL : https://USERNAME.github.io/p2p-scout-app" },
        { text: "Nom court : p2pscout (sans espaces)" },
      ],
      code: {
        language: "text",
        title: "Vérification",
        content: `Une fois configuré, va sur ton bot @P2PScoutBot dans Telegram.
Tu verras un bouton "Open App" en bas.
Clique dessus → la Mini App s'ouvre dans Telegram.`,
      },
      tip: "L'image 640x360 doit peser < 100KB pour un chargement instantané.",
    },

    // ── STEP 10: Test APIs ───────────────────────────────────
    {
      id: 10,
      phaseId: 1,
      title: "Tester manuellement les 8 APIs P2P",
      duration: "20 minutes",
      difficulty: "Intermédiaire",
      description: "Avant d'automatiser, vérifie que chaque API répond correctement et renvoie le format attendu. Certaines APIs changent leurs endpoints sans préavis — ce test te permet de détecter les cassures tôt.",
      instructions: [
        { text: "Ouvre un terminal" },
        { text: "Lance chaque commande curl ci-dessous (une par plateforme)" },
        { text: "Vérifie que chaque réponse contient un tableau d'annonces avec prix" },
        { text: "Note les latences (devraient être < 3s)" },
      ],
      code: {
        language: "bash",
        title: "Tests des 8 endpoints P2P",
        content: `# 1. Binance P2P (USDT/XAF, BUY)
curl -X POST 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search' \\
  -H 'Content-Type: application/json' \\
  -d '{"asset":"USDT","fiat":"XAF","tradeType":"BUY","page":1,"rows":5}'

# 2. Bybit P2P
curl -X POST 'https://api2.bybit.com/fiat/otc/item/online' \\
  -H 'Content-Type: application/json' \\
  -d '{"tokenId":"USDT","currencyId":"XAF","side":"1"}'

# 3. OKX P2P
curl 'https://www.okx.com/v3/c2c/tradingOrders/books?quoteCurrency=XAF&baseCurrency=USDT&side=buy'

# 4. HTX / Huobi
curl 'https://otc-api.huobi.pro/v1/otc/trade/ad/list?coinId=2&tradeType=0&currentPage=1&payMethod=0&country=37'

# 5. KuCoin P2P
curl 'https://www.kucoin.com/_api/otc/ads/list?currency=USDT&side=BUY&legal=XAF'

# 6. MEXC P2P
curl -X POST 'https://otc.mexc.com/api/otc/item/queryList' \\
  -H 'Content-Type: application/json' \\
  -d '{"currency":"USDT","legal":"XAF","side":"BUY","page":1}'

# 7. Noones
curl 'https://noones.com/p2p-trading/list-all-trades?currency=USDT&payment_method=XAF'

# 8. Bitget P2P
curl 'https://www.bitget.com/v1/p2p/merchantList?coinId=USDT&currency=XAF&side=buy'`,
      },
      tip: "Si une API retourne 403/429, c'est du rate-limiting. Ajoute un User-Agent header réaliste et espace les requêtes.",
    },

    // ── STEP 11: Cost monitoring ─────────────────────────────
    {
      id: 11,
      phaseId: 6,
      title: "Surveiller le coût OpenRouter mensuel",
      duration: "5 minutes",
      difficulty: "Débutant",
      description: "Avec 50 appels/jour × 30 jours = 1500 appels/mois × ~300 tokens = 450K tokens/mois. À ~0.0002$/1K tokens = ~0.09$/mois en moyenne. Très bas. Mais les spikes peuvent arriver en cas de forte volatilité.",
      instructions: [
        { text: "Va sur https://openrouter.ai/activity" },
        { text: "Vérifie le total mensuel" },
        { text: "Configure une alerte à 10$ via le dashboard OpenRouter" },
        { text: "Si coût > 10$/mois, augmente le buffer de sécurité à 0.4% pour réduire le volume" },
      ],
      code: {
        language: "text",
        title: "Coût total estimé du projet",
        content: `GitHub Actions (Free)        : 0 $/mois  (2000 min/mois)
OpenRouter LLM              : 1-5 $/mois (~50 appels/jour)
GitHub Pages (Mini App)     : 0 $/mois
Telegram (Bot + Canaux)     : 0 $/mois
Domaine personnalisé (opt.) : 10-12 $/an

──────────────────────────────────────
TOTAL                       : 1-5 $/mois

Avec tier gratuit OpenRouter : 0 $ les premiers mois`,
      },
      tip: "Si tu dépasses le quota GitHub Free (2000 min/mois), passe le cron à \"*/15\" au lieu de \"*/5\". Tu feras 4× moins de runs.",
    },

    // ── STEP 12: Vercel + Neon migration ─────────────────────
    {
      id: 12,
      phaseId: 4,
      title: "Migrer vers Vercel Hobby + Neon Postgres",
      duration: "20 minutes",
      difficulty: "Intermédiaire",
      description: "Vercel Hobby (gratuit) héberge l'app Next.js avec HTTPS automatique et déploiement Git. Neon Postgres (free tier : 0.5 GB, 100 heures de compute/mois) remplace SQLite pour la production. Le code Prisma est déjà DB-agnostic — seule la connection string change.",
      instructions: [
        { text: "Crée un compte sur https://neon.tech (login GitHub)" },
        { text: "Crée un projet Neon : p2p-arbitrage-scout, region Frankfurt (proche Afrique/Europe)" },
        { text: "Copie la connection string pooler (format postgresql://...-pooler...)" },
        { text: "Va sur https://vercel.com → New Project → importe ton repo GitHub" },
        { text: "Framework preset : Next.js (auto-détecté)" },
        { text: "Ajoute les variables d'environnement (voir bloc code)" },
        { text: "Deploy → attend 2-3 min → ton app est live sur https://ton-app.vercel.app" },
        { text: "Test : curl https://ton-app.vercel.app/api/stats → doit renvoyer du JSON" },
      ],
      code: {
        language: "bash",
        title: "Variables d'environnement Vercel (Settings → Environment Variables)",
        content: `# Base de données Neon Postgres (POOLER pour serverless !)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=15"

# Direct connection (pour les migrations Prisma — sans -pooler)
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# LLM (z-ai-web-dev-sdk — déjà configuré)
ZAI_API_KEY="..."

# Telegram (production)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHANNEL_FR_ID="-100..."
TELEGRAM_CHANNEL_EN_ID="-100..."

# Sécurité endpoint trigger (OPTIONNEL mais recommandé)
CRON_API_KEY="genere-une-cle-aleatoire-32-caracteres"

# Une fois déployé, lance la migration Prisma :
npx prisma migrate deploy
# ou (si pas de migrations) :
npx prisma db push`,
      },
      tip: "IMPORTANTE : utilise la connection POOLER (-pooler dans le hostname) pour DATABASE_URL. Vercel = serverless = nombreuses connexions courtes. Sans pooling, tu épuises les connexions Neon (max 100 sur free tier).",
    },

    // ── STEP 13: Prisma schema for Postgres ──────────────────
    {
      id: 13,
      phaseId: 4,
      title: "Adapter prisma/schema.prisma pour Neon Postgres",
      duration: "5 minutes",
      difficulty: "Débutant",
      description: "Le schema Prisma actuel utilise SQLite (provider = \"sqlite\"). Pour Neon en production, change le provider vers postgresql. Prisma gère la traduction des types automatiquement (Int → INTEGER, Float → DOUBLE PRECISION, DateTime → TIMESTAMP, etc.).",
      instructions: [
        { text: "Édite prisma/schema.prisma" },
        { text: "Change datasource.db.provider de \"sqlite\" à \"postgresql\"" },
        { text: "Ajoute directUrl = env(\"DIRECT_URL\") pour les migrations" },
        { text: "Commit + push → Vercel rebuild automatiquement" },
        { text: "Lance prisma db push (ou migrate deploy) contre Neon" },
      ],
      code: {
        language: "prisma",
        title: "prisma/schema.prisma — datasource pour Neon",
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"           // ← était "sqlite"
  url       = env("DATABASE_URL")    // pooler connection
  directUrl = env("DIRECT_URL")      // direct connection (migrations)
}

// Tous les models restent IDENTIQUES.
// Prisma traduit automatiquement :
//   String   → TEXT
//   Int      → INTEGER
//   Float    → DOUBLE PRECISION
//   Boolean  → BOOLEAN
//   DateTime → TIMESTAMP(3)
//   @id      → PRIMARY KEY
//   @unique  → UNIQUE constraint
//   @@index  → CREATE INDEX

// Pour switcher entre dev (SQLite) et prod (Postgres) sans toucher le code,
// utilise 2 fichiers .env :
//   .env          → DATABASE_URL="file:./dev.db"  + provider="sqlite"
//   .env.production → DATABASE_URL="postgresql://..."  + provider="postgresql"
// Et un script qui détecte NODE_ENV.`,
      },
      tip: "Pour garder SQLite en local ET Postgres en prod : mets `provider = \"sqlite\"` dans schema.prisma (local), et crée un `prisma/schema.prod.prisma` identique avec `provider = \"postgresql\"`. Lance `prisma db push --schema=prisma/schema.prod.prisma` dans le build Vercel.",
    },

    // ── STEP 14: Cron bypass — THE HACK ──────────────────────
    {
      id: 14,
      phaseId: 4,
      title: "Hack : bypass du cron unique Vercel Hobby via crons externes + verrou Neon",
      duration: "30 minutes",
      difficulty: "Avancé",
      description: "Vercel Hobby = 1 cron job max, fréquence quotidienne (1x/jour). Insuffisant pour scanner toutes les 5 min. Le hack : utiliser PLUSIEURS services de cron externes gratuits qui frappent /api/scan/trigger. L'endpoint est IDEMPOTENT grâce à un verrou distribué dans Neon (table ScanLock) + un debounce de 2 min. Résultat : scan effectif toutes les 1-5 min, gratuit, sans dépendre du cron Vercel.",
      instructions: [
        { text: "Vérifie que CRON_API_KEY est défini dans Vercel env vars" },
        { text: "Configure 3 services externes (voir bloc code — Method A/B/C)" },
        { text: "Test : curl -X POST https://ton-app.vercel.app/api/scan/trigger -H 'X-API-Key: ...'" },
        { text: "Vérifie les logs Vercel → tu dois voir des appels /api/scan/trigger toutes les 1-5 min" },
        { text: "Configure le cron Vercel (1/jour) UNIQUEMENT pour le rapport quotidien" },
      ],
      code: {
        language: "bash",
        title: "3 méthodes de cron externe (combine-les pour redondance)",
        content: `# ═══════════════════════════════════════════════════════════
# MÉTHODE A : UptimeRobot (gratuit, 5 min, 50 monitors)
# ═══════════════════════════════════════════════════════════
# 1. Va sur https://uptimerobot.com → Sign up
# 2. Add New Monitor → Monitor Type = "HTTP(s)"
# 3. Friendly Name : P2P Scout Scan
# 4. URL : https://ton-app.vercel.app/api/scan/trigger
# 5. (UptimeRobot ne supporte pas les headers custom en gratuit)
#    → Solution : ne PAS définir CRON_API_KEY (open access)
#    OU crée une URL proxy avec la clé en query : pas idéal.
# 6. Monitoring Interval : 5 minutes
# 7. UptimeRobot fait un GET → notre endpoint accepte GET (health check)
#    mais ne déclenche PAS de scan.
#    → Pour déclencher un scan via GET, crée /api/scan/trigger?run=1
#    qui appelle runScan() si ?run=1 est présent.

# ═══════════════════════════════════════════════════════════
# MÉTHODE B : cron-job.org (gratuit, 1 min, headers custom OK)
# ═══════════════════════════════════════════════════════════
# 1. Va sur https://cron-job.org → Sign up
# 2. Create Cronjob
# 3. Title : P2P Scout Scan 5min
# 4. URL : https://ton-app.vercel.app/api/scan/trigger
# 5. Execution : Every 5 minutes (*/5 * * * *)
# 6. Request Method : POST
# 7. Headers : X-API-Key: <ta-cle-CRON_API_KEY>
# 8. Save → le scan tourne toutes les 5 min, gratuit

# ═══════════════════════════════════════════════════════════
# MÉTHODE C : GitHub Actions (gratuit, 5 min, 2000 min/mois)
# ═══════════════════════════════════════════════════════════
# Crée .github/workflows/trigger_scan.yml dans ton repo :
---
name: Trigger P2P Scan
on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Hit Vercel endpoint
        run: |
          curl -X POST "\${{ secrets.VERCEL_APP_URL }}/api/scan/trigger" \\
            -H "X-API-Key: \${{ secrets.CRON_API_KEY }}" \\
            --max-time 90
---
# 2000 min/mois / 2 min par run = 1000 runs/mois = 33/jour = toutes les 44 min
# Pas assez. Solution : utilise cron-job.org EN PLUS de GitHub Actions.

# ═══════════════════════════════════════════════════════════
# MÉTHODE D : Upstash QStash (gratuit, 500 msgs/jour, le plus élégant)
# ═══════════════════════════════════════════════════════════
# QStash = queue serverless avec scheduling intégré.
# Free tier : 500 messages/jour = 1 message toutes les 3 min.
# 1. Va sur https://console.upstash.com → QStash
# 2. Copie QSTASH_URL et QSTASH_TOKEN
# 3. Crée un schedule :
curl https://qstash.upstash.io/v2/schedules \\
  -H "Authorization: Bearer $QSTASH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination": "https://ton-app.vercel.app/api/scan/trigger",
    "cron": "*/5 * * * *",
    "headers": {"X-API-Key": "'"$CRON_API_KEY"'"}
  }'
# QStash garantit la livraison (retry auto si 500),
# supporte les headers custom, et c'est GRATUIT jusqu'à 500 msg/jour.`,
      },
      tip: "Combine MÉTHODES B + C + D pour une redondance maximale. Même si un service tombe en panne, les autres continuent. L'idempotence (ScanLock + debounce) garantit qu'il n'y a JAMAIS de double scan, peu importe combien de triggers arrivent simultanément.",
    },

    // ── STEP 15: Vercel cron for daily report ────────────────
    {
      id: 15,
      phaseId: 4,
      title: "Configurer le cron Vercel (1/jour) pour le rapport quotidien",
      duration: "10 minutes",
      difficulty: "Débutant",
      description: "Vercel Hobby autorise 1 cron job quotidien. On l'utilise UNIQUEMENT pour le rapport quotidien (8h UTC) — pas pour le scanner (géré par les crons externes). Le cron Vercel appelle /api/daily-report qui génère le résumé et publie sur les 2 canaux Telegram.",
      instructions: [
        { text: "À la racine du projet, crée vercel.json" },
        { text: "Colle la config ci-dessous" },
        { text: "Commit + push → Vercel détecte et active le cron" },
        { text: "Vérifie dans Vercel dashboard → votre project → Cron Jobs" },
      ],
      code: {
        language: "json",
        title: "vercel.json — cron quotidien pour le rapport",
        content: `{
  "crons": [
    {
      "path": "/api/daily-report",
      "schedule": "0 8 * * *"
    }
  ]
}

// /api/daily-report/route.ts :
// - Récupère les opportunités des dernières 24h
// - Calcule le top 5 (meilleur spread)
// - Génère un résumé FR + EN via LLM
// - Publie sur les 2 canaux Telegram
// - Log le rapport
//
// Vercel vérifie automatiquement que ce cron tourne 1x/jour max
// (limite Hobby). Pas de souci de surcharge.`,
      },
      tip: "Vercel Hobby limite à 1 cron quotidien. Si tu veux 2 crons (rapport + health check), passe au plan Pro (20$/mois) OU utilise cron-job.org pour le 2ème. Le hack vise justement à éviter ça.",
    },

    // ── STEP 16: Auto-publish verification ───────────────────
    {
      id: 16,
      phaseId: 6,
      title: "Vérifier le pipeline auto-publish (scan → LLM → Telegram)",
      duration: "10 minutes",
      difficulty: "Intermédiaire",
      description: "Le système est maintenant conçu pour : à chaque scan, si une opportunité éligible (spread ≥ 1,5%) est détectée, le LLM disponible (round-robin sur 10 modèles) rédige automatiquement le message en FR + EN, et publie sur les 2 canaux Telegram. Aucune intervention manuelle. Vérifie que tout fonctionne.",
      instructions: [
        { text: "Déclenche un scan : curl -X POST https://ton-app.vercel.app/api/scan/trigger -H 'X-API-Key: ...'" },
        { text: "Vérifie la réponse JSON : opportunitiesPublished doit être > 0" },
        { text: "Vérifie le canal Telegram FR → un nouveau message doit être apparu" },
        { text: "Vérifie le canal Telegram EN → un nouveau message doit être apparu" },
        { text: "Les messages doivent contenir : titre accrocheur, étapes 1+2, calcul bénéfice, temps estimé, risque, disclaimer, hashtags" },
        { text: "Aucun terme technique dans les messages (test : demande à un non-crypto de lire)" },
      ],
      code: {
        language: "bash",
        title: "Test du pipeline complet",
        content: `# 1. Déclenche un scan
curl -X POST "https://ton-app.vercel.app/api/scan/trigger" \\
  -H "X-API-Key: $CRON_API_KEY" \\
  --max-time 60 | jq .

# Réponse attendue :
# {
#   "ok": true,
#   "success": true,
#   "platformsChecked": 8,
#   "opportunitiesCreated": 5,
#   "opportunitiesPublished": 3,        ← 3 messages publiés (top spread)
#   "opportunitiesSkippedDedup": 0,     ← 0 si pas de doublon récent
#   "publishedOpportunities": [
#     { "id": "...", "pair": "USDT/XAF", "spreadNet": 4.2, "llmModel": "claude-haiku-4-5" },
#     { "id": "...", "pair": "USDT/NGN", "spreadNet": 3.8, "llmModel": "gemini-2.5-flash" },
#     { "id": "...", "pair": "USDT/EUR", "spreadNet": 3.1, "llmModel": "mistral-small-3.1" }
#   ]
# }

# 2. Vérifie que le LLM a round-robiné (3 modèles différents ci-dessus)

# 3. Vérifie les canaux Telegram :
#    - Canal FR → message en français, structure CDC, disclaimer, hashtags
#    - Canal EN → message en anglais, même structure

# 4. Vérifie la déduplication :
#    - Re-déclenche un scan immédiatement
#    - opportunitiesSkippedDedup > 0 (les mêmes paires sont ignorées 30 min)

# 5. Vérifie l'idempotence :
#    - Déclenche 3 scans en parallèle (curl & curl & curl)
#    - 1 seul réussit, les 2 autres retournent skipped: "locked"`,
      },
      tip: "Le pipeline publie max 3 opportunités par scan pour éviter le spam (CDC § 5.1 : 3-15 messages/jour). Avec 6 scans/heure × 3 = 18/h max — le debounce de 2 min + dedup de 30 min limitent naturellement le volume réel à ~10-15/jour.",
    },
  ],

  finalChecklist: [
    "✅ Bot Telegram créé via @BotFather",
    "✅ 2 canaux publics (FR + EN) créés avec descriptions SEO ≤ 150 caractères",
    "✅ Bot ajouté comme admin des 2 canaux",
    "✅ Compte OpenRouter créé + clé API stockée dans GitHub Secrets",
    "✅ 4 secrets configurés (TELEGRAM_BOT_TOKEN, FR_ID, EN_ID, OPENROUTER_API_KEY)",
    "✅ Mini App déployée (GitHub Pages OU Vercel)",
    "✅ Bouton Mini App configuré dans @BotFather via /newapp",
    "✅ 8 APIs P2P testées manuellement",
    "✅ Premier cycle complet validé (scan → LLM → publish automatique)",
    "✅ Coût OpenRouter surveillé (< 10$/mois)",
    "✅ Vercel Hobby + Neon Postgres configurés (DATABASE_URL pooler)",
    "✅ prisma/schema.prisma migré vers postgresql",
    "✅ Endpoint /api/scan/trigger déployé + idempotent (ScanLock)",
    "✅ CRON_API_KEY défini dans Vercel env vars",
    "✅ cron-job.org configuré (POST /api/scan/trigger toutes les 5 min)",
    "✅ GitHub Actions trigger_scan.yml configuré (redondance)",
    "✅ Upstash QStash configuré (redondance + retry garanti)",
    "✅ vercel.json cron quotidien pour /api/daily-report (8h UTC)",
    "✅ Auto-publish vérifié : scan → LLM FR+EN → Telegram automatique",
    "✅ Déduplication 30 min vérifiée",
    "✅ Idempotence verrou vérifiée (3 scans parallèles → 1 seul réussit)",
  ],
};

export async function GET() {
  return NextResponse.json(CONFIG_GUIDE);
}
