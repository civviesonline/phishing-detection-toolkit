import React from "react";
import { Card, Label, Tag, InfoBox, btnStyle, useTheme } from "../shared/UI";
import { MONO } from "../../data/constants";

export function IOCInspector({ ioc, enrichment }) {
  const { dark } = useTheme();

  if (!ioc) {
    return <InfoBox color="#22aaff">Loading IOC details...</InfoBox>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <Label>IOC Summary</Label>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "#889" }}>{ioc.type.toUpperCase()}</div>
          <Tag color="#00ff88">CONF {ioc.confidence}%</Tag>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: dark ? "#dde" : "#1a1a38", wordBreak: "break-all" }}>
          {ioc.value}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ padding: "10px", border: "1px solid #1a1a30", borderRadius: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#556" }}>FIRST SEEN</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>{ioc.first_seen}</div>
          </div>
          <div style={{ padding: "10px", border: "1px solid #1a1a30", borderRadius: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#556" }}>LAST SEEN</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>{ioc.last_seen}</div>
          </div>
        </div>
      </Card>

      <Card>
        <Label>Sources</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ioc.sources?.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 6, border: "1px solid #1a1a30" }}>
              <div style={{ fontSize: 11, color: "#dde" }}>{s.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: "#8899bb" }}>{s.at}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Related IOCs</Label>
        {ioc.related_iocs?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ioc.related_iocs.map((rel, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 6, border: "1px solid #1a1a30" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>{rel.value}</span>
                <Tag color="#22aaff">{rel.type.toUpperCase()}</Tag>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#667" }}>No related indicators yet.</div>
        )}
      </Card>

      <Card>
        <Label>Enrichment</Label>
        {!enrichment && <InfoBox color="#22aaff">Fetching enrichment...</InfoBox>}
        {enrichment && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px", border: "1px solid #1a1a30", borderRadius: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#556", marginBottom: 6 }}>LIVE DNS</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>{enrichment.dns?.detail || "n/a"}</div>
              {enrichment.dns?.addresses?.length > 0 && (
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb", marginTop: 4 }}>{enrichment.dns.addresses.join(" · ")}</div>
              )}
            </div>
            <div style={{ padding: "10px", border: "1px solid #1a1a30", borderRadius: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#556", marginBottom: 6 }}>SEARCH CORROBORATION</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>Readable sources: {enrichment.search?.matches || 0}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>Negative hits: {(enrichment.search?.negative_hits || []).join(", ") || "none"}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>Positive hints: {(enrichment.search?.positive_hits || []).join(", ") || "none"}</div>
            </div>
            <div style={{ padding: "10px", border: "1px solid #1a1a30", borderRadius: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#556", marginBottom: 6 }}>LIVE PAGE</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb" }}>{enrichment.page?.detail || "n/a"}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#8899bb", marginTop: 4 }}>
                Signals: {(enrichment.page?.signals || []).join(", ") || "none"}
              </div>
              {(enrichment.page?.http_targets || []).length > 0 && (
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#ffcc66", marginTop: 4, wordBreak: "break-all" }}>
                  HTTP targets: {enrichment.page.http_targets.join(" · ")}
                </div>
              )}
              {(enrichment.page?.suspicious_targets || []).length > 0 && (
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#ff8899", marginTop: 4, wordBreak: "break-all" }}>
                  Suspicious hosts: {enrichment.page.suspicious_targets.join(" · ")}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#6677aa" }}>{enrichment.summary}</div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={btnStyle("#ff3355")}>Add to Blocklist</button>
        <button style={btnStyle("#00ff88")}>Allowlist</button>
        <button style={btnStyle("#6644ff")}>Create Case</button>
      </div>
    </div>
  );
}
