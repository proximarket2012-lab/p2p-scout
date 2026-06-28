import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/p2p/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "P2P Arbitrage Scout — Signaux d'Arbitrage Crypto Temps Réel",
  description: "Système mondial de détection d'opportunités d'arbitrage P2P sur 8 plateformes. Signaux FR + EN, net de frais, publiés sur Telegram en moins de 60 secondes. Aucune expertise requise.",
  keywords: [
    "arbitrage p2p", "crypto arbitrage", "signaux crypto gratuits", "usdt", "binance p2p",
    "bybit p2p", "okx p2p", "noones", "arbitrage afrique", "crypto francophone",
    "passive income crypto", "p2p trading", "stablecoin arbitrage", "crypto signals"
  ],
  authors: [{ name: "P2P Arbitrage Scout" }],
  openGraph: {
    title: "P2P Arbitrage Scout — Signaux d'Arbitrage Crypto Temps Réel",
    description: "Détection automatique d'opportunités d'arbitrage P2P sur 8 plateformes. Signaux FR + EN publiés sur Telegram. Aucune expertise requise.",
    type: "website",
    locale: "fr_FR",
    siteName: "P2P Arbitrage Scout",
  },
  twitter: {
    card: "summary_large_image",
    title: "P2P Arbitrage Scout",
    description: "Signaux d'arbitrage P2P temps réel sur 8 plateformes. FR + EN.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Telegram WebApp SDK — beforeInteractive so it's ready before React mounts.
            In Telegram WebApp context, Telegram injects this; in browser, it loads from CDN. */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#0A1628] text-[#F8F9FC]`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#0F1F3A",
              color: "#F8F9FC",
              border: "1px solid rgba(248, 249, 252, 0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
