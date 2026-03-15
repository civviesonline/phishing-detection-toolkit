import React, { useState } from "react";
import { useTheme, Card, Label, TrafficLight, ScoreBar, Tag, Flag, InfoBox, Spinner, btnStyle, ThreatIntelligencePanel } from "../shared/UI";
import { MONO, SYNE, RISK_CFG, CUSTOM_DOMAINS, CUSTOM_KW } from "../../data/constants";
import { analyzeEmail, playSound } from "../../utils/analysis";

export function EmailAnalyzer({ onTrigger }) {
  const { dark, isMobile } = useTheme();
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [res, setRes] = useState(null);
  const inp = { width: "100%", background: dark ? "#0a0a18" : "#f5f6fc", border: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`, borderRadius: 7, padding: "13px 17px", fontFamily: MONO, fontSize: 16, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none", boxSizing: "border-box" };
  const scan = () => {
    if (!from.trim() && !subject.trim() && !body.trim()) return;
    const r = analyzeEmail({ from, subject, body }, CUSTOM_DOMAINS, CUSTOM_KW);
    setRes(r);
    onTrigger?.({
      type: "email",
      risk: r.risk,
      score: r.score,
      summary: r.senderFlags?.[0] || subject || "Email threat analysis",
      detail: r,
      domain: r.scannedLinks?.[0]?.domain
    });
    playSound(r.risk);
  };
  return (
    <div>
      <Label>Analyze email sender, subject, and body</Label>
      <div className="pg-row" style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input style={{ ...inp, fontSize: 13 }} placeholder="From: Google Play <noreply@google.com>" value={from} onChange={e => { setFrom(e.target.value); setRes(null); }} />
        <input style={{ ...inp, fontSize: 13 }} placeholder="Subject: Your Google Play order receipt" value={subject} onChange={e => { setSubject(e.target.value); setRes(null); }} />
      </div>
      <textarea style={{ ...inp, minHeight: 160, resize: "vertical", lineHeight: 1.7 }} placeholder={"Paste email body here...\n\nExample: Thanks for your purchase. View your receipt at https://play.google.com/..." } value={body} onChange={e => { setBody(e.target.value); setRes(null); }} />
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, marginTop: 10, alignItems: isMobile ? "stretch" : "center" }}>
        <button style={{ ...btnStyle("#ff9900"), width: isMobile ? "100%" : "auto" }} onClick={scan}>ANALYZE EMAIL</button>
        {res && (
          <button
            style={{
              ...btnStyle("#1a1a30"),
              boxShadow: "none",
              border: "1px solid #2a2a50",
              width: isMobile ? "100%" : "auto"
            }}
            onClick={() => {
              setFrom("");
              setSubject("");
              setBody("");
              setRes(null);
            }}
          >
            CLEAR
          </button>
        )}
      </div>
      {res && <div style={{ animation: "fadeIn .3s ease" }}>
        <Card border={RISK_CFG[res.risk].color + "55"} style={{ marginTop: 16 }}>
          <TrafficLight risk={res.risk} />
          <ScoreBar score={res.score} risk={res.risk} />
          <ThreatIntelligencePanel intelligence={res.intelligence} risk={res.risk} />
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            {[["Keywords", res.keywords.length, "#ff3355"], ["Urgency", res.urgency.length, "#ffcc00"], ["Links", res.linkCount, "#6699ff"], ["Hidden Redirects", res.hiddenRedirects || 0, "#22aaff"], ["Escalated Links", res.deobEscalations || 0, "#9977ff"], ["Attachment", res.hasAttach ? "YES" : "NO", res.hasAttach ? "#ff3355" : "#00ff88"]].map(([l, v, c], i) => (
              <div key={i} style={{ background: dark ? "#0d0d1e" : "#f8f9ff", border: "1px solid #1a1a30", borderRadius: 8, padding: "12px 16px", flex: "1 1 90px" }}>
                <div style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 900, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: "#445", letterSpacing: 2, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          {res.keywords.length > 0 && <div style={{ marginTop: 14 }}><Label>Flagged Terms</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{res.keywords.map((k, i) => <Tag key={"k" + i} color="#ff3355">{k}</Tag>)}{res.urgency.map((k, i) => <Tag key={"u" + i} color="#ffcc00">{k}</Tag>)}</div></div>}
          {res.senderFlags?.length > 0 && <div style={{ marginTop: 14 }}><Label>Sender Analysis</Label>{res.senderFlags.map((f, i) => <Flag key={i} f={f} />)}</div>}
          {res.scannedLinks?.length > 0 && <div style={{ marginTop: 14 }}><Label>URLs in Email ({res.scannedLinks.length})</Label>{res.scannedLinks.map((l, i) => {
            const c = RISK_CFG[l.risk] || RISK_CFG.SAFE;
            const directRisk = l.direct?.risk || l.risk;
            const finalRisk = l.deob?.finalAnalysis?.risk || directRisk;
            return (
              <div key={i} style={{ background: dark ? "#080812" : "#fafbff", border: `1px solid ${c.color}44`, borderRadius: 7, padding: "10px 14px", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink:0 }} />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: "#6677aa", wordBreak: "break-all" }}>{l.url.length > 55 ? l.url.slice(0, 55) + "…" : l.url}</span>
                  </div>
                  <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 11, color: c.color, flexShrink: 0 }}>{l.risk}</span>
                </div>
                {l.deob?.hopCount > 0 && <InfoBox color="#22aaff" style={{ marginTop: 8 }}>Hidden redirect chain: {l.deob.hopCount} hop(s) · final destination risk: <span style={{ fontFamily: SYNE, fontWeight: 800, marginLeft: 4 }}>{finalRisk}</span></InfoBox>}
                {(directRisk !== l.risk || finalRisk !== directRisk) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <Tag color="#6677aa">Direct: {directRisk}</Tag>
                  <Tag color="#22aaff">Final: {finalRisk}</Tag>
                  <Tag color={c.color}>Effective: {l.risk}</Tag>
                </div>}
                <MiniSitePreview url={l.url} />
                {l.flags?.length > 0 && <div style={{ marginTop: 6, paddingLeft: 18 }}>{l.flags.map((f, j) => <div key={j} style={{ fontSize: 11, color: "#cc8899", marginTop: 2 }}>▶ {f}</div>)}</div>}
              </div>
            );
          })}
          </div>}
        </Card>
        {body && <Card style={{ marginTop: 12 }}><Label>Annotated Content</Label><AnnotatedText text={body} result={res} /></Card>}
      </div>}
    </div>
  );
}

function MiniSitePreview({ url, risk = "SAFE" }) {
  const [st, setSt] = useState("loading");
  const [srcIdx, setSrcIdx] = useState(0);
  let safe;
  try { safe = new URL(url.startsWith("http") ? url : "https://" + url); } catch { return null; }
  
  const previewSources = [
    `https://s.wordpress.com/mshots/v1/${encodeURIComponent(safe.href)}?w=600`,
    `https://image.thum.io/get/width/600/noanimate/${safe.href}`,
    `https://mini.s-shot.com/600x400/JPEG/600/Z100/?${safe.href}`
  ];

  useEffect(() => { setSt("loading"); setSrcIdx(0); }, [safe.href]);
  
  const isSafe = risk === "SAFE";

  return (
    <div style={{ marginTop: 8, border: `1px solid ${isSafe ? "#00ff8822" : "#1e2240"}`, borderRadius: 7, overflow: "hidden", background: "#070712", position: "relative" }}>
      {isSafe && st === "ok" && (
        <div style={{ position: "absolute", top: 6, right: 6, zIndex: 10, background: "#00ff88cc", color: "#000", fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 4, letterSpacing: 1 }}>
          VERIFIED
        </div>
      )}
      
      {st === "loading" && <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 10, color: "#556" }}><Spinner color={isSafe ? "#00ff88" : "#22aaff"} size={12} />Fetching authentic preview...</div>}
      
      <img 
        src={previewSources[srcIdx]} 
        style={{ width: "100%", height: 150, objectFit: "cover", display: st === "ok" ? "block" : "none", opacity: .88 }} 
        onLoad={() => setSt("ok")} 
        onError={() => { 
          if (srcIdx < previewSources.length - 1) { 
            setSrcIdx(i => i + 1); 
          } else {
            setSt("err");
          }
        }} 
        alt={`Safe preview of ${safe.hostname}`} 
      />
      
      {st === "err" && <div style={{ padding: "12px 15px", fontSize: 10, color: "#667", display: "flex", alignItems: "center", gap: 8 }}><img src={`https://www.google.com/s2/favicons?sz=32&domain=${safe.hostname}`} style={{ width: 16, height: 16 }} alt="" />Preview unavailable for this URL.</div>}
    </div>
  );
}

function AnnotatedText({ text, result }) {
  const allKw = [...result.keywords, ...result.urgency];
  const spans = (result.scannedLinks || []).map(l => { const idx = text.indexOf(l.url); return idx >= 0 ? { s: idx, e: idx + l.url.length, risk: l.risk } : null; }).filter(Boolean);
  const marks = text.split("").map((c, ci) => {
    for (const sp of spans) { if (ci === sp.s) return { c: text.slice(sp.s, sp.e), t: "url-" + sp.risk, n: sp.e - sp.s }; if (ci > sp.s && ci < sp.e) return { c: "", t: "skip", n: 1 }; }
    const sub = text.slice(ci).toLowerCase(); for (const k of allKw) { if (sub.startsWith(k)) return { c: text.slice(ci, ci + k.length), t: result.urgency.includes(k) ? "urg" : "kw", n: k.length }; }
    return { c, t: "n", n: 1 };
  });
  const out = []; let i = 0;
  while (i < text.length) {
    const m = marks[i]; if (m.t === "skip") { i++; continue; }
    if (m.t.startsWith("url-")) { const r = m.t.slice(4), c = RISK_CFG[r] || RISK_CFG.SAFE; out.push(<mark key={i} style={{ background: `${c.color}18`, color: c.color, borderRadius: 3, padding: "1px 4px", border: `1px solid ${c.color}44`, fontFamily: MONO, fontSize: 11 }}>{m.c}<span style={{ marginLeft: 5, fontSize: 9, fontFamily: SYNE, fontWeight: 800, verticalAlign: "middle" }}>[{r}]</span></mark>); }
    else if (m.t !== "n") { out.push(<mark key={i} style={{ background: m.t === "urg" ? "rgba(255,204,0,.18)" : "rgba(255,51,85,.18)", color: m.t === "urg" ? "#ffcc00" : "#ff6677", borderRadius: 2, padding: "0 2px" }}>{m.c}</mark>); }
    else out.push(m.c); i += m.n;
  }
  return <div style={{ fontSize: 13, lineHeight: 1.9, color: "#7788aa", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{out}</div>;
}
