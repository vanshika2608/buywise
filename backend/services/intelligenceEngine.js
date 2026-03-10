// ── BuyWise Intelligence Engine ───────────────────────────────
// Root cause of Value=0: old formula `price > 0 ? ... : 0`
// Fix: rating + review confidence gives value, price is optional modifier

export function computeScores({ rating = 0, reviewCount = 0, price = null }) {
  // Value: based on rating quality + review confidence (0–10)
  // Does NOT return 0 when price is null
  const ratingNorm   = (rating || 0) / 5;                               // 0–1
  const confidence   = Math.min(1, Math.log10((reviewCount || 1) + 1) / 3); // 0–1 (saturates at ~1000 reviews)
  let value = ratingNorm * 6 + confidence * 4;                          // 0–10

  // Price is an optional bonus/penalty — never required
  if (price && price > 0) {
    if      (price < 500)   value += 0.8;
    else if (price < 2000)  value += 0;
    else if (price < 10000) value -= 0.5;
    else                    value -= 1.2;
    value = Math.min(10, Math.max(0, value));
  }

  // Popularity: log scale on review count (0–20, maps to 0–100 on frontend via *5)
  const popularity = Math.min(20, Math.log10((reviewCount || 1) + 1) * 7.5);

  return {
    valueScore:      parseFloat(value.toFixed(2)),
    popularityScore: parseFloat(popularity.toFixed(2)),
  };
}

export function rankAlternatives(products) {
  return [...products]
    .filter(p => p.rating && p.reviewCount)
    .sort((a, b) => {
      const s = p => (p.rating / 5) * 50 + Math.min(50, Math.log10((p.reviewCount || 1) + 1) * 15);
      return s(b) - s(a);
    })
    .slice(0, 5);
}