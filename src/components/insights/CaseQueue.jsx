import React from "react";
import { Card, Label, Tag, InfoBox, btnStyle, useTheme } from "../shared/UI";
import { useAnalyst } from "../../contexts/AnalystContext";
import { Icon } from "../shared/Icon";

const STATUS_META = {
  new: { label: "New", color: "#ff3355" },
  investigating: { label: "Investigating", color: "#ffcc00" },
  contained: { label: "Contained", color: "#22aaff" },
  closed: { label: "Closed", color: "#00ff88" }
};

const PRIORITY_COLOR = {
  P1: "#ff3355",
  P2: "#ff7a45",
  P3: "#ffcc00",
  P4: "#00ff88"
};

const TYPE_META = {
  url: { label: "URL Scanner", icon: "search" },
  email: { label: "Email Analyzer", icon: "mail" },
  attachment: { label: "Attachment", icon: "paperclip" },
  qr: { label: "QR Scanner", icon: "smartphone" },
  bulk: { label: "Bulk Scanner", icon: "package" },
  scan: { label: "General Scan", icon: "radar" }
};

const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 };

const trimLine = (value, max = 84) => {
  const line = String(value || "").trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
};

const timeAgo = ts => {
  if (!ts) return "just now";
  const delta = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
};

const statusButtonStyle = (active, dark, color) => ({
  background: active ? `${color}22` : dark ? "#0b0d18" : "#f5f6fc",
  border: `1px solid ${active ? color : dark ? "#222844" : "#d7dff4"}`,
  borderRadius: 999,
  padding: "7px 12px",
  color: active ? color : dark ? "#9aa6c7" : "#526080",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  cursor: "pointer",
  transition: "all .2s"
});

const inputStyle = dark => ({
  width: "100%",
  background: dark ? "#0a0a18" : "#f5f6fc",
  border: `1px solid ${dark ? "#1a1a30" : "#dde0f0"}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: dark ? "#d7deef" : "#1a1a38",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box"
});

const getRiskColor = risk => (risk === "DANGER" ? "#ff3355" : risk === "SUSPICIOUS" ? "#ffcc00" : "#00ff88");

export function CaseQueue() {
  const { dark, isMobile } = useTheme();
  const { history, cases, pinned, togglePin, promoteToCase, updateCase, caseStats, findCaseForEntry } = useAnalyst();
  const pinnedState = pinned.includes("caseboard");

  const recentSignals = history.slice(0, 5);
  const activeCases = [...cases]
    .filter(item => item.status !== "closed")
    .sort((a, b) => {
      const priorityDelta = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      return priorityDelta || (b.updatedAt || 0) - (a.updatedAt || 0);
    })
    .slice(0, 6);

  return (
    <Card>
      <div className="pg-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <Label>Analyst Caseboard</Label>
          <div style={{ fontSize: 12, color: dark ? "#94a2c5" : "#526080", maxWidth: 680 }}>
            DANGER scans auto-open cases, and analysts can promote anything else into the queue for ownership, notes, and containment tracking.
          </div>
        </div>
        <button type="button" style={btnStyle(pinnedState ? "#6644ff" : "#1a1a30")} onClick={() => togglePin("caseboard")}>
          {pinnedState ? "Pinned" : "Pin board"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 18 }}>
        {[
          { label: "Open cases", value: caseStats.active, color: "#ff3355" },
          { label: "Awaiting triage", value: caseStats.new, color: "#ffcc00" },
          { label: "Contained", value: caseStats.contained, color: "#22aaff" },
          { label: "Closed", value: caseStats.closed, color: "#00ff88" }
        ].map(item => (
          <div key={item.label} style={{ padding: "14px 16px", borderRadius: 12, background: dark ? "#0c101c" : "#ffffff", border: `1px solid ${dark ? "#1f2740" : "#d7dff4"}` }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: dark ? "#667" : "#8b94b1", marginBottom: 8 }}>{item.label.toUpperCase()}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.92fr 1.08fr", gap: 18, marginTop: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: dark ? "#667" : "#8b94b1" }}>Recent Signals</div>
          {recentSignals.length === 0 && (
            <InfoBox color="#22aaff">
              Run a few scans and the queue will start surfacing signals you can promote into cases.
            </InfoBox>
          )}
          {recentSignals.map(entry => {
            const linkedCase = findCaseForEntry(entry);
            const typeMeta = TYPE_META[entry.type] || TYPE_META.scan;
            return (
              <div
                key={entry.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: dark ? "#0a0a14" : "#f8faff",
                  border: `1px solid ${dark ? "#1a1f36" : "#dde0f0"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Icon name={typeMeta.icon} size={14} color={dark ? "#d7deef" : "#1a1a38"} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: dark ? "#eef2ff" : "#1a1a38" }}>{typeMeta.label}</div>
                  </div>
                  <Tag color={getRiskColor(entry.risk)}>{entry.risk}</Tag>
                </div>
                <div style={{ fontSize: 12, color: dark ? "#a9b4cc" : "#526080" }}>{trimLine(entry.summary || entry.domain || entry.filename || "Signal captured")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, color: dark ? "#6677aa" : "#667" }}>
                    Score {entry.score ?? "n/a"} · {timeAgo(entry.timestamp)}
                  </div>
                  {linkedCase ? (
                    <Tag color={STATUS_META[linkedCase.status]?.color || "#22aaff"}>{STATUS_META[linkedCase.status]?.label || "Linked"}</Tag>
                  ) : (
                    <button
                      type="button"
                      style={{ ...btnStyle("#22aaff"), padding: "7px 12px", fontSize: 11 }}
                      onClick={() => promoteToCase(entry)}
                    >
                      Promote to case
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: dark ? "#667" : "#8b94b1" }}>Active Cases</div>
          {activeCases.length === 0 && (
            <InfoBox color="#00ff88">
              No open cases right now. New DANGER findings will appear here automatically.
            </InfoBox>
          )}
          {activeCases.map(item => {
            const typeMeta = TYPE_META[item.type] || TYPE_META.scan;
            const statusMeta = STATUS_META[item.status] || STATUS_META.new;
            return (
              <div
                key={item.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: dark ? "#0a0a16" : "#ffffff",
                  border: `1px solid ${dark ? "#202742" : "#d7dff4"}`,
                  boxShadow: dark ? "0 12px 28px rgba(0,0,0,0.22)" : "0 12px 28px rgba(48,61,102,0.08)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: dark ? "#eef2ff" : "#1a1a38" }}>{trimLine(item.title, 72)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 11, color: dark ? "#6677aa" : "#667", flexWrap: "wrap" }}>
                      <Icon name={typeMeta.icon} size={13} color={dark ? "#99a7cc" : "#526080"} />
                      <span>{typeMeta.label}</span>
                      <span>{item.signalCount} signal{item.signalCount === 1 ? "" : "s"}</span>
                      <span>Updated {timeAgo(item.updatedAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag color={PRIORITY_COLOR[item.priority] || "#ffcc00"}>{item.priority}</Tag>
                    <Tag color={getRiskColor(item.risk)}>{item.risk}</Tag>
                    <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: dark ? "#a9b4cc" : "#526080" }}>
                  {trimLine(item.summary || item.domain || "Signal captured", 132)}
                </div>
                {item.domain && (
                  <div style={{ marginTop: 6, fontSize: 11, color: dark ? "#6677aa" : "#526080" }}>
                    {item.domain}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: dark ? "#667" : "#8b94b1", marginBottom: 8 }}>Workflow</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.entries(STATUS_META).map(([status, meta]) => (
                      <button
                        key={status}
                        type="button"
                        style={statusButtonStyle(item.status === status, dark, meta.color)}
                        onClick={() => updateCase(item.id, { status })}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.8fr 1.2fr", gap: 12, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: dark ? "#667" : "#8b94b1", marginBottom: 6 }}>Owner</div>
                    <input
                      aria-label={`Owner for ${item.title}`}
                      style={inputStyle(dark)}
                      value={item.owner || ""}
                      onChange={e => updateCase(item.id, { owner: e.target.value })}
                      placeholder="SOC Queue"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: dark ? "#667" : "#8b94b1", marginBottom: 6 }}>Notes</div>
                    <textarea
                      aria-label={`Notes for ${item.title}`}
                      style={{ ...inputStyle(dark), minHeight: 78, resize: "vertical", lineHeight: 1.5 }}
                      value={item.notes || ""}
                      onChange={e => updateCase(item.id, { notes: e.target.value })}
                      placeholder="Containment notes, outreach, or next step."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
