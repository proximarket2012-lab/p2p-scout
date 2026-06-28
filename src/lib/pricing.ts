// ─────────────────────────────────────────────────────────────
// P2P Arbitrage Scout — Stars Pricing
// Calculates Telegram Stars price to unlock an opportunity
// based on the net spread (after fees + buffer).
// Pure module — no side effects, can be imported from server or client.
// ─────────────────────────────────────────────────────────────

// ── calculateStarsPrice ───────────────────────────────────────────
// Mapping spreadNet (%) → Stars price:
//   - < 2.0%        → floor 10 stars (base)
//   - 2.0–2.5%      → 15 stars
//   - 2.5–3.0%      → 20 stars
//   - 3.0–3.5%      → 25 stars
//   - 3.5–4.0%      → 30 stars
//   - ... (+5 per 0.5% bracket)
//   - >= 10%        → cap 100 stars
//
// Bracket convention: [lower, upper) — i.e. 2.5 belongs to the
// 2.5–3.0 bracket (priced at 20), not 2.0–2.5 (priced at 15).
export function calculateStarsPrice(spreadNet: number): number {
  // Floor: minimum 10 stars regardless of spread.
  if (spreadNet < 2.0) {
    return 10;
  }
  // Cap: maximum 100 stars for very high spreads (>= 10%).
  if (spreadNet >= 10.0) {
    return 100;
  }
  // In between: base 10 + 5 stars per 0.5% bracket above 2.0%.
  // First bracket [2.0, 2.5) = +5 → 15 total.
  // Math.floor((spread - 2.0) / 0.5) gives 0 for [2.0, 2.5),
  // 1 for [2.5, 3.0), etc. — add 1 to count the first bracket.
  const bracketsAbove2 = Math.floor((spreadNet - 2.0) / 0.5);
  const price = 10 + 5 * (bracketsAbove2 + 1);
  // Final clamp (defensive — should already be within [10, 100)).
  return Math.min(100, Math.max(10, Math.round(price)));
}

// ── formatStarsPrice ──────────────────────────────────────────────
// Returns a display string for the Stars price.
// Same format for both languages: "⭐ 25".
// The `language` param exists for API consistency / future localization
// (e.g. if we want to use a different label like "Stars" vs "Étoiles").
export function formatStarsPrice(
  stars: number,
  _language: "fr" | "en"
): string {
  return `⭐ ${stars}`;
}
