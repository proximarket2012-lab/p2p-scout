// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Shared types & API client
// ─────────────────────────────────────────────────────────────

export type OpportunityStatus = "ACTIVE" | "PUBLISHED" | "EXPIRED" | "SUSPICIOUS";

export interface Opportunity {
  id: string;
  pair: string;
  fiat: string;
  region: string;
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  spreadBrut: number;
  feesTotal: number;
  spreadNet: number;
  buyMerchant: string;
  sellMerchant: string;
  buyMerchantRating: number;
  sellMerchantRating: number;
  buyTrades: number;
  sellTrades: number;
  volumeAvailable: number;
  durationMin: number;
  messageFr: string | null;
  messageEn: string | null;
  llmModel: string | null;
  status: OpportunityStatus;
  detectedAt: string;
  expiresAt: string;
  publishedAt: string | null;
}

export interface Platform {
  id: string;
  name: string;
  slug: string;
  apiEndpoint: string;
  feeMaker: number;
  feeTaker: number;
  fiatCount: number;
  liquidity: number;
  region: string;
  color: string;
  logo: string;
  escrow: boolean;
  enabled: boolean;
}

export interface TradingPair {
  id: string;
  symbol: string;
  type: string;
  justification: string;
  risk: string;
  riskEmoji: string;
  region: string;
  baseAsset: string;
  quoteAsset: string;
  enabled: boolean;
}

export interface LlmModel {
  id: string;
  name: string;
  provider: string;
  strengths: string;
  languageFit: string;
  costPer1k: number;
  priority: number;
  enabled: boolean;
  lastUsedAt: string | null;
  useCount: number;
}

export interface Channel {
  id: string;
  language: string;
  name: string;
  description: string;
  hashtags: string;
  pinnedMessage: string | null;
  botUsername: string;
  subscriberCount: number;
  enabled: boolean;
}

export interface ScanLog {
  id: string;
  status: string;
  durationMs: number;
  platformsChecked: number;
  platformsFailed: number;
  opportunitiesFound: number;
  opportunitiesPublished: number;
  error: string | null;
  createdAt: string;
}

export interface Stats {
  opportunities: {
    active: number;
    published: number;
    expired: number;
    suspicious: number;
    total: number;
  };
  bestSpread: number;
  bestOpportunity: Opportunity | null;
  avgSpreadActive: number;
  lastScan: ScanLog | null;
  scannerActive: boolean;
  spreadThreshold: number;
  channels: Channel[];
  counts: { platforms: number; pairs: number; llms: number };
  scanLogs: ScanLog[];
  byPair: { pair: string; count: number; maxSpread: number }[];
  byRegion: { region: string; count: number; avgSpread: number }[];
  top7d: {
    id: string;
    pair: string;
    buyPlatform: string;
    sellPlatform: string;
    spreadNet: number;
    detectedAt: string;
    status: string;
  }[];
  history7d: { date: string; count: number; avgSpread: number; published: number }[];
}

// ── SEO Toolkit type ────────────────────────────────────────────
export interface SeoToolkit {
  limits: {
    channelName: { hard: number; recommended: number };
    channelDescription: { hard: number; recommended: number };
    pinnedMessage: { hard: number; recommended: number };
    messageWords: { min: number; max: number };
    hashtagsPerMessage: { max: number };
    hookLine: { max: number };
    title: { max: number };
  };
  channelTemplates: {
    language: string;
    name: string;
    nameLength: number;
    description: string;
    descriptionLength: number;
    hashtags: string;
    primaryKeywords: string[];
    pinnedMessage: string;
  }[];
  rules: { element: string; rule: string; impact: string }[];
  hashtagLibrary: {
    FR: { primary: string[]; byFiat: Record<string, string>; secondary: string[] };
    EN: { primary: string[]; byFiat: Record<string, string>; secondary: string[] };
  };
  messageStructure: {
    FR: { section: string; constraint: string }[];
    EN: { section: string; constraint: string }[];
  };
  disclaimer: { FR: string; EN: string };
}

// ── Config Guide type ───────────────────────────────────────────
export interface ConfigStep {
  id: number;
  phaseId: number;
  title: string;
  duration: string;
  difficulty: string;
  description: string;
  instructions: { text: string }[];
  code: { language: string; title: string; content: string };
  tip: string;
}

export interface ConfigPhase {
  id: number;
  title: string;
  objective: string;
  tasks: string[];
}

export interface ConfigGuide {
  phases: ConfigPhase[];
  steps: ConfigStep[];
  finalChecklist: string[];
}

// ── API helpers ─────────────────────────────────────────────────
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const apiGetStats = () => api<Stats>("/api/stats");
export const apiGetOpportunities = (params: Record<string, string> = {}) => {
  const q = new URLSearchParams(params).toString();
  return api<{ opportunities: Opportunity[]; count: number }>(`/api/opportunities?${q}`);
};
export const apiGetOpportunity = (id: string) =>
  api<{ opportunity: Opportunity }>(`/api/opportunities/${id}`);
export const apiGetPlatforms = () => api<{ platforms: Platform[] }>("/api/platforms");
export const apiGetPairs = () => api<{ pairs: TradingPair[] }>("/api/pairs");
export const apiGetLlms = () => api<{ llms: LlmModel[] }>("/api/llms");
export const apiGetSeoGuide = () => api<SeoToolkit>("/api/seo-guide");
export const apiGetConfigGuide = () => api<ConfigGuide>("/api/config-guide");

export const apiScan = () =>
  api<{ ok: boolean; opportunitiesCreated: number; durationMs: number; platformsFailed: number }>(
    "/api/scan",
    { method: "POST" }
  );

export const apiGenerate = (id: string, lang: "FR" | "EN") =>
  api<{ ok: boolean; message: string; llmModel: string; cached: boolean }>(
    `/api/generate/${id}?lang=${lang}`,
    { method: "POST" }
  );

export const apiPublish = (id: string) =>
  api<{ ok: boolean; publishedAt: string; channels: string[] }>(
    `/api/publish/${id}`,
    { method: "POST" }
  );

// ── Helpers ─────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `il y a ${Math.max(1, Math.floor(diff / 1000))}s`;
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)}h`;
  return `il y a ${Math.floor(diff / 86_400_000)}j`;
}

export function timeLeft(expiresAt: string): { minutes: number; color: string; label: string } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { minutes: 0, color: "#ef4444", label: "Expiré" };
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 5) return { minutes, color: "#ef4444", label: `< 5 min` };
  if (minutes < 15) return { minutes, color: "#F5A623", label: `< 15 min` };
  return { minutes, color: "#00C48C", label: `> 15 min` };
}

export function formatPrice(price: number, fiat: string): string {
  if (fiat === "EUR" || fiat === "USD" || fiat === "USDT") {
    return price.toFixed(4);
  }
  if (fiat === "GHS" || fiat === "BRL") {
    return price.toFixed(2);
  }
  return price.toFixed(0);
}

export function platformColor(name: string): string {
  const map: Record<string, string> = {
    "Binance P2P": "#F0B90B",
    "Bybit P2P": "#F7A600",
    "OKX P2P": "#2EBD85",
    "HTX / Huobi": "#1A2C4E",
    "KuCoin P2P": "#23AF91",
    "MEXC P2P": "#1972F5",
    "Noones": "#7B3FE4",
    "Bitget P2P": "#00F0FF",
  };
  return map[name] || "#6C3FC7";
}

export function platformLogo(name: string): string {
  const map: Record<string, string> = {
    "Binance P2P": "B",
    "Bybit P2P": "By",
    "OKX P2P": "O",
    "HTX / Huobi": "H",
    "KuCoin P2P": "K",
    "MEXC P2P": "M",
    "Noones": "N",
    "Bitget P2P": "Bg",
  };
  return map[name] || "?";
}

export function regionEmoji(region: string): string {
  const map: Record<string, string> = {
    Africa: "🌍",
    Europe: "🇪🇺",
    Asia: "🌏",
    Americas: "🌎",
    Global: "🌐",
  };
  return map[region] || "🌐";
}

export function statusColor(status: OpportunityStatus): string {
  const map: Record<OpportunityStatus, string> = {
    ACTIVE: "#00C48C",
    PUBLISHED: "#00B5A3",
    EXPIRED: "#6b7280",
    SUSPICIOUS: "#F5A623",
  };
  return map[status] || "#6b7280";
}

export function statusLabel(status: OpportunityStatus): string {
  const map: Record<OpportunityStatus, string> = {
    ACTIVE: "Active",
    PUBLISHED: "Publiée",
    EXPIRED: "Expirée",
    SUSPICIOUS: "Suspecte",
  };
  return map[status] || status;
}
