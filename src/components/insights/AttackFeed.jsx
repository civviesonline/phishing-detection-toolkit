import React, { useEffect, useState } from "react";
import { Card, Label, Tag } from "../shared/UI";

const LIVE_FEED = [
  { domain: "rapid-auth-update.xyz", tactic: "Credential Harvest", risk: "DANGER", vector: "URL", region: "EU" },
  { domain: "helpdesk-status.live", tactic: "Fake Support", risk: "SUSPICIOUS", vector: "Email", region: "US" },
  { domain: "secure-router-login.io", tactic: "Infrastructure Spoofing", risk: "DANGER", vector: "QR", region: "APAC" },
  { domain: "payroll-alerts.cloud", tactic: "BEC / Invoice Fraud", risk: "SUSPICIOUS", vector: "Email", region: "UK" },
  { domain: "files-share-update.org", tactic: "Malware Attachment", risk: "DANGER", vector: "Attachment", region: "US" },
  { domain: "tracker-gateway.link", tactic: "Shortener Masking", risk: "SUSPICIOUS", vector: "URL", region: "LATAM" }
];

const RISK_COLOR = {
  SAFE: "#00ff88",
  SUSPICIOUS: "#ffcc00",
  DANGER: "#ff3355"
};

const VECTOR_COLOR = {
  URL: "#66b3ff",
  Email: "#ffcd46",
  QR: "#00ff88",
  Attachment: "#ff5c8d"
};

const formatAge = ts => {
  const delta = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
};

const createBlipStyle = (index, color) => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: `2px solid ${color}`,
  position: "absolute",
  top: `${12 + (index * 17) % 66}%`,
  left: `${6 + (index * 23) % 74}%`,
  boxShadow: `0 0 14px ${color}`,
  animation: `blipPulse ${1.6 + (index % 3) * 0.35}s ease-in-out infinite`,
  animationDelay: `${index * 0.1}s`
});

export function AttackFeed() {
  const [events, setEvents] = useState(() =>
    LIVE_FEED.slice(0, 3).map((item, idx) => ({ ...item, id: `seed-${idx}`, ts: Date.now() - idx * 1400 }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const next = LIVE_FEED[Math.floor(Math.random() * LIVE_FEED.length)];
      setEvents(prev => [{ ...next, id: `live-${Date.now()}`, ts: Date.now() }, ...prev].slice(0, 5));
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const blips = events.map((evt, idx) => ({
    id: `blip-${evt.id}`,
    style: createBlipStyle(idx, VECTOR_COLOR[evt.vector] || "#8899bb")
  }));

  const latestAge = events[0] ? formatAge(events[0].ts) : "waiting for intel";

  return (
    <Card style={{ position: "relative", overflow: "hidden", minHeight: 260, borderRadius: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Label>Live Attack Feed</Label>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#889", fontWeight: 600 }}>Streaming threat intelligence with vector context</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Tag color="#00ff88">STREAMING</Tag>
          <Tag color="#8899bb">{latestAge}</Tag>
        </div>
      </div>
      <div style={{ marginTop: 16, position: "relative", minHeight: 220 }}>
        <div style={{ position: "absolute", inset: 8, pointerEvents: "none" }}>
          {blips.map(blip => (
            <span key={blip.id} style={blip.style} aria-hidden />
          ))}
          <div style={{ position: "absolute", inset: "10% 10% 12% 10%", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          {events.map(evt => {
            const vectorColor = VECTOR_COLOR[evt.vector] || "#8899bb";
            return (
              <div
                key={evt.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, letterSpacing: 0.6, color: "#dde" }}>{evt.domain}</div>
                    <div style={{ fontSize: 11, color: "#667", letterSpacing: 1 }}>{evt.region}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Tag color={vectorColor}>{evt.vector}</Tag>
                    <Tag color={RISK_COLOR[evt.risk]}>{evt.risk}</Tag>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "#889", textTransform: "uppercase", letterSpacing: 1.5 }}>{evt.tactic}</div>
                  <span style={{ fontSize: 10, color: "#556" }}>{formatAge(evt.ts)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
