import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Label, btnStyle, InfoBox, Tag } from "../shared/UI";
import { getRiskColor } from "../../data/constants";
import { useAnalyst } from "../../contexts/AnalystContext";

const formatLogLine = entry =>
  `[${new Date(entry.timestamp).toISOString()}] ${entry.type.toUpperCase()} ${entry.domain || entry.summary || "detail"} risk=${entry.risk} score=${entry.score ?? "n/a"}`;

const copyText = async text => {
  if (typeof navigator !== "undefined" && typeof window !== "undefined" && window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path below.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
};

export function CLIIntegration() {
  const { history, pinned, togglePin, cases } = useAnalyst();
  const latest = history[0];
  const pinnedState = pinned.includes("cli-log");
  const [copied, setCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const copyTimers = useRef({ log: null, command: null });

  const logLine = latest ? formatLogLine(latest) : "No scans yet";
  const exportPayload = useMemo(
    () =>
      JSON.stringify(
        {
          history: history.slice(0, 5),
          cases: cases.slice(0, 5)
        },
        null,
        2
      ),
    [history, cases]
  );
  const CLI_COMMAND = "./launch-circadian.sh --scan-log circadian-cli-log.json";

  useEffect(() => () => {
    Object.values(copyTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
  }, []);

  const triggerCopyFeedback = (key, setter) => {
    setter(true);
    if (copyTimers.current[key]) clearTimeout(copyTimers.current[key]);
    copyTimers.current[key] = setTimeout(() => setter(false), 1400);
  };

  const copyLog = async () => {
    if (await copyText(logLine)) triggerCopyFeedback("log", setCopied);
  };

  const copyCommand = async () => {
    if (await copyText(CLI_COMMAND)) triggerCopyFeedback("command", setCommandCopied);
  };

  const downloadJson = () => {
    const blob = new Blob([exportPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "circadian-cli-log.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="pg-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <Tag color={latest ? getRiskColor(latest.risk) : "#667"}>
            {latest ? latest.risk : "PENDING"}
          </Tag>
          <span style={{ fontSize: 11, color: "#445" }}>Latest CLI log</span>
        </div>
        <pre style={{ marginTop: 8, fontSize: 11, color: "#dde", overflowX: "auto", whiteSpace: "pre-wrap", fontFamily: "Share Tech Mono, monospace" }}>
          {logLine}
        </pre>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" style={btnStyle(copied ? "#22aaff" : "#00ff88")} onClick={copyLog}>
          {copied ? "Copied" : "Copy CLI log"}
        </button>
        <button type="button" style={btnStyle("#6644ff")} onClick={downloadJson}>Download JSON export</button>
      </div>

      <InfoBox color="#22aaff" style={{ marginTop: 12 }}>
        <div className="pg-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12 }}>
            Run <code>{CLI_COMMAND}</code> on Kali to ingest the latest scan log and analyst case queue.
          </div>
          <button type="button" style={btnStyle(commandCopied ? "#00ff88" : "#22aaff")} onClick={copyCommand}>
            {commandCopied ? "Runner copied" : "Copy runner"}
          </button>
        </div>
      </InfoBox>
    </Card>
  );
}
