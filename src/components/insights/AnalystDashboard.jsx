import React from "react";
import { Card, Label, Tag, InfoBox, btnStyle } from "../shared/UI";
import { useAnalyst } from "../../contexts/AnalystContext";

const WIDGETS = [
  { id: "attack-feed", label: "Live Attack Feed" },
  { id: "incident-card", label: "Incident Card" },
  { id: "dashboard", label: "Analyst Dashboard" },
  { id: "cli-log", label: "CLI Log Bridge" }
];

export function AnalystDashboard() {
  const { history, pinned, recommendations, togglePin } = useAnalyst();
  const totalScans = history.length;
  const dangerCount = history.filter(item => item.risk === "DANGER").length;
  const currentFocus = history[0]?.type?.toUpperCase() ?? "N/A";
  const recentEntries = history.slice(0, 5);
  const lastScan = history[0];
  const lastScanTime = lastScan ? new Date(lastScan.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "never";
  const lastScanContext = lastScan ? `${lastScan.type?.toUpperCase() ?? "SCAN"} · ${lastScan.domain || lastScan.summary || "details"}` : "Awaiting first scan";
  const dangerRatio = totalScans ? Math.round((dangerCount / totalScans) * 100) : 0;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label>Analyst Dashboard</Label>
        <Tag color="#00ff88">{totalScans} scans</Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginTop: 12 }}>
        <div style={{ padding: 12, borderRadius: 10, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#445" }}>Danger hits</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ff3355" }}>{dangerCount}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#445" }}>Current focus</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#00ff88" }}>{currentFocus}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#445" }}>Pinned modules</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ffe066" }}>{pinned.length}</div>
        </div>
      </div>

      <InfoBox color="#22aaff" style={{ marginTop: 12 }}>
        <div>Session history, pinned widgets, and recommendations persist in localStorage for this Kali workstation.</div>
        <div style={{ marginTop: 4, fontSize: 11, color: "#88c8ff" }}>Last sync: {lastScanTime} · {lastScanContext}</div>
        <div style={{ marginTop: 4, fontSize: 11, color: "#88c8ff" }}>{dangerRatio}% of this session's scans were danger-flagged.</div>
      </InfoBox>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#445", marginBottom: 6 }}>Favorite widgets</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {WIDGETS.map(widget => {
            const active = pinned.includes(widget.id);
            return (
              <button
                key={widget.id}
                onClick={() => togglePin(widget.id)}
                style={{ ...btnStyle(active ? "#6644ff" : "#1a1a30"), padding: "6px 16px", fontSize: 11 }}
              >
                {active ? "★" : "☆"} {widget.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#445" }}>Session history</div>
          <Tag color="#ffcc00">{dangerRatio}% danger ratio</Tag>
        </div>
        {recentEntries.length === 0 && <div style={{ fontSize: 11, color: "#667" }}>History syncs after your first scan.</div>}
        {recentEntries.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, background: "#0a0a12", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#dde" }}>{item.type.toUpperCase()} · {item.summary || item.domain || "details"}</div>
            <Tag color={item.risk === "SAFE" ? "#00ff88" : item.risk === "DANGER" ? "#ff3355" : "#ffcc00"}>{item.risk}</Tag>
          </div>
        ))}
        <InfoBox color="#6644ff" style={{ marginTop: 10 }}>
          Session history lives in your browser storage; it stays after reloads while running on this workstation.
        </InfoBox>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#445", marginBottom: 6 }}>Adaptive recommendations</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recommendations.map((item, index) => (
            <div key={item + index} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "#0a0a1a", fontSize: 12, color: "#dde" }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
