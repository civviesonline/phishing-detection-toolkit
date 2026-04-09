import React from "react";
import { Card, Label, Tag, InfoBox, useTheme } from "../shared/UI";
import { MONO, getRiskColor } from "../../data/constants";

export function DetonationChain({ artifacts }) {
  const { dark } = useTheme();

  if (!artifacts) {
    return <InfoBox color="#22aaff">Loading detonation results...</InfoBox>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <Label>Redirect Chain</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {artifacts.redirect_chain?.map((hop, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1a1a30", background: dark ? "#0d0d1e" : "#f8f9ff" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb", wordBreak: "break-all" }}>{hop.url}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <Tag color="#22aaff">{hop.status}</Tag>
                <span style={{ fontSize: 10, color: "#556" }}>{hop.at_ms}ms</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Final Destination</Label>
        <div style={{ fontFamily: MONO, fontSize: 12, color: "#8899bb", wordBreak: "break-all" }}>{artifacts.final_url}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <Tag color={getRiskColor(artifacts.risk)}>{artifacts.risk}</Tag>
          <Tag color="#6644ff">Score {artifacts.score}/100</Tag>
          <Tag color="#8899bb">{artifacts.headers?.source || "source"}</Tag>
        </div>
      </Card>

      <Card>
        <Label>Form Extraction</Label>
        {artifacts.forms?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {artifacts.forms.map((form, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1a1a30" }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb", wordBreak: "break-all" }}>{form.action}</div>
                <div style={{ fontSize: 10, color: "#556", marginTop: 4 }}>Method: {form.method}</div>
                <div style={{ fontSize: 10, color: "#556" }}>Fields: {form.fields.join(", ")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#667" }}>No forms detected.</div>
        )}
      </Card>

      <Card>
        <Label>Fingerprints</Label>
        <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>DOM: {artifacts.fingerprints?.dom_hash}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>TEXT: {artifacts.fingerprints?.text_hash}</div>
      </Card>

      <Card>
        <Label>Screenshot</Label>
        <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid #1a1a30" }}>
          <img src={artifacts.screenshot_url} alt="detonation screenshot" style={{ width: "100%", display: "block" }} />
        </div>
      </Card>

      {artifacts.verification_sources?.length > 0 && (
        <Card>
          <Label>Verification Sources</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {artifacts.verification_sources.map((source, index) => (
              <div key={`${source.label}-${index}`} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1a1a30", background: dark ? "#0d0d1e" : "#f8f9ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 12, color: dark ? "#eef2ff" : "#1a1a38" }}>{source.label}</div>
                  <Tag color={source.ok ? "#00ff88" : "#ffcc00"}>{source.ok ? "OK" : "FAILED"}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#8899bb" }}>{source.detail}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
