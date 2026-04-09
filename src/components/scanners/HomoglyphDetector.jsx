import React, { useState } from "react";
import { useTheme, Card, Label, TrafficLight, ScoreBar, Tag, Flag, btnStyle } from "../shared/UI";
import { MONO, RISK_CFG } from "../../data/constants";
import { analyzeHomoglyph, playSound } from "../../utils/analysis";
import { gateLocalVerdict } from "../../utils/liveVerification";

export function HomoglyphDetector() {
  const { dark } = useTheme();
  const [dom, setDom] = useState(""), [res, setRes] = useState(null);
  const scan = async () => { if (!dom.trim()) return; const r = await gateLocalVerdict(() => analyzeHomoglyph(dom.trim()), "homoglyph analysis"); setRes(r); playSound(r.risk); };
  return (
    <div>
      <Label>Identify Unicode lookalike (IDN homograph) attacks</Label>
      <div className="pg-row" style={{ display: "flex", gap: 10 }}>
        <input style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 6, padding: "12px 16px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: MONO, fontSize: 13, outline: "none" }} placeholder="googIe.com (uses uppercase I)" value={dom} onChange={e => { setDom(e.target.value); setRes(null); }} onKeyDown={e => e.key === "Enter" && scan()} />
        <button style={btnStyle("#6644ff")} onClick={scan}>DETECT HOMOGLYPHS</button>
      </div>
      {res && <div style={{ animation: "fadeIn .3s ease" }}>
        <Card border={(RISK_CFG[res.risk] || RISK_CFG.UNVERIFIED).color + "55"} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <TrafficLight risk={res.risk} />
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: MONO, color: "#445", fontSize: 10, letterSpacing: 2 }}>NORMALIZED</div><Tag color="#22aaff">{res.normalized || "none"}</Tag></div>
          </div>
          <ScoreBar score={res.score} risk={res.risk} />
          {res.verification?.summary && <div style={{ marginTop: 10, fontSize: 12, color: "#6677aa" }}>{res.verification.summary}</div>}
          {res.flags.length > 0 && <div style={{ marginTop: 18 }}><Label>Threat Indicators</Label>{res.flags.map((f, i) => <Flag key={i} f={f} color={res.risk === "DANGER" ? "#ff3355" : "#ffcc00"} />)}</div>}
          {res.glyphsFound?.length > 0 && <div style={{ marginTop: 14 }}><Label>Detected Substitutions</Label><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>{res.glyphsFound.map((g, i) => <div key={i} style={{ padding: "8px", background: "#0d0d1e", border: "1px solid #1a1a30", borderRadius: 4, textAlign: "center", fontSize: 13 }}><span style={{ color: "#ff3355" }}>{g.original}</span> <span style={{ color: "#445" }}>→</span> <span style={{ color: "#00ff88" }}>{g.ascii}</span></div>)}</div></div>}
        </Card>
      </div>}
      <Card style={{ marginTop: 18 }}>
        <Label>Test Examples (Copy/Paste these)</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["аррӏе.com (cyrillic а, р, р, і)", "Gоogle.com (cyrillic о)", "microsoft.com (latin characters)", "pаypаl.com (cyrillic а)", "fасebооk.com (cyrillic а, с, е, о, о)"].map(ex => (
            <div key={ex} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: "#0d0d1e", border: "1px solid #1a1a30", borderRadius: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#8899bb" }}>{ex}</span>
              <button onClick={() => { setDom(ex.split(" ")[0]); setRes(null); }} style={{ background: "none", border: "1px solid #6644ff88", borderRadius: 4, padding: "3px 10px", color: "#6644ff", fontSize: 10, cursor: "pointer", fontFamily: MONO }}>USE</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
