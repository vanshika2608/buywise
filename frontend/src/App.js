import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5050";

// ─── VaultNet dark tokens ──────────────────────────────────────────────────
// Light VaultNet: bg=#f0ede6, card=white, nav=#111, text=#1a1a1a
// Dark version: bg=warm-near-black, card=warm-dark, nav=same-black
const BG      = "#141412";   // warm near-black (not cold #000)
const CARD    = "#1c1c19";   // card surface (warm dark)
const NAV     = "#0f0f0d";   // nav bar (slightly darker)
const BORDER  = "#2a2a25";   // card borders
const DIVIDER = "#222220";   // row dividers
const INK     = "#f0ede6";   // primary text — VaultNet's cream, inverted
const INK2    = "#7a7870";   // secondary text
const INK3    = "#3a3a35";   // disabled/faint
const GOLD    = "#c9a84c";   // VaultNet exact gold
const GREEN   = "#3d8b5e";   // positive amounts
const RED     = "#a84040";   // negative/risky
const AMBER   = "#a07030";   // caution

// Fonts — exact VaultNet fonts
const SERIF = "'Instrument Serif', Georgia, serif";
const MONO  = "'JetBrains Mono', monospace";

const RISK = {
  LOW:    { c: GREEN, label: "Safe buy"  },
  MEDIUM: { c: AMBER, label: "Caution"   },
  HIGH:   { c: RED,   label: "Risky buy" },
};

const rs = n => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const ct = n => n != null ? Number(n).toLocaleString("en-IN") : "0";

// ─── Atoms ────────────────────────────────────────────────────────────────

// ALL CAPS section label — VaultNet's "AVAILABLE BALANCE", "RECIPIENT" etc
function SLabel({ children, mb = 10 }) {
  return <p style={{ fontFamily: MONO, fontSize: 11, color: INK2, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: mb }}>{children}</p>;
}

// Card container — white card with border, exact VaultNet style
function Card({ children, style = {} }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

// Thin horizontal rule
const Rule = ({ my = 0 }) => <div style={{ height: 1, background: DIVIDER, margin: `${my}px 0` }} />;

// Stars
function Stars({ r = 0 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 11, color: i <= Math.round(r) ? GOLD : INK3 }}>★</span>
      ))}
    </span>
  );
}

// Image thumbnail
function Img({ src, alt, size = 72 }) {
  const [err, setErr] = useState(false);
  const s = { width: size, height: size, borderRadius: 8, border: `1px solid ${BORDER}`, background: BG, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
  if (!src || err) return <div style={s}><span style={{ fontFamily: MONO, fontSize: 9, color: INK3 }}>img</span></div>;
  return <img src={src} alt={alt} onError={() => setErr(true)} style={{ ...s, objectFit: "cover" }} />;
}

// Score ring
function Ring({ val = 0, label, color = GOLD }) {
  const SZ = 70, r = 26, sw = 5, cx = SZ / 2;
  const c = 2 * Math.PI * r;
  const d = Math.min(100, Math.max(0, val)) / 100 * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={SZ} height={SZ}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={INK3} strokeWidth={sw} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${d} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)" }} />
        <text x={cx} y={cx+5} textAnchor="middle" fill={INK} fontSize={14} fontWeight={700} fontFamily={MONO}>
          {Math.round(val)}
        </text>
      </svg>
      <SLabel mb={0}>{label}</SLabel>
    </div>
  );
}

// Transaction-style row — exactly like VaultNet's transaction list
// Left: serif name + mono sub-label. Right: amount in color.
function DataRow({ label, sublabel, value, valueColor = INK, last = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0" }}>
      <div>
        <p style={{ fontFamily: SERIF, fontSize: 15, color: INK, marginBottom: 2 }}>{label}</p>
        {sublabel && <p style={{ fontFamily: MONO, fontSize: 11, color: INK2 }}>{sublabel}</p>}
      </div>
      <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: valueColor, whiteSpace: "nowrap" }}>{value}</p>
    </div>
  );
}

// Ghost / bordered button — VaultNet "SIGN OUT"
function OutlineBtn({ children, onClick, active = false, small = false }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ fontFamily: MONO, fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: small ? "5px 12px" : "7px 16px", borderRadius: 4, border: `1px solid ${active ? GOLD : h ? INK2 : BORDER}`, background: active ? `${GOLD}18` : "transparent", color: active ? GOLD : h ? INK : INK2, cursor: "pointer", transition: "all 0.1s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

// Solid black button — VaultNet "SEND TRANSFER"
function BlackBtn({ children, onClick, disabled = false, fullWidth = false }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "13px 24px", borderRadius: 6, border: "none", background: disabled ? INK3 : h ? "#2a2a25" : INK, color: disabled ? "#666" : BG, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.1s", width: fullWidth ? "100%" : undefined, whiteSpace: "nowrap", display: "block" }}>
      {children}
    </button>
  );
}

// Pill badge
function Badge({ children, color = GOLD }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 3, padding: "2px 7px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ─── Trust calc ──────────────────────────────────────────────────────────
const trust = (rating, reviewCount, riskLevel) =>
  Math.round(Math.min(100, Math.max(0,
    (rating / 5) * 40 +
    Math.min(40, Math.log10((reviewCount || 1) + 1) * 18) +
    (riskLevel === "LOW" ? 20 : riskLevel === "MEDIUM" ? 10 : 0)
  )));

// ─── Product Analysis Card ────────────────────────────────────────────────
function ProductCard({ data, onWatch, watched, onAlert }) {
  const { product, metrics, reasons, priceHistory, platform } = data;
  const R = RISK[product.riskLevel] || RISK.LOW;
  const T = trust(product.rating, product.reviewCount, product.riskLevel);
  const V = Math.min(100, (metrics?.valueScore || 0) * 10);
  const P = Math.min(100, (metrics?.popularityScore || 0) * 5);
  const avgPx = priceHistory?.length > 1
    ? priceHistory.reduce((s, x) => s + (x.price || 0), 0) / priceHistory.length : null;

  return (
    <Card>
      <div style={{ padding: "28px 28px 0" }}>

        {/* Product header — image + title + price, like VaultNet's balance card */}
        <div style={{ display: "flex", gap: 18, marginBottom: 24 }}>
          <Img src={product.image} alt={product.title} size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: INK, lineHeight: 1.4, marginBottom: 10 }}>
              {product.title}
            </h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <Stars r={product.rating} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: INK2 }}>
                {product.rating?.toFixed(1)} · {ct(product.reviewCount)} reviews
              </span>
              {platform && <Badge color={INK2}>{platform}</Badge>}
            </div>
            {/* Big number like VaultNet "$24,750" */}
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: INK, letterSpacing: "-0.02em" }}>
                {rs(product.price)}
              </span>
              <Badge color={R.c}>{R.label}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Rule />

      {/* TRUST & VALUE ANALYSIS section */}
      <div style={{ padding: "0 28px" }}>
        <div style={{ padding: "20px 0 4px" }}>
          <SLabel>Trust &amp; Value Analysis</SLabel>
          {/* Rings */}
          <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 0 20px" }}>
            <Ring val={V} label="Value"      color={GOLD} />
            <Ring val={P} label="Popularity" color="#6b7de8" />
            <Ring val={T} label="Trust"      color={T >= 70 ? GREEN : T >= 40 ? AMBER : RED} />
          </div>
          {/* Score rows — VaultNet transaction-row style */}
          <Rule />
          <DataRow label="Value for money" sublabel={`Score ${Math.round(V)} / 100`}  value={`${Math.round(V)}`}  valueColor={GOLD} />
          <Rule />
          <DataRow label="Popularity"      sublabel={`Score ${Math.round(P)} / 100`}  value={`${Math.round(P)}`}  valueColor="#6b7de8" />
          <Rule />
          <DataRow label="Trust score"     sublabel={`Score ${T} / 100`}              value={`${T}`}              valueColor={T >= 70 ? GREEN : T >= 40 ? AMBER : RED} />
        </div>
      </div>

      {/* Risk signals */}
      {reasons?.length > 0 && (
        <>
          <Rule />
          <div style={{ padding: "20px 28px" }}>
            <SLabel>Risk signals detected</SLabel>
            {reasons.map((r, i) => (
              <div key={i}>
                <DataRow label={r} sublabel="" value="!" valueColor={RED} last={i === reasons.length - 1} />
                {i < reasons.length - 1 && <Rule />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Price history */}
      {avgPx && (
        <>
          <Rule />
          <div style={{ padding: "16px 28px" }}>
            <DataRow
              label="Historical average"
              sublabel={`${priceHistory.length} price snapshots recorded`}
              value={rs(Math.round(avgPx))}
              valueColor={product.price && product.price < avgPx ? GREEN : INK2}
            />
          </div>
        </>
      )}

      <Rule />
      {/* Actions */}
      <div style={{ padding: "16px 28px", display: "flex", gap: 8 }}>
        <OutlineBtn onClick={() => onWatch(product)} active={watched}>
          {watched ? "Watchlisted" : "+ Watchlist"}
        </OutlineBtn>
        <OutlineBtn onClick={() => onAlert(product)}>Price alert</OutlineBtn>
      </div>
    </Card>
  );
}

// ─── Alternatives ─────────────────────────────────────────────────────────
function Alternatives({ items }) {
  if (!items?.length) return (
    <Card style={{ padding: "36px 28px", textAlign: "center" }}>
      <p style={{ fontFamily: SERIF, fontSize: 16, color: INK2 }}>No alternatives found</p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, marginTop: 6 }}>Analyze more products in this category to build alternatives</p>
    </Card>
  );

  return (
    <Card>
      {/* Header row */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 10, alignItems: "center" }}>
        <SLabel mb={0}>Alternatives</SLabel>
        <Badge color={GOLD}>{items.length} found</Badge>
        {items.some(a => a.source === "google_shopping") && <Badge color="#6b7de8">Live · Google Shopping</Badge>}
      </div>

      {/* Rows — VaultNet transaction list style */}
      {items.map((a, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", cursor: a.link ? "pointer" : "default", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = BG}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={() => a.link && window.open(a.link, "_blank")}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK3, width: 18, flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
            <Img src={a.image} alt={a.title} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: SERIF, fontSize: 14, color: INK, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {a.rating && <Stars r={a.rating} />}
                {a.reviewCount > 0 && <span style={{ fontFamily: MONO, fontSize: 10, color: INK2 }}>{ct(a.reviewCount)} reviews</span>}
                {a.store && <Badge color={INK2}>{a.store}</Badge>}
                {a.source === "google_shopping" && <Badge color="#6b7de8">live</Badge>}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>{rs(a.price)}</p>
              {a.link && <p style={{ fontFamily: MONO, fontSize: 9, color: GOLD, marginTop: 2 }}>view ↗</p>}
            </div>
          </div>
          {i < items.length - 1 && <Rule />}
        </div>
      ))}
    </Card>
  );
}

// ─── Compare ─────────────────────────────────────────────────────────────
function CompareView({ dA, dB }) {
  const tA = trust(dA.product.rating, dA.product.reviewCount, dA.product.riskLevel);
  const tB = trust(dB.product.rating, dB.product.reviewCount, dB.product.riskLevel);
  const vA = Math.min(100, (dA.metrics?.valueScore || 0) * 10);
  const vB = Math.min(100, (dB.metrics?.valueScore || 0) * 10);

  const rows = [
    { l: "Price",       a: dA.product.price,       b: dB.product.price,       f: rs,                              low: true },
    { l: "Rating",      a: dA.product.rating,      b: dB.product.rating,      f: v => v?.toFixed(1) + " ★" },
    { l: "Reviews",     a: dA.product.reviewCount, b: dB.product.reviewCount, f: ct },
    { l: "Value score", a: vA,                     b: vB,                     f: v => Math.round(v) + " / 100" },
    { l: "Trust score", a: tA,                     b: tB,                     f: v => v + " / 100" },
    { l: "Risk",        a: dA.product.riskLevel,   b: dB.product.riskLevel,
      f: v => RISK[v]?.label || v,
      cmp: (a, b) => { const s = {LOW:0,MEDIUM:1,HIGH:2}; return s[a]<s[b]?"A":s[a]>s[b]?"B":null; }
    },
  ];

  let sA = 0, sB = 0;
  if (tA > tB) sA++; else if (tB > tA) sB++;
  if (vA > vB) sA++; else if (vB > vA) sB++;
  if ((dA.product.rating||0) > (dB.product.rating||0)) sA++; else sB++;
  if ((dA.product.reviewCount||0) > (dB.product.reviewCount||0)) sA++; else sB++;
  if (dA.product.riskLevel === "LOW") sA++;
  if (dB.product.riskLevel === "LOW") sB++;
  const winner = sA > sB ? "A" : sB > sA ? "B" : null;

  return (
    <Card>
      {/* Side by side product headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", minWidth: 0 }}>
        {/* Product A */}
        <div style={{ padding: "22px", borderBottom: `1px solid ${BORDER}`, background: `${GREEN}08`, minWidth: 0, overflow: "hidden" }}>
          <Badge color={GREEN} style={{ marginBottom: 10, display: "block" }}>Product A</Badge>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 10 }}>
            <Img src={dA.product.image} alt={dA.product.title} size={52} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: SERIF, fontSize: 13, color: INK, lineHeight: 1.4, marginBottom: 6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{dA.product.title}</p>
              <p style={{ fontFamily: SERIF, fontSize: 20, color: INK }}>{rs(dA.product.price)}</p>
            </div>
          </div>
        </div>
        {/* VS divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: BG, borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, writingMode: "vertical-rl", letterSpacing: "0.2em" }}>VS</span>
        </div>
        {/* Product B */}
        <div style={{ padding: "22px", borderBottom: `1px solid ${BORDER}`, background: `${GOLD}08`, minWidth: 0, overflow: "hidden" }}>
          <Badge color={GOLD} style={{ marginBottom: 10, display: "block" }}>Product B</Badge>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 10 }}>
            <Img src={dB.product.image} alt={dB.product.title} size={52} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: SERIF, fontSize: 13, color: INK, lineHeight: 1.4, marginBottom: 6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{dB.product.title}</p>
              <p style={{ fontFamily: SERIF, fontSize: 20, color: INK }}>{rs(dB.product.price)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data rows — VaultNet transaction table style */}
      {rows.map((row, i) => {
        const w = row.cmp ? row.cmp(row.a, row.b)
          : row.a != null && row.b != null
            ? (row.low ? (row.a<row.b?"A":row.a>row.b?"B":null) : (row.a>row.b?"A":row.a<row.b?"B":null))
            : null;
        return (
          <div key={i}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", background: i%2===0?"transparent":BG, minWidth: 0 }}>
              {/* A */}
              <div style={{ padding: "13px 22px", display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: w==="A"?INK:INK2, fontWeight: w==="A"?700:400 }}>{row.f(row.a)}</span>
                {w==="A" && <Badge color={GREEN}>Win</Badge>}
              </div>
              {/* Center label */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, textTransform: "uppercase", letterSpacing: "0.1em", writingMode: "vertical-rl", textAlign: "center" }}>{row.l}</span>
              </div>
              {/* B */}
              <div style={{ padding: "13px 22px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, minWidth: 0, overflow: "hidden" }}>
                {w==="B" && <Badge color={GOLD}>Win</Badge>}
                <span style={{ fontFamily: MONO, fontSize: 13, color: w==="B"?INK:INK2, fontWeight: w==="B"?700:400 }}>{row.f(row.b)}</span>
              </div>
            </div>
            {i < rows.length-1 && <Rule />}
          </div>
        );
      })}

      {/* Verdict */}
      {winner && (
        <>
          <Rule />
          <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <Badge color={winner==="A"?GREEN:GOLD}>BuyWise Pick</Badge>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 15, color: INK, marginBottom: 2 }}>Product {winner} wins</p>
              <p style={{ fontFamily: MONO, fontSize: 10, color: INK2 }}>
                {(winner==="A"?dA:dB).product.title?.slice(0,55)}… · {rs((winner==="A"?dA:dB).product.price)}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Alert Modal ──────────────────────────────────────────────────────────
function AlertModal({ product, onClose, onSave }) {
  const [email, setEmail]   = useState("");
  const [target, setTarget] = useState(product ? Math.round(product.price * 0.85) : "");
  const [done, setDone]     = useState(false);

  const go = async () => {
    if (!email || !target) return;
    await onSave({ email, targetPrice: Number(target), product });
    setDone(true);
  };

  const inp = { fontFamily: MONO, width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 14px", color: INK, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ maxWidth: 400, width: "100%", padding: "32px" }}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${GREEN}20`, border: `1px solid ${GREEN}50`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: GREEN, fontSize: 20 }}>✓</div>
            <p style={{ fontFamily: SERIF, fontSize: 20, color: INK, marginBottom: 10 }}>Alert created</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: INK2, lineHeight: 1.8, marginBottom: 24 }}>
              We'll email <strong style={{ color: INK }}>{email}</strong> when the price drops to <strong style={{ color: GOLD }}>{rs(target)}</strong>
            </p>
            <BlackBtn onClick={onClose} fullWidth>Done</BlackBtn>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
              <Img src={product?.image} alt={product?.title} size={48} />
              <div>
                <SLabel>Price Alert</SLabel>
                <p style={{ fontFamily: SERIF, fontSize: 13, color: INK, lineHeight: 1.4 }}>{product?.title?.slice(0,55)}…</p>
              </div>
            </div>
            <Rule my={0} />
            <div style={{ paddingTop: 20 }}>
              {[
                { l: "Your email",         v: email,  s: setEmail,  ph: "you@email.com",                                       t: "email"  },
                { l: "Alert when below",   v: target, s: setTarget, ph: String(Math.round((product?.price||0)*0.85)),           t: "number" },
              ].map(f => (
                <div key={f.l} style={{ marginBottom: 16 }}>
                  <SLabel mb={6}>{f.l}</SLabel>
                  <input type={f.t} value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph} style={inp}
                    onFocus={e => e.target.style.borderColor = INK2}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
              ))}
              <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, marginBottom: 20 }}>
                Current price: {rs(product?.price)} · Suggested target: {rs(Math.round((product?.price||0)*0.85))}
              </p>
              <BlackBtn onClick={go} disabled={!email || !target} fullWidth>Set alert</BlackBtn>
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Watchlist ────────────────────────────────────────────────────────────
function WatchlistView({ items, onRemove }) {
  if (!items.length) return (
    <Card style={{ padding: "60px 28px", textAlign: "center" }}>
      <p style={{ fontFamily: SERIF, fontSize: 20, color: INK2, marginBottom: 8 }}>Your watchlist is empty</p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: INK3 }}>Analyze a product and click "+ Watchlist" to track it here</p>
    </Card>
  );

  return (
    <Card>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SLabel mb={0}>Watchlist</SLabel>
        <Badge color={GOLD}>{items.length} items</Badge>
      </div>
      {items.map((p, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = BG}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Img src={p.image} alt={p.title} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: SERIF, fontSize: 14, color: INK, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: INK }}>{rs(p.price)}</span>
                <Badge color={(RISK[p.riskLevel]||RISK.LOW).c}>{(RISK[p.riskLevel]||RISK.LOW).label}</Badge>
              </div>
            </div>
            <OutlineBtn small onClick={() => onRemove(i)}>Remove</OutlineBtn>
          </div>
          {i < items.length - 1 && <Rule />}
        </div>
      ))}
    </Card>
  );
}

// ─── URL input — VaultNet "SEND MONEY" form style ────────────────────────
function UrlInput({ val, set, onGo, loading }) {
  const [foc, setFoc] = useState(false);
  return (
    <div>
      <SLabel>Product URL</SLabel>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={val} onChange={e => set(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onGo()}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          placeholder="https://www.amazon.in/product/..."
          style={{ flex: 1, fontFamily: MONO, fontSize: 13, background: BG, border: `1px solid ${foc ? INK2 : BORDER}`, borderRadius: 6, padding: "11px 14px", color: INK, outline: "none", transition: "border-color 0.1s" }} />
        <button onClick={onGo} disabled={loading || !val.trim()}
          style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 22px", borderRadius: 6, border: "none", background: loading||!val.trim() ? INK3 : INK, color: loading||!val.trim() ? "#666" : BG, cursor: loading||!val.trim() ? "not-allowed" : "pointer", transition: "all 0.1s", whiteSpace: "nowrap" }}>
          {loading
            ? <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
                <span style={{ width:10, height:10, border:`1.5px solid #666`, borderTopColor:BG, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                Checking
              </span>
            : "Analyze →"}
        </button>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("analyze");
  const [url, setUrl]         = useState("");
  const [urlB, setUrlB]       = useState("");
  const [loading, setLoad]    = useState(false);
  const [loadingB, setLoadB]  = useState(false);
  const [result, setResult]   = useState(null);
  const [resultB, setResultB] = useState(null);
  const [error, setError]     = useState(null);
  const [alertP, setAlertP]   = useState(null);
  const [wl, setWl] = useState(() => { try { return JSON.parse(localStorage.getItem("bw6_wl")||"[]"); } catch { return []; } });
  const [hist, setHist] = useState(() => { try { return JSON.parse(localStorage.getItem("bw6_h")||"[]"); } catch { return []; } });

  useEffect(() => { localStorage.setItem("bw6_wl", JSON.stringify(wl)); }, [wl]);
  useEffect(() => { localStorage.setItem("bw6_h",  JSON.stringify(hist)); }, [hist]);

  const analyze = async (u, isB = false) => {
    const target = u || (isB ? urlB : url);
    if (!target?.trim()) return;
    isB ? setLoadB(true) : setLoad(true);
    if (!isB) { setError(null); setResult(null); } else setResultB(null);
    try {
      const r = await fetch(`${API}/api/product/analyze`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url: target }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      if (isB) setResultB(j);
      else {
        setResult(j);
        setHist(h => [{ url: target, title: j.product?.title, image: j.product?.image }, ...h].slice(0, 6));
      }
    } catch (e) { if (!isB) setError(e.message); }
    finally { isB ? setLoadB(false) : setLoad(false); }
  };

  const addWl = p => { if (!wl.find(x => x.url === p.url)) setWl(h => [p, ...h]); };
  const saveAlert = async ({ email, targetPrice, product }) => {
    try { await fetch(`${API}/api/alerts`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, targetPrice, productUrl: product.url, productTitle: product.title }) }); } catch {}
  };

  const TABS = ["analyze","compare","watchlist"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${BG};color:${INK};font-family:${MONO};min-height:100vh}
        input::placeholder{color:${INK3}}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:1px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .up{animation:up 0.22s ease both}
        .up1{animation:up 0.22s 0.05s ease both}
        .up2{animation:up 0.22s 0.1s ease both}
      `}</style>

      {/* ── Nav — exact VaultNet dark ── */}
      <div style={{ background: NAV, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand: "Buy" normal + "Wise" italic gold — mirrors "Vault" + "Net" */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 20, color: INK, letterSpacing: "-0.01em" }}>
              Buy<span style={{ color: GOLD, fontStyle: "italic" }}>Wise</span>
            </span>
          </div>
          {/* Right: label + button — mirrors "ALICE MERCER" + "SIGN OUT" */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Smart Shopping Intelligence
            </span>
            {wl.length > 0 && (
              <button onClick={() => setTab("watchlist")}
                style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 4, border: `1px solid ${BORDER}`, background: "transparent", color: INK, cursor: "pointer" }}>
                {wl.length} Watchlisted
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Page ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 28px 80px" }}>

        {/* Page heading — "Good morning, Alice" equivalent */}
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: INK, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analyze any product
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 11, color: INK2, letterSpacing: "0.04em" }}>
            Tuesday, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Tabs — underline style */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 30 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 20px", border: "none", background: "transparent", color: tab===t ? INK : INK2, borderBottom: `2px solid ${tab===t ? INK : "transparent"}`, cursor: "pointer", transition: "all 0.1s", marginBottom: -1 }}>
              {t}{t==="watchlist" && wl.length > 0 ? ` (${wl.length})` : ""}
            </button>
          ))}
        </div>

        {/* ─── ANALYZE ─── */}
        {tab === "analyze" && (
          <div>
            {/* URL input inside a card — like VaultNet "SEND MONEY" card */}
            <Card style={{ padding: "24px 28px", marginBottom: 16 }} className="up">
              <UrlInput val={url} set={setUrl} onGo={() => analyze()} loading={loading} />

              {/* Recent — like VaultNet's transaction history */}
              {hist.length > 0 && !result && !loading && (
                <div style={{ marginTop: 20 }}>
                  <Rule my={0} />
                  <SLabel style={{ marginTop: 16, marginBottom: 12 }}>Recent searches</SLabel>
                  {hist.slice(0, 4).map((h, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", transition: "opacity 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        onClick={() => { setUrl(h.url); analyze(h.url); }}>
                        {h.image && <img src={h.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", border: `1px solid ${BORDER}` }} onError={e => e.target.style.display="none"} />}
                        <p style={{ fontFamily: SERIF, fontSize: 14, color: INK, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {h.title || h.url}
                        </p>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: INK2 }}>↗ Load</span>
                      </div>
                      {i < Math.min(hist.length, 4) - 1 && <Rule />}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {error && (
              <div className="up" style={{ padding: "14px 18px", background: `${RED}15`, border: `1px solid ${RED}40`, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontFamily: MONO, fontSize: 11, color: RED }}>Error: {error}</p>
              </div>
            )}

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="up"><ProductCard data={result} onWatch={addWl} watched={wl.some(p => p.url === result.product?.url)} onAlert={setAlertP} /></div>
                <div className="up1"><Alternatives items={result.alternatives} /></div>
                <div className="up2" style={{ textAlign: "center" }}>
                  <OutlineBtn onClick={() => { setResult(null); setError(null); setUrl(""); }}>Analyze another</OutlineBtn>
                </div>
              </div>
            )}

            {/* Feature cards — like VaultNet's 3-column stat cards */}
            {!result && !loading && !error && (
              <div className="up1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 8 }}>
                {[
                  { stat: "6",     label: "Risk signals",    sub: "Rating, reviews, price history, fraud patterns" },
                  { stat: "Live",  label: "Alternatives",    sub: "Scraped fresh from Google Shopping" },
                  { stat: "100%",  label: "Any store",       sub: "Amazon, Flipkart, or any indie e-commerce site" },
                  { stat: "Free",  label: "No account",      sub: "Paste any product URL and get results instantly" },
                ].map((f, i) => (
                  <Card key={i} style={{ padding: "24px" }}>
                    <p style={{ fontFamily: SERIF, fontSize: 28, color: INK, marginBottom: 4 }}>{f.stat}</p>
                    <SLabel mb={4}>{f.label}</SLabel>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: INK2, lineHeight: 1.7 }}>{f.sub}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── COMPARE ─── */}
        {tab === "compare" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { l: "A", u: url,  su: setUrl,  res: result,  ld: loading,  isB: false },
                { l: "B", u: urlB, su: setUrlB, res: resultB, ld: loadingB, isB: true  },
              ].map(({ l, u, su, res, ld, isB }) => (
                <Card key={l} style={{ padding: "20px 22px" }}>
                  <SLabel>Product {l}</SLabel>
                  <div style={{ display: "flex", gap: 8, marginBottom: res ? 12 : 0 }}>
                    <input value={u} onChange={e => su(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && analyze(u, isB)}
                      placeholder="Paste URL…"
                      style={{ flex: 1, fontFamily: MONO, fontSize: 11, background: BG, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "9px 12px", color: INK, outline: "none" }} />
                    <button onClick={() => analyze(u, isB)} disabled={ld||!u.trim()}
                      style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "0 14px", borderRadius: 5, border: "none", background: ld||!u.trim() ? INK3 : INK, color: BG, cursor: ld||!u.trim()?"not-allowed":"pointer" }}>
                      {ld ? "…" : "Go"}
                    </button>
                  </div>
                  {res && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Img src={res.product.image} alt={res.product.title} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: SERIF, fontSize: 12, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.product.title?.slice(0,42)}…</p>
                        <p style={{ fontFamily: MONO, fontSize: 12, color: INK, marginTop: 2 }}>{rs(res.product.price)}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {result && resultB
              ? <CompareView dA={result} dB={resultB} />
              : (
                <Card style={{ padding: "60px 28px", textAlign: "center" }}>
                  <p style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginBottom: 10 }}>Compare any two products</p>
                  <p style={{ fontFamily: MONO, fontSize: 11, color: INK2, lineHeight: 1.8 }}>Paste product URLs above and hit Go on both</p>
                </Card>
              )}
          </div>
        )}

        {/* ─── WATCHLIST ─── */}
        {tab === "watchlist" && (
          <WatchlistView items={wl} onRemove={i => setWl(h => h.filter((_,j) => j !== i))} />
        )}
      </div>

      {alertP && <AlertModal product={alertP} onClose={() => setAlertP(null)} onSave={saveAlert} />}
    </>
  );
}