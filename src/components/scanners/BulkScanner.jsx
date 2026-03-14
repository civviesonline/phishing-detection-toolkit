import React, { useState } from "react";
import { useTheme, Card, Label, Spinner, Tag, btnStyle, ScoreBar } from "../shared/UI";
import { MONO, SYNE, RISK_CFG, CUSTOM_DOMAINS, CUSTOM_KW } from "../../data/constants";
import { analyzeURL, playSound } from "../../utils/analysis";

export function BulkScanner({ onTrigger }) {
  const { dark } = useTheme();
  const [input, setInput] = useState(""), [results, setResults] = useState([]), [scanning, setScanning] = useState(false);
  const run = () => {
    const urls = input.split(/\n|,/).map(s => s.trim()).filter(s => s.length > 3);
    if (!urls.length) return;
    setScanning(true); setResults([]);
    setTimeout(() => {
      const res = urls.map(u => ({ url: u, ...analyzeURL(u, CUSTOM_DOMAINS, CUSTOM_KW) }));
      setResults(res);
      setScanning(false);
      const rank = { SAFE: 0, SUSPICIOUS: 1, DANGER: 2 };
      const maxRisk = res.reduce((acc, entry) => (rank[entry.risk] > rank[acc] ? entry.risk : acc), "SAFE");
      const avgScore = Math.round(res.reduce((sum, entry) => sum + (entry.score || 0), 0) / res.length);
      onTrigger?.({
        type: "bulk",
        risk: maxRisk,
        score: avgScore,
        summary: `${res.length} URLs analyzed`,
        detail: res
      });
      playSound(maxRisk);
    }, 1200);
  };
  return (
    <div>
      <Label>Analyze multiple URLs at once (newline or comma separated)</Label>
      <textarea style={{ width: "100%", minHeight: 140, background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 8, padding: "12px 16px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: MONO, fontSize: 13, outline: "none", resize: "vertical" }} placeholder={"https://google.com\nhttp://malicious-site.xyz\nhttps://paypal-verify.click"} value={input} onChange={e => { setInput(e.target.value); setResults([]); }} />
      <button style={{ ...btnStyle("#ff3355"), width: "100%", marginTop: 10 }} onClick={run}>{scanning ? "SCANNING BATCH..." : `SCAN ${input.split(/\n|,/).filter(s => s.trim().length > 3).length} URLS`}</button>
      {scanning && <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner size={32} /></div>}
      {results.length > 0 && <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map((r, i) => {
          const c = RISK_CFG[r.risk] || RISK_CFG.SAFE;
          return (
            <div key={i} style={{ background: "#0d0d1e", border: `1px solid ${c.color}33`, borderRadius: 8, padding: "12px 16px", animation: `fadeIn .2s ease forwards`, animationDelay: `${i * .05}s`, opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: "#8899bb", wordBreak: "break-all" }}>{r.url}</span>
                <Tag color={c.color}>{r.risk}</Tag>
              </div>
              <ScoreBar score={r.score} risk={r.risk} />
            </div>
          );
        })}
      </div>}
    </div>
  );
}
