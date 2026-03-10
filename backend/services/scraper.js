import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS_AMAZON = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "max-age=0",
};

async function withRetry(fn, retries = 3, delay = 1200) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}

function ogImage($) {
  return $('meta[property="og:image"]').attr("content")
    || $('meta[name="twitter:image"]').attr("content")
    || null;
}

export async function fetchGoogleImage(query) {
  const key = process.env.GOOGLE_API_KEY, cx = process.env.GOOGLE_CX;
  if (!key || !cx) return null;
  try {
    const { data } = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: { key, cx, q: query, searchType: "image", num: 1 },
      timeout: 5000,
    });
    return data.items?.[0]?.link || null;
  } catch { return null; }
}

// ── Amazon ────────────────────────────────────────────────────
async function scrapeAmazon(url) {
  const { data: html } = await axios.get(url, { headers: HEADERS_AMAZON, timeout: 15000 });
  const $ = cheerio.load(html);

  // Title
  const title = $("#productTitle").text().trim()
    || $("h1#title span").first().text().trim()
    || $("h1.a-size-large").first().text().trim();

  // ── Price: try every possible selector Amazon uses ─────────
  // NOTE: Amazon renders price differently for Prime, deals, subscribe etc.
  let price = null;
  const priceAttempts = [
    () => $(".priceToPay .a-offscreen").first().text(),
    () => $(".apexPriceToPay .a-offscreen").first().text(),
    () => $("#corePriceDisplay_desktop_feature_div .a-offscreen").first().text(),
    () => $("#corePrice_desktop .a-offscreen").first().text(),
    () => $(".a-price[data-a-color='price'] .a-offscreen").first().text(),
    () => $(".a-price .a-offscreen").first().text(),
    () => $("#priceblock_ourprice").text(),
    () => $("#priceblock_dealprice").text(),
    () => $("#priceblock_saleprice").text(),
    () => $("#price_inside_buybox").text(),
    () => $("#newBuyBoxPrice").text(),
    () => $(".a-price-whole").first().text(),
    // Subscribe & Save price
    () => $("[data-feature-name='snsAccordionRow'] .a-offscreen").first().text(),
    // Used / new price
    () => $(".olpPriceColumn .a-color-price").first().text(),
  ];
  for (const attempt of priceAttempts) {
    const raw = attempt().trim();
    if (raw && /\d/.test(raw)) {
      const parsed = parseFloat(raw.replace(/[^\d.]/g, ""));
      if (parsed > 0) { price = parsed; break; }
    }
  }

  // JSON-LD schema fallback
  if (!price) {
    $("script[type='application/ld+json']").each((_, el) => {
      if (price) return false;
      try {
        const json = JSON.parse($(el).html() || "{}");
        const p = json?.offers?.price || json?.offers?.[0]?.price || json?.price;
        if (p && parseFloat(p) > 0) price = parseFloat(p);
      } catch {}
    });
  }

  // ── Rating ─────────────────────────────────────────────────
  const ratingText = $("span.a-icon-alt").first().text()
    || $("#acrPopover").attr("title")
    || $("[data-hook='average-star-rating'] .a-icon-alt").first().text();
  const rating = parseFloat(ratingText) || null;

  // ── Review count ───────────────────────────────────────────
  const reviewText = $("#acrCustomerReviewText").text()
    || $("[data-hook='total-review-count']").text()
    || $("span[data-hook='total-review-count']").text();
  const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, "")) || 0;

  // ── Image ──────────────────────────────────────────────────
  let image = null;
  const imgEl = $("#landingImage, #imgBlkFront, #main-image").first();
  // data-a-dynamic-image is a JSON map of {url: [w,h]}
  const dynImg = imgEl.attr("data-a-dynamic-image");
  if (dynImg) {
    try {
      const map = JSON.parse(dynImg);
      // Get the largest image
      const entries = Object.entries(map);
      if (entries.length) {
        entries.sort((a, b) => (b[1][0] * b[1][1]) - (a[1][0] * a[1][1]));
        image = entries[0][0];
      }
    } catch {}
  }
  if (!image) image = imgEl.attr("data-old-hires") || imgEl.attr("src") || ogImage($);

  if (!title) throw new Error("Couldn't read product title — Amazon may be blocking this request. Try again in a moment.");
  return { title, price, rating, reviewCount, image, platform: "Amazon" };
}

// ── Flipkart ──────────────────────────────────────────────────
async function scrapeFlipkart(url) {
  const { data: html } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    timeout: 12000,
  });
  const $ = cheerio.load(html);
  const title = $("span.B_NuCI").text().trim() || $("h1.yhB1nd span").text().trim() || $("h1").first().text().trim();
  const priceRaw = $("div._30jeq3._16Jk6d").text() || $("div._30jeq3").first().text();
  const price = parseFloat(priceRaw.replace(/[₹,\s]/g, "")) || null;
  const rating = parseFloat($("div._3LWZlK").first().text()) || null;
  const reviewCount = parseInt(($("span._2_R_DZ span").first().text()).replace(/[^0-9]/g, "")) || 0;
  const image = $("img._396cs4").first().attr("src") || $("img._2r_T1I").first().attr("src") || ogImage($);
  if (!title) throw new Error("Couldn't read product from Flipkart.");
  return { title, price, rating, reviewCount, image, platform: "Flipkart" };
}

// ── Universal (any other site) ────────────────────────────────
async function scrapeUniversal(url) {
  const { data: html } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36" },
    timeout: 14000,
  });
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr("content")
    || $("h1[itemprop='name']").text().trim()
    || $("h1.product-title, h1.product_title, h1[class*='product']").first().text().trim()
    || $("h1").first().text().trim()
    || $("title").text().split("|")[0].trim();

  // Price via schema first, then common selectors
  let priceRaw = $('[itemprop="price"]').attr("content") || $('[itemprop="price"]').text();
  if (!priceRaw) {
    for (const sel of [".price", ".product-price", ".woocommerce-Price-amount", "[class*='price']", "[id*='price']", ".sale-price"]) {
      const v = $(sel).first().text().trim();
      if (v && /\d/.test(v)) { priceRaw = v; break; }
    }
  }
  const price = priceRaw ? parseFloat(priceRaw.replace(/[^\d.]/g, "")) || null : null;
  const rating = parseFloat($('[itemprop="ratingValue"]').attr("content") || $('[itemprop="ratingValue"]').text()) || null;
  const reviewCount = parseInt(($('[itemprop="reviewCount"]').attr("content") || $('[itemprop="reviewCount"]').text() || "").replace(/[^0-9]/g, "")) || 0;
  const image = ogImage($) || $('[itemprop="image"]').attr("src") || null;

  // Fraud signals for unknown sites
  const fraudSignals = [];
  const body = $("body").text().toLowerCase();
  if (!url.startsWith("https://")) fraudSignals.push("Site does not use HTTPS.");
  if (!body.includes("contact") && !body.includes("support")) fraudSignals.push("No contact or support information found.");
  if (/only \d+ left|hurry|limited stock|selling fast/i.test(body)) fraudSignals.push("Urgency language detected — common pressure tactic.");
  if (!body.includes("return") && !body.includes("refund")) fraudSignals.push("No return or refund policy found.");
  if (rating === 5.0 && reviewCount > 50) fraudSignals.push("Suspiciously perfect rating on an unknown platform.");

  if (!title) throw new Error("Couldn't extract product info. Make sure it's a direct product page URL.");
  return { title, price, rating, reviewCount, image, platform: "Web", fraudSignals };
}

export async function scrapeProduct(url) {
  const lower = url.toLowerCase();
  if (lower.includes("amazon")) return withRetry(() => scrapeAmazon(url));
  if (lower.includes("flipkart")) return withRetry(() => scrapeFlipkart(url));
  return withRetry(() => scrapeUniversal(url));
}