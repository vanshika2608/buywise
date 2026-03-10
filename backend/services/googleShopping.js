import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-IN,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// ── Amazon search (primary) ──────────────────────────────────
async function scrapeAmazonSearch(query, max = 5) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 14000 });
  const $ = cheerio.load(html);
  const results = [];

  $("[data-component-type='s-search-result']").each((_, el) => {
    if (results.length >= max) return false;
    const $el = $(el);
    const title = $el.find("h2 span").first().text().trim();
    const priceWhole = $el.find(".a-price-whole").first().text().replace(/[^0-9]/g, "");
    const price = priceWhole ? parseInt(priceWhole) : null;
    const ratingText = $el.find(".a-icon-alt").first().text();
    const rating = parseFloat(ratingText) || null;
    const reviewText = $el.find(".a-size-base.s-underline-text").first().text().replace(/[^0-9]/g, "");
    const reviewCount = parseInt(reviewText) || 0;
    const image = $el.find(".s-image").first().attr("src") || null;
    const asin = $el.attr("data-asin");
    const link = asin ? `https://www.amazon.in/dp/${asin}` : null;

    if (title && title.length > 5) {
      results.push({ title, price, rating, reviewCount, image, link, store: "Amazon", source: "amazon_search" });
    }
  });

  return results;
}

// ── Google Shopping (fallback) ───────────────────────────────
async function scrapeGoogleShopping(query, max = 5) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop&hl=en&gl=in`;
  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  const $ = cheerio.load(html);
  const results = [];

  $(".sh-dgr__grid-result, .sh-dlr__list-result, .KZmu8e, .i0X6df, .sh-pr__product-result").each((_, el) => {
    if (results.length >= max) return false;
    const $el = $(el);
    const title = $el.find("h3, .tAxDx, .Xjkr3b, h4").first().text().trim();
    const priceRaw = $el.find(".a8Pemb, .kHxwFf, [class*='price']").first().text();
    const price = parseFloat(priceRaw.replace(/[^\d.]/g, "")) || null;
    const image = $el.find("img").first().attr("src") || null;
    const href = $el.find("a").first().attr("href") || "";
    const link = href.startsWith("http") ? href : href ? `https://www.google.com${href}` : null;
    const ratingLabel = $el.find("[aria-label*='star']").first().attr("aria-label") || "";
    const rating = parseFloat(ratingLabel.match(/[\d.]+/)?.[0]) || null;
    if (title && price) {
      results.push({ title, price, rating, reviewCount: 0, image, link, store: "Google Shopping", source: "google_shopping" });
    }
  });

  return results;
}

// ── Main export ───────────────────────────────────────────────
export async function scrapeGoogleShoppingAlternatives(query, max = 5) {
  try {
    const results = await scrapeAmazonSearch(query, max);
    if (results.length >= 2) {
      console.log(`Amazon search: ${results.length} results for "${query}"`);
      return results;
    }
  } catch (e) {
    console.log("Amazon search failed:", e.message);
  }

  try {
    const results = await scrapeGoogleShopping(query, max);
    if (results.length > 0) {
      console.log(`Google Shopping: ${results.length} results for "${query}"`);
      return results;
    }
  } catch (e) {
    console.log("Google Shopping failed:", e.message);
  }

  return [];
}

// ── Query builder: brand + product type only, no fluff ───────
export function buildAlternativesQuery(title, category) {
  const noise = new Set([
    "the","a","an","with","for","and","or","in","on","by","of","to","from",
    "buy","new","pack","set","free","offer","deal","inc","ltd","pvt",
    "size","color","colour","black","white","red","blue","green","grey","gray",
    "xl","xxl","xs","sm","md","lg","men","women","unisex","boys","girls","kids",
    "pair","piece","laceup","slip","resistant","lightweight","dailyuse",
    "extrasoft","foam","memory","casual","canvas","combo","india","uk","us",
    // size/variant noise
    "high","top","mid","low","all","star","platform","street",
    // material noise  
    "alloy","steel","chrome","plastic","wood","wooden","fabric","metal",
    // colour words often in product titles
    "red","pink","yellow","orange","purple","silver","golden","beige","brown",
  ]);

  const words = title
    .replace(/\(.*?\)/g, " ")
    .replace(/[|\\\/\-_]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !noise.has(w.toLowerCase()) && !/^\d+$/.test(w))
    .slice(0, 4);

  // No suffix — clean brand + product type gives best Amazon results
  return words.join(" ");
}