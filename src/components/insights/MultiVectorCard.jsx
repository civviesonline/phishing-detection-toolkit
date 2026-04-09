import React from "react";
import { Card, Label, Tag, btnStyle } from "../shared/UI";
import { RISK_ORDER, getRiskColor } from "../../data/constants";
import { useAnalyst } from "../../contexts/AnalystContext";
import { Icon } from "../shared/Icon";

const TYPE_META = {
  url: { label: "URL Scanner", icon: "search" },
  email: { label: "Email Analyzer", icon: "mail" },
  attachment: { label: "Attachment Scorer", icon: "paperclip" },
  qr: { label: "QR Scanner", icon: "smartphone" }
};

const ACTIONS = {
  DANGER: ["Quarantine user endpoint", "Block spoofed domain", "Refresh MFA on impacted accounts"],
  SUSPICIOUS: ["Monitor traffic for lateral movement", "Capture email headers for analysis"],
  SAFE: ["Log this vector for auditing"],
  UNVERIFIED: ["Reconnect live verification", "Review source links before acting"]
};

const timeAgo = ts => {
  if (!ts) return "just now";
  const delta = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
};

export function MultiVectorCard() {
  const { history, pinned, togglePin } = useAnalyst();
  const vectorTimeline = history
    .filter(item => TYPE_META[item.type])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  const aggregatedScore = vectorTimeline.length
    ? Math.round(vectorTimeline.reduce((sum, item) => sum + (item.score || 0), 0) / vectorTimeline.length)
    : 14;
  const aggregatedRisk = vectorTimeline.reduce(
    (acc, item) => (RISK_ORDER[item.risk] > RISK_ORDER[acc] ? item.risk : acc),
    "UNVERIFIED"
  );
  const aggregatedColor = getRiskColor(aggregatedRisk);
  const actions = ACTIONS[aggregatedRisk];
  const pinnedState = pinned.includes("incident-card");

  return (
    <Card style={{ position: "relative" }}>
      <div className="pg-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Incident Correlation</Label>
        <button
          style={btnStyle(pinnedState ? "#6644ff" : "#1a1a30")}
          onClick={() => togglePin("incident-card")}
        >
          {pinnedState ? "Pinned" : "Pin card"}
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, color: "#8899bb" }}>Consolidated threat score</div>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, color: aggregatedColor }}>{aggregatedScore}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 140 }}>
          <div style={{ fontSize: 12, color: "#667" }}>Multi-vector timeline</div>
          <Tag color={aggregatedColor}>{aggregatedRisk}</Tag>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 16, paddingLeft: 30 }}>
        <div style={{ position: "absolute", left: 14, top: 14, bottom: 12, width: 2, background: `${aggregatedColor}33`, borderRadius: 4 }} />
        {vectorTimeline.length === 0 && (
          <div style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 11, color: "#667" }}>No correlated incidents yet. Run scanners to populate the timeline.</div>
          </div>
        )}
        {vectorTimeline.map(entry => (
          <div key={entry.id} style={{ display: "flex", gap: 12, padding: "10px 10px 12px", marginBottom: 12, position: "relative", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 20px rgba(0,0,0,0.25)" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${aggregatedColor}`, marginTop: 6 }} aria-hidden />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dde", display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon name={TYPE_META[entry.type]?.icon} size={14} color="#dde" />
                  {TYPE_META[entry.type]?.label}
                </div>
                <Tag color={getRiskColor(entry.risk)}>{entry.risk}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "#8899bb" }}>{entry.summary || entry.domain || "Details logged in history"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#556" }}>
                <span>Score {entry.score ?? "n/a"}/100</span>
                <span>{timeAgo(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 6 }}>Recommended next steps</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {actions.map(action => (
            <Tag key={action} color="#8899bb" style={{ borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
              {action}
            </Tag>
          ))}
        </div>
      </div>
    </Card>
  );
}
