import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
      <body className={`${inter.variable} font-sans antialiased bg-[#0A1628] text-[#F8F9FC]`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
