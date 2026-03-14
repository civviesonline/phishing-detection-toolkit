import React, { useState, useEffect, createContext, useContext } from "react";
import { SYNE, MONO, RISK_CFG } from "../../data/constants";

export const ThemeCtx = createContext({ dark: true });
export const useTheme = () => useContext(ThemeCtx);

export function Card({ children, border, style = {} }) {
  const { dark } = useTheme();
  const b = border || (dark ? "#1e2240" : "#dde0f0");
  return <div style={{ background: dark ? "#0a0a1a" : "#ffffff", border: `1px solid ${b}`, borderRadius: 12, padding: 22, ...style }}>{children}</div>;
}

export function Label({ children }) {
  const { dark } = useTheme();
  return <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, letterSpacing: 4, color: dark ? "#445" : "#99a", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

export const Tag = ({ children, color = "#ff3355" }) => (
  <span style={{ background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 3, padding: "3px 10px", fontSize: 12, color, fontFamily: MONO, letterSpacing: 1 }}>{children}</span>
);

export const Spinner = ({ color = "#ff3355", size = 20 }) => (
  <div style={{ width: size, height: size, border: `2px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
);

export function TrafficLight({ risk }) {
  const c = RISK_CFG[risk] || RISK_CFG.SAFE;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 58, height: 58, borderRadius: "50%", background: c.color, boxShadow: `0 0 28px ${c.color},0 0 56px ${c.glow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#000", fontWeight: 900, animation: "pulse 1.4s ease-in-out infinite" }}>{c.icon}</div>
      <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 27, color: c.color, letterSpacing: 4 }}>{c.label}</span>
    </div>
  );
}

export function ScoreBar({ score, risk }) {
  const c = RISK_CFG[risk] || RISK_CFG.SAFE, [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), 80); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: MONO, fontSize: 12, color: "#445", letterSpacing: 2 }}><span>THREAT SCORE</span><span style={{ color: c.color }}>{score}/100</span></div>
      <div style={{ height: 7, background: "#0d0d1e", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg,${c.color}66,${c.color})`, transition: "width .9s cubic-bezier(.22,1,.36,1)", boxShadow: `0 0 10px ${c.color}`, borderRadius: 3 }} /></div>
    </div>
  );
}

export function ConfidenceMeter({ confidence = 0, risk = "SAFE" }) {
  const c = RISK_CFG[risk] || RISK_CFG.SAFE;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: MONO, fontSize: 10, color: "#445", letterSpacing: 2 }}><span>CONFIDENCE</span><span style={{ color: c.color }}>{confidence}%</span></div>
      <div style={{ height: 5, background: "#0d0d1e", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.max(0, Math.min(100, confidence))}%`, height: "100%", background: `linear-gradient(90deg,${c.color}55,${c.color})`, boxShadow: `0 0 10px ${c.color}`, borderRadius: 3 }} /></div>
    </div>
  );
}

export function Flag({ f, color = "#ff3355" }) {
  return <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: `${color}0a`, border: `1px solid ${color}22`, borderRadius: 5, marginTop: 7, fontSize: 13, color: "#cc8899" }}><span style={{ color, flexShrink: 0 }}>▶</span>{f}</div>;
}

export function InfoBox({ children, color = "#00ff88", style = {} }) {
  return <div style={{ padding: "11px 15px", background: `${color}08`, border: `1px solid ${color}33`, borderRadius: 6, fontSize: 13, color, marginTop: 8, display: "flex", alignItems: "center", gap: 8, ...style }}>{children}</div>;
}

export function BrandMark({ size = 40 }) {
  return (
    <div aria-hidden="true" style={{ width: size, height: size, position: "relative", flexShrink: 0, borderRadius: 12, background: "radial-gradient(circle at 30% 25%, #2a0f22 0%, #170814 45%, #09040a 100%)", border: "1px solid rgba(255,80,120,.38)", boxShadow: "0 0 0 1px rgba(255,60,105,.15) inset, 0 12px 30px rgba(0,0,0,.28), 0 0 18px rgba(255,51,85,.18)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 5, clipPath: "polygon(50% 0, 88% 18%, 88% 58%, 50% 100%, 12% 58%, 12% 18%)", background: "linear-gradient(180deg,#ff6a5c 0%,#ff3355 52%,#71122b 100%)", boxShadow: "0 0 16px rgba(255,51,85,.35)" }} />
      <div style={{ position: "absolute", inset: size * 0.24, borderRadius: "50%", border: "1.5px solid rgba(255,234,242,.88)", boxShadow: "0 0 12px rgba(255,240,244,.18) inset" }} />
      <div style={{ position: "absolute", inset: size * 0.34, borderRadius: "50%", border: "1px solid rgba(255,220,228,.62)" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: size * 0.22, height: 2, transformOrigin: "0 50%", transform: "translateY(-50%) rotate(-32deg)", background: "linear-gradient(90deg, rgba(255,247,249,.98), rgba(255,255,255,0))", boxShadow: "0 0 14px rgba(255,250,252,.6)" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: size * 0.1, height: size * 0.1, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#fff6f8", boxShadow: "0 0 10px rgba(255,255,255,.75)" }} />
      <div style={{ position: "absolute", right: size * 0.18, top: size * 0.18, width: size * 0.12, height: size * 0.12, borderRadius: "50%", background: "#ffef6b", boxShadow: "0 0 16px rgba(255,239,107,.85)" }} />
    </div>
  );
}

export function AlertOverlay({ level, onDismiss }) {
  const D = level === "DANGER";
  useEffect(() => { if (level) { const t = setTimeout(onDismiss, D ? 5500 : 3500); return () => clearTimeout(t); } }, [level]);
  if (!level) return null;
  const bc = D ? "#ff1133" : "#ffcc00", bg = D ? "linear-gradient(90deg,#cc0022,#ff1133,#ff3355,#ff1133,#cc0022)" : "linear-gradient(90deg,#aa6600,#ffaa00,#ffcc00,#ffaa00,#aa6600)";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, border: `${D ? 5 : 3}px solid ${bc}`, animation: `borderFlash ${D ? ".18s" : ".4s"} ease-in-out infinite` }} />
      {D && [0, 1, 2, 3].map(i => <div key={i} style={{ position: "absolute", [i % 2 ? "right" : "left"]: 0, top: 0, width: 3, height: "100%", background: "linear-gradient(180deg,transparent,#ff1133,transparent)", animation: `scannerV ${.6 + i * .15}s linear infinite`, animationDelay: `${i * .18}s`, opacity: .7 }} />)}
      <div onClick={onDismiss} style={{ background: bg, backgroundSize: "300% 100%", animation: "shimmer .8s linear infinite", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16, pointerEvents: "auto", cursor: "pointer", borderBottom: `2px solid ${D ? "#ff335588" : "#ffcc0088"}`, boxShadow: `0 4px 40px ${D ? "#ff113388" : "#ffaa0066"}` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: D ? "#fff" : "#1a1000", border: D ? "none" : "2px solid #ffcc00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: `pulse ${D ? ".3s" : ".5s"} ease-in-out infinite`, flexShrink: 0 }}>{D ? "🚨" : "⚠"}</div>
        <div style={{ flex: 1 }}><div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: D ? 20 : 17, color: "#fff", letterSpacing: D ? 5 : 3, textShadow: D ? "0 0 20px #fff8" : "none" }}>{D ? "🚨 PHISHING THREAT DETECTED" : "⚠ SUSPICIOUS ACTIVITY DETECTED"}</div><div style={{ fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,.8)", letterSpacing: 2, marginTop: 3 }}>{D ? "HIGH CONFIDENCE — DO NOT PROCEED" : "POTENTIAL INDICATORS — PROCEED WITH CAUTION"} · CLICK TO DISMISS</div></div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,.5)", fontFamily: MONO }}>✕</div>
      </div>
      {D && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg,#ff1133,#ff6600,#ff1133)", backgroundSize: "200% 100%", animation: "shimmer .5s linear infinite" }} />}
      {[{ top: 48, left: 0 }, { top: 48, right: 0 }, { bottom: 6, left: 0 }, { bottom: 6, right: 0 }].map((p, i) => <div key={i} style={{ position: "absolute", ...p, width: D ? 90 : 60, height: D ? 90 : 60, background: `radial-gradient(circle,${D ? "#ff1133" : "#ffaa00"} 0%,transparent 70%)`, animation: `pulse ${D?.2 + i * .04 : .4 + i * .06}s ease-in-out infinite`, animationDelay: `${i * .07}s` }} />)}
      {D && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,transparent 40%,rgba(255,17,51,.25) 100%)", animation: "bgFlash .35s ease-in-out infinite" }} />}
    </div>
  );
}

export function ResultCard({ result }) {
  const c = RISK_CFG[result.risk] || RISK_CFG.SAFE;
  return (
    <Card border={c.color + "55"} style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div><TrafficLight risk={result.risk} />{result.domain && <div style={{ marginTop: 8, fontSize: 12, color: "#445" }}>Domain: <span style={{ color: "#6677aa" }}>{result.domain}</span></div>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontFamily: SYNE, fontSize: 48, fontWeight: 900, color: c.color, lineHeight: 1 }}>{result.score}<span style={{ fontSize: 13, color: "#334", marginLeft: 2 }}>/100</span></div></div>
      </div>
      <ScoreBar score={result.score} risk={result.risk} />
      <ConfidenceMeter confidence={result.confidence ?? Math.min(99, Math.round(30 + result.score * 0.65))} risk={result.risk} />
      {result.flags?.length > 0 && <div style={{ marginTop: 18 }}><Label>Threat Indicators ({result.flags.length})</Label>{result.flags.map((f, i) => <Flag key={i} f={f} />)}</div>}
      {result.flags?.length === 0 && <InfoBox color="#00ff88">✓ No phishing indicators detected.</InfoBox>}
    </Card>
  );
}

export function ThreatIntelligencePanel({ intelligence, risk }) {
  if (!intelligence) return null;
  const isSafe = risk === "SAFE";
  const themeColor = RISK_CFG[risk]?.color || "#445";

  return (
    <Card style={{ marginTop: 16, border: `1px solid ${themeColor}33`, background: `${themeColor}05` }}>
      <Label>Deep Threat Intelligence</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: `1px solid ${themeColor}22` }}>
          <div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 4, fontWeight: 800 }}>ATTACK TACTIC</div>
          <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 800, color: themeColor }}>{intelligence.tactic.toUpperCase()}</div>
        </div>
        <div style={{ padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: `1px solid ${themeColor}22` }}>
          <div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 4, fontWeight: 800 }}>ATTACKER INTENT</div>
          <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 800, color: "#dde" }}>{intelligence.intent.toUpperCase()}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 6, fontWeight: 800 }}>TECHNICAL ANALYSIS</div>
        <div style={{ fontSize: 13, color: "#8899bb", lineHeight: 1.6, fontFamily: MONO }}>{intelligence.technicalDetail || "Detailed pattern matching suggests an automated phishing campaign targeting standard authentication workflows."}</div>
      </div>

      <div style={{ padding: "14px", background: isSafe ? "#00ff8810" : "#ff335510", borderLeft: `4px solid ${isSafe ? "#00ff88" : "#ff3355"}`, borderRadius: "0 8px 8px 0" }}>
        <div style={{ fontSize: 10, color: isSafe ? "#00ff88" : "#ff3355", fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>SOC ANALYST RECOMMENDATION</div>
        <div style={{ fontSize: 13, color: "#dde", fontWeight: 600 }}>{intelligence.recommendation}</div>
      </div>
    </Card>
  );
}

export const btnStyle = (c = "#ff3355") => ({ background: c, border: "none", borderRadius: 6, padding: "11px 22px", fontFamily: SYNE, fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff", cursor: "pointer", boxShadow: `0 0 16px ${c}44`, transition: "all .2s", whiteSpace: "nowrap" });
