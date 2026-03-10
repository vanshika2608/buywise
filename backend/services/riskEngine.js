const PRICE_DROP_THRESHOLD = 0.25;
const RATING_DROP_THRESHOLD = 0.4;

export function calculateRiskScore(product, snapshots = []) {
  let score = 0;
  const reasons = [];
  const { rating, reviewCount, price, fraudSignals = [] } = product;

  // ── Universal site fraud signals (from scraper) ──────────────
  for (const signal of fraudSignals) {
    score += 20;
    reasons.push(signal);
  }

  // ── Signal 1: Rating inflation ────────────────────────────────
  if (rating >= 4.7 && reviewCount <= 30) {
    score += 35;
    reasons.push(`Suspicious: ${rating}★ rating with only ${reviewCount} reviews — possible inflation.`);
  }

  // ── Signal 2: No reviews ──────────────────────────────────────
  if (!reviewCount || reviewCount === 0) {
    score += 25;
    reasons.push("No reviews found — product is unverified by buyers.");
  }

  // ── Signal 3: Perfect 5.0 rating ─────────────────────────────
  if (rating === 5.0 && reviewCount < 100) {
    score += 20;
    reasons.push(`Perfect 5.0★ with only ${reviewCount} reviews is statistically unusual.`);
  }

  // ── Signal 4: Very few reviews ────────────────────────────────
  if (reviewCount > 0 && reviewCount < 10) {
    score += 15;
    reasons.push(`Only ${reviewCount} reviews — insufficient social proof.`);
  }

  // ── Signal 5: Sudden price drop vs history ────────────────────
  if (snapshots.length >= 3) {
    const prices = snapshots.map(s => s.price).filter(Boolean);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (price && avgPrice && price < avgPrice * (1 - PRICE_DROP_THRESHOLD)) {
      const dropPct = Math.round(((avgPrice - price) / avgPrice) * 100);
      score += 25;
      reasons.push(`Price dropped ${dropPct}% below historical average (₹${Math.round(avgPrice)}) — verify authenticity.`);
    }
  }

  // ── Signal 6: Rating regression over time ─────────────────────
  if (snapshots.length >= 3) {
    const ratings = snapshots.map(s => s.rating).filter(Boolean);
    if (ratings.length >= 2) {
      const oldRating = ratings[ratings.length - 1];
      const newRating = ratings[0];
      if (oldRating - newRating >= RATING_DROP_THRESHOLD) {
        score += 20;
        reasons.push(`Rating fell from ${oldRating.toFixed(1)}★ to ${newRating.toFixed(1)}★ over time — quality decline detected.`);
      }
    }
  }

  let riskLevel = "LOW";
  if (score >= 60) riskLevel = "HIGH";
  else if (score >= 30) riskLevel = "MEDIUM";

  return { score, riskLevel, reasons };
}