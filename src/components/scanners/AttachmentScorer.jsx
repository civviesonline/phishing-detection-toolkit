import React, { useState } from "react";
import { useTheme, Card, Label, TrafficLight, ScoreBar, Tag, Flag, btnStyle } from "../shared/UI";
import { MONO, RISK_CFG, getRiskColor } from "../../data/constants";
import { analyzeAttachment, playSound } from "../../utils/analysis";
import { gateLocalVerdict } from "../../utils/liveVerification";

export function AttachmentScorer({ onTrigger }) {
  const { dark } = useTheme();
  const [file, setFile] = useState(""), [res, setRes] = useState(null);
  const scan = async () => {
    if (!file.trim()) return;
    const r = await gateLocalVerdict(() => analyzeAttachment(file.trim()), "attachment analysis");
    setRes(r);
    onTrigger?.({
      type: "attachment",
      risk: r.risk,
      score: r.score,
      summary: r.flags?.[0] || `File ${file}`,
      detail: r,
      filename: file.trim()
    });
    playSound(r.risk);
  };
  return (
    <div>
      <Label>Analyze suspicious filenames or attachments</Label>
      <div className="pg-row" style={{ display: "flex", gap: 10 }}>
        <input style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 6, padding: "12px 16px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: MONO, fontSize: 13, outline: "none" }} placeholder="invoice_392.pdf.exe" value={file} onChange={e => { setFile(e.target.value); setRes(null); }} onKeyDown={e => e.key === "Enter" && scan()} />
        <button style={btnStyle("#ff3355")} onClick={scan}>SCORE FILE</button>
      </div>
      {res && <div style={{ animation: "fadeIn .3s ease" }}>
        <Card border={(RISK_CFG[res.risk] || RISK_CFG.UNVERIFIED).color + "55"} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <TrafficLight risk={res.risk} />
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: MONO, color: "#445", fontSize: 10, letterSpacing: 2 }}>LAST EXTENSION</div><Tag color={getRiskColor(res.risk)}>.{res.lastExt || "none"}</Tag></div>
          </div>
          <ScoreBar score={res.score} risk={res.risk} />
          {res.verification?.summary && <div style={{ marginTop: 10, fontSize: 12, color: "#6677aa" }}>{res.verification.summary}</div>}
          {res.flags.length > 0 && <div style={{ marginTop: 18 }}><Label>File Indicators</Label>{res.flags.map((f, i) => <Flag key={i} f={f} />)}</div>}
        </Card>
      </div>}
      <Card style={{ marginTop: 18 }}>
        <Label>Common Malicious Patterns</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["payment_overdue.zip", "URGENT_INVOICE.docm", "shipping_label.pdf.js", "CEO_Message.hta", "bonus_details.exe", "bank_statement   .scr"].map(ex => (
            <button key={ex} onClick={() => { setFile(ex); setRes(null); }} style={{ background: "none", border: "1px solid #1a1a30", borderRadius: 4, padding: "6px 12px", color: "#556", fontSize: 11, cursor: "pointer", fontFamily: MONO }}>{ex}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}
