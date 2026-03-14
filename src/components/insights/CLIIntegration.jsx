import React, { useMemo } from "react";
import { Card, Label, btnStyle, InfoBox, Tag } from "../shared/UI";
import { useAnalyst } from "../../contexts/AnalystContext";

const formatLogLine = entry =>
  `[${new Date(entry.timestamp).toISOString()}] ${entry.type.toUpperCase()} ${entry.domain || entry.summary || "detail"} risk=${entry.risk} score=${entry.score ?? "n/a"}`;

export function CLIIntegration() {
  const { history, pinned, togglePin } = useAnalyst();
  const latest = history[0];
  const pinnedState = pinned.includes("cli-log");

  const logLine = latest ? formatLogLine(latest) : "No scans yet";
  const exportPayload = useMemo(() => JSON.stringify({ history: history.slice(0, 5) }, null, 2), [history]);

  const copyLog = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(logLine);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([exportPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "phishguard-cli-log.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Label>CLI Bridge</Label>
          <div style={{ fontSize: 12, color: "#667" }}>Export logs or trigger terminal flows</div>
        </div>
        <button style={btnStyle(pinnedState ? "#6644ff" : "#1a1a30")} onClick={() => togglePin("cli-log")}>
          {pinnedState ? "Pinned" : "Pin CLI"}
        </button>
      </div>

      <div style={{ marginTop: 12, borderRadius: 8, background: "#070712", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tag color={latest ? (latest.risk === "SAFE" ? "#00ff88" : latest.risk === "DANGER" ? "#ff3355" : "#ffcc00") : "#667"}>{latest ? latest.risk : "PENDING"}</Tag>
          <span style={{ fontSize: 11, color: "#445" }}>Latest CLI log</span>
        </div>
        <pre style={{ marginTop: 8, fontSize: 11, color: "#dde", overflowX: "auto", whiteSpace: "pre-wrap", fontFamily: "Share Tech Mono, monospace" }}>
          {logLine}
        </pre>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button style={btnStyle("#00ff88")} onClick={copyLog}>Copy CLI log</button>
        <button style={btnStyle("#6644ff")} onClick={downloadJson}>Download JSON export</button>
      </div>

      <InfoBox color="#22aaff" style={{ marginTop: 12 }}>
        Run <code>./launch-phishguard.sh --scan-log phishguard-cli-log.json</code> on Kali to let the shell ingest the exported JSON.
      </InfoBox>
    </Card>
  );
}
