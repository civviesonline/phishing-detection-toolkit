import React, { useState } from "react";
import { useTheme, Card, Label, Spinner, Tag, btnStyle, ScoreBar, Flag, TrafficLight, ConfidenceMeter } from "../shared/UI";
import { MONO, SYNE, RISK_CFG } from "../../data/constants";
import { analyzeObfuscatedLink } from "../../utils/analysis";

// Global custom state
let CUSTOM_DOMAINS = [], CUSTOM_KW = [];

export function LinkDeobfuscator({ onTrigger }) {
  const { dark } = useTheme();
  const [url, setUrl] = useState(""), [res, setRes] = useState(null), [scanning, setScanning] = useState(false);
  const run = () => { if (!url.trim()) return; setScanning(true); setRes(null); setTimeout(() => { const r = analyzeObfuscatedLink(url.trim(), CUSTOM_DOMAINS, CUSTOM_KW); setRes(r); setScanning(false); onTrigger(r.risk); }, 1100); };
  return (
    <div>
      <Label>Unmask hidden redirect chains and encoded URLs</Label>
      <div className="pg-row" style={{ display: "flex", gap: 10 }}>
        <input style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 8, padding: "12px 16px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: MONO, fontSize: 13, outline: "none" }} placeholder="https://example.com/redirect?url=http%3A%2F%2Fmalicious.xyz" value={url} onChange={e => { setUrl(e.target.value); setRes(null); }} />
        <button style={btnStyle("#22aaff")} onClick={run}>{scanning ? "DECODING..." : "UNMASK LINK"}</button>
      </div>
      {scanning && <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner size={32} color="#22aaff" /></div>}
      {res && <div style={{ marginTop: 20, animation: "fadeIn .3s ease" }}>
        <Card border={RISK_CFG[res.risk].color + "55"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <TrafficLight risk={res.risk} />
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: SYNE, fontSize: 44, fontWeight: 900, color: RISK_CFG[res.risk].color, lineHeight: 1 }}>{res.score}</div><div style={{ fontSize: 10, color: "#445", letterSpacing: 2 }}>THREAT SCORE</div></div>
          </div>
          <ScoreBar score={res.score} risk={res.risk} />
          <ConfidenceMeter confidence={res.behavior.confidence} risk={res.risk} />
          <div style={{ marginTop: 22 }}>
            <Label>Redirect Chain ({res.hopCount} hops)</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 6, top: 10, bottom: 10, width: 2, background: "linear-gradient(180deg, #6644ff, #ff3355)", borderRadius: 1 }} />
              {res.chainAnalyses.map((hop, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -19, top: 6, width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#6644ff" : i === res.chainAnalyses.length - 1 ? RISK_CFG[hop.risk].color : "#445", border: "2px solid #0a0a1a" }} />
                  <div style={{ fontSize: 9, color: "#445", letterSpacing: 2, marginBottom: 2 }}>{i === 0 ? "ENTRY POINT" : i === res.chainAnalyses.length - 1 ? "FINAL DESTINATION" : `HOP ${i}`}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: i === res.chainAnalyses.length - 1 ? "#dde" : "#789", wordBreak: "break-all" }}>{hop.url}</div>
                  {i > 0 && res.behavior.hopMeta[i - 1] && <div style={{ fontSize: 9, color: "#556", marginTop: 2 }}>Trigger: <span style={{ color: "#22aaff" }}>{res.behavior.hopMeta[i - 1].key}</span> parameter</div>}
                </div>
              ))}
            </div>
          </div>
          {res.flags.length > 0 && <div style={{ marginTop: 20 }}><Label>Analysis Flags</Label>{res.flags.map((f, i) => <Flag key={i} f={f} color={res.risk === "DANGER" ? "#ff3355" : "#22aaff"} />)}</div>}
        </Card>
      </div>}
    </div>
  );
}
