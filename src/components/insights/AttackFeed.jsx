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

const buildPulse = color => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color,
  boxShadow: `0 0 10px ${color}`,
  animation: "pulse 1.1s ease-in-out infinite"
});

export function AttackFeed() {
  const [events, setEvents] = useState(() =>
    LIVE_FEED.slice(0, 3).map((item, idx) => ({ ...item, id: `seed-${idx}`, ts: Date.now() - idx * 1200 }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const next = LIVE_FEED[Math.floor(Math.random() * LIVE_FEED.length)];
      setEvents(prev => [{ ...next, id: `live-${Date.now()}`, ts: Date.now() }, ...prev].slice(0, 4));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Live Attack Feed</Label>
        <Tag color="#00ff88">STREAMING</Tag>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 12, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle, #ff3355 0%, transparent 60%)" }} />
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map(evt => (
            <div key={evt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={buildPulse(RISK_COLOR[evt.risk])} aria-hidden />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 700, color: "#dde", letterSpacing: 0.5 }}>{evt.domain}</span>
                  <span style={{ fontSize: 11, color: "#667", letterSpacing: 1 }}>
                    {evt.vector} · {evt.region} · {evt.tactic}
                  </span>
                </div>
              </div>
              <Tag color={RISK_COLOR[evt.risk]}>{evt.risk}</Tag>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
