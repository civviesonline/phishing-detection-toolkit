import React from "react";
import { Card, Label, Tag, btnStyle } from "../shared/UI";
import { useAnalyst } from "../../contexts/AnalystContext";

const TYPE_META = {
  url: { label: "URL Scanner", icon: "🔍" },
  email: { label: "Email Analyzer", icon: "✉️" },
  attachment: { label: "Attachment Scorer", icon: "📎" },
  qr: { label: "QR Scanner", icon: "📱" }
};

const RISK_ORDER = { SAFE: 0, SUSPICIOUS: 1, DANGER: 2 };
const ACTIONS = {
  DANGER: ["Quarantine user endpoint", "Block spoofed domain", "Refresh MFA on impacted account"],
  SUSPICIOUS: ["Monitor traffic for lateral movement", "Capture email headers for analysis"],
  SAFE: ["No action needed – log for reference"]
};

export function MultiVectorCard() {
  const { history, pinned, togglePin } = useAnalyst();
  const timeline = Object.keys(TYPE_META)
    .map(type => history.find(item => item.type === type))
    .filter(Boolean);

  const aggregatedScore = timeline.length
    ? Math.round(timeline.reduce((sum, item) => sum + (item.score || 0), 0) / timeline.length)
    : 14;
  const aggregatedRisk = timeline.reduce(
    (acc, item) => (RISK_ORDER[item.risk] > RISK_ORDER[acc] ? item.risk : acc),
    "SAFE"
  );

  const actions = ACTIONS[aggregatedRisk];
  const pinnedState = pinned.includes("incident-card");

  return (
    <Card style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Incident Correlation</Label>
        <button
          style={btnStyle(pinnedState ? "#6644ff" : "#1a1a30")}
          onClick={() => togglePin("incident-card")}
        >
          {pinnedState ? "Pinned" : "Pin card"}
        </button>
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, color: "#8899bb" }}>Consolidated threat score</div>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, color: aggregatedRisk === "DANGER" ? "#ff3355" : aggregatedRisk === "SUSPICIOUS" ? "#ffcc00" : "#00ff88" }}>
            {aggregatedScore}
          </div>
        </div>
        <Tag color={aggregatedRisk === "SAFE" ? "#00ff88" : aggregatedRisk === "DANGER" ? "#ff3355" : "#ffcc00"}>
          {aggregatedRisk}
        </Tag>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {timeline.length === 0 && <div style={{ fontSize: 11, color: "#667" }}>No incidents recorded yet.</div>}
        {timeline.map((entry, index) => (
          <div key={entry.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700 }}>{TYPE_META[entry.type]?.icon} {TYPE_META[entry.type]?.label}</span>
            <span style={{ fontSize: 11, color: "#8899bb" }}>{entry.summary || entry.domain || entry.filename || "Details logged"}</span>
            <Tag color={entry.risk === "SAFE" ? "#00ff88" : entry.risk === "DANGER" ? "#ff3355" : "#ffcc00"}>{entry.risk}</Tag>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 6 }}>Recommended next steps</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {actions.map(action => (
            <div key={action} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "#dde" }}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
