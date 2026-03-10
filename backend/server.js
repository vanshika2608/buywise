import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { scrapeProduct } from "./services/scraper.js";
import { scrapeGoogleShoppingAlternatives, buildAlternativesQuery } from "./services/googleShopping.js";
import { detectCategory } from "./services/categoryDetector.js";
import { calculateRiskScore } from "./services/riskEngine.js";
import { computeScores, rankAlternatives } from "./services/intelligenceEngine.js";
import { sendPriceAlert } from "./services/emailService.js";
import Product from "./models/Product.js";
import { Snapshot } from "./models/ProductSnapshot.js";
import { Alert } from "./models/Alert.js";

const app  = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
  methods: ["GET", "POST", "DELETE"],
}));
app.use(express.json());
app.use("/api/product/analyze", rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }));

app.get("/health", (_, res) => res.json({ ok: true }));

// ── POST /api/product/analyze ────────────────────────────────
app.post("/api/product/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url?.startsWith("http")) return res.status(400).json({ error: "Valid URL required." });

  try {
    // 1. Scrape
    const scraped = await scrapeProduct(url);
    const { title, rating, reviewCount, platform, fraudSignals = [], image } = scraped;
    const price = scraped.price; // may be null if Amazon blocked

    console.log(`Scraped: ${title?.slice(0,40)} | price=${price} | rating=${rating} | reviews=${reviewCount}`);

    // 2. Category
    const category = detectCategory(title);

    // 3. Snapshot
    await Snapshot.create({ productUrl: url, price, rating, reviewCount });
    const snapshots = await Snapshot.find({ productUrl: url }).sort({ timestamp: -1 }).limit(20).lean();

    // 4. Risk
    const { score: riskScore, riskLevel, reasons } = calculateRiskScore(
      { title, price, rating, reviewCount, fraudSignals },
      snapshots
    );

    // 5. Save/update DB
    const dbProduct = await Product.findOneAndUpdate(
      { url },
      { $set: { title, price, rating, reviewCount, category, riskScore, riskLevel, image, lastAnalyzed: new Date() }, $inc: { analyzedCount: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6. ── KEY FIX: pass FRESH scraped values, NOT dbProduct ──
    // Old code had: computeScores(product) → price=null → valueScore=0
    // New code:     computeScores({ rating, reviewCount, price }) → always works
    const metrics = computeScores({ rating, reviewCount, price });
    console.log(`Metrics: value=${metrics.valueScore} pop=${metrics.popularityScore}`);

    // 7. Alternatives: Google Shopping first, then keyword-filtered DB fallback
    let alternatives = [];
    try {
      const q = buildAlternativesQuery(title, category);
      console.log("Shopping query:", q);
      alternatives = await scrapeGoogleShoppingAlternatives(q, 6);
      console.log(`Live alternatives: ${alternatives.length}`);
    } catch (e) {
      console.error("Shopping failed:", e.message);
    }

    // DB fallback — keyword filter prevents Ray-Ban showing for sneakers
    if (alternatives.length < 3) {
      // Take first 2 meaningful keywords from product title
      const stopWords = /^(with|and|for|the|from|men|women|unisex|size|black|white|blue|red|green)$/i;
      const keywords = title
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.test(w))
        .slice(0, 2);

      const regexStr = keywords.length >= 2
        ? keywords.join("|")
        : keywords[0] || category;

      console.log("DB keyword filter:", regexStr);

      const dbAlts = await Product.find({
        _id: { $ne: dbProduct._id },
        title: { $regex: regexStr, $options: "i" },
      }).limit(8).lean();

      const ranked = rankAlternatives(dbAlts);
      const existingTitles = new Set(alternatives.map(a => a.title?.slice(0, 15).toLowerCase()));
      alternatives = [
        ...alternatives,
        ...ranked.filter(r => !existingTitles.has(r.title?.slice(0, 15).toLowerCase())),
      ].slice(0, 6);
    }

    // 8. Price history
    const priceHistory = snapshots.slice(0, 10).map(s => ({ price: s.price, timestamp: s.timestamp }));

    // 9. Price alerts
    if (price) {
      const alerts = await Alert.find({ productUrl: url, triggered: false });
      for (const alert of alerts) {
        if (price <= alert.targetPrice) {
          try {
            await sendPriceAlert({ to: alert.email, productTitle: title, targetPrice: alert.targetPrice, currentPrice: price, productUrl: url });
            await Alert.findByIdAndUpdate(alert._id, { triggered: true, currentPrice: price });
          } catch (e) { console.error("Email error:", e.message); }
        }
      }
    }

    res.json({
      product: { ...dbProduct.toObject(), image, price, rating, reviewCount },
      metrics,
      reasons,
      alternatives,
      priceHistory,
      platform: platform || "Web",
    });

  } catch (err) {
    console.error("Analyze error:", err.message);
    res.status(422).json({ error: err.message || "Failed to analyze product." });
  }
});

// ── POST /api/alerts ─────────────────────────────────────────
app.post("/api/alerts", async (req, res) => {
  const { email, targetPrice, productUrl, productTitle } = req.body;
  if (!email || !targetPrice || !productUrl) return res.status(400).json({ error: "Missing fields." });
  try {
    const existing = await Alert.findOne({ email, productUrl, triggered: false });
    if (existing) {
      await Alert.findByIdAndUpdate(existing._id, { targetPrice });
      return res.json({ message: "Alert updated." });
    }
    const alert = await Alert.create({ email, targetPrice: Number(targetPrice), productUrl, productTitle });
    res.json({ message: "Alert created.", alertId: alert._id });
  } catch { res.status(500).json({ error: "Could not save alert." }); }
});

app.get("/api/stats", async (_, res) => {
  try {
    const [products, alerts] = await Promise.all([Product.countDocuments(), Alert.countDocuments({ triggered: false })]);
    res.json({ products, pendingAlerts: alerts });
  } catch { res.status(500).json({ error: "Stats failed." }); }
});

// ── Start ────────────────────────────────────────────────────
const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO) { console.error("No MongoDB URI"); process.exit(1); }

mongoose.connect(MONGO)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`BuyWise API → http://localhost:${PORT}`));
  })
  .catch(e => { console.error("MongoDB error:", e.message); process.exit(1); });