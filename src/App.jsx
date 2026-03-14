import React, { useCallback, useState, useEffect } from "react";
import { FONTS, MONO, SYNE } from "./data/constants";
import { ThemeCtx, BrandMark, AlertOverlay } from "./components/shared/UI";
import { URLScanner } from "./components/scanners/URLScanner";
import { EmailAnalyzer } from "./components/scanners/EmailAnalyzer";
import { QRScanner } from "./components/scanners/QRScanner";
import { AttachmentScorer } from "./components/scanners/AttachmentScorer";
import { HomoglyphDetector } from "./components/scanners/HomoglyphDetector";
import { BulkScanner } from "./components/scanners/BulkScanner";
import { AwarenessQuiz } from "./components/training/AwarenessQuiz";
import { ScenarioDrills } from "./components/training/ScenarioDrills";
import { BlocklistManager } from "./components/shared/BlocklistManager";
import { AnalystProvider, useAnalyst } from "./contexts/AnalystContext";
import { AttackFeed } from "./components/insights/AttackFeed";
import { MultiVectorCard } from "./components/insights/MultiVectorCard";
import { AnalystDashboard } from "./components/insights/AnalystDashboard";
import { CLIIntegration } from "./components/insights/CLIIntegration";

const GLOBAL_STYLES = `
${FONTS}
@keyframes pulse{0%,100%{transform:scale(.85);opacity:.6}50%{transform:scale(1.2);opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
`;

const NAV = [
  {
    group: "Detection",
    items: [
      { id: "url", icon: "🔍", label: "URL Scanner" },
      { id: "email", icon: "✉️", label: "Email Analyzer" },
      { id: "qr", icon: "📱", label: "QR Scanner" },
      { id: "attach", icon: "📎", label: "Attachment Scorer" },
      { id: "homo", icon: "🔤", label: "Homoglyph Detector" },
      { id: "bulk", icon: "📦", label: "Bulk Scanner" }
    ]
  },
  {
    group: "Training",
    items: [
      { id: "quiz", icon: "🎓", label: "Awareness Quiz" },
      { id: "drills", icon: "🎯", label: "Scenario Drills" }
    ]
  },
  {
    group: "Insights",
    items: [
      { id: "insights", icon: "📡", label: "SOC Surface" }
    ]
  },
  {
    group: "Admin",
    items: [
      { id: "blocklist", icon: "🛡️", label: "Blocklist Manager" }
    ]
  }
];

function AppShell() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("url");
  const [alert, setAlert] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { addEntry } = useAnalyst();

  const sidebarWidth = 300;
  const styles = {
    root: {
      minHeight: "100vh",
      background: dark ? "#05050a" : "#f0f2f9",
      color: dark ? "#c8d0e0" : "#1a1a38",
      fontFamily: SYNE,
      transition: "background .3s ease"
    },
    sidebar: {
      width: sidebarWidth,
      background: dark ? "#0a0a1a" : "#ffffff",
      borderRight: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`,
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      padding: "32px 24px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      zIndex: 120,
      boxShadow: dark ? "none" : "4px 0 15px rgba(0,0,0,0.03)",
      transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-105%)") : "none",
      transition: "transform .3s ease"
    },
    content: {
      marginLeft: isMobile ? 0 : sidebarWidth,
      padding: isMobile ? "100px 20px 60px" : "60px 40px",
      maxWidth: 1100
    },
    navItem: active => ({
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 18px",
      borderRadius: 10,
      cursor: "pointer",
      background: active ? (dark ? "#ff335515" : "#ff335508") : "transparent",
      color: active ? "#ff3355" : dark ? "#667" : "#889",
      marginBottom: 6,
      transition: "all .2s",
      fontFamily: SYNE,
      fontWeight: active ? 800 : 500,
      fontSize: 15,
      border: active ? "1px solid #ff335533" : "1px solid transparent"
    }),
    navGroup: {
      marginTop: 32,
      marginBottom: 12,
      fontSize: 11,
      letterSpacing: 4,
      color: dark ? "#334" : "#bbc",
      fontWeight: 900,
      paddingLeft: 18,
      textTransform: "uppercase"
    }
  };

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 900);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  const trigger = useCallback(
    payload => {
      const meta = {
        type: payload?.type || "scan",
        risk: payload?.risk || "SAFE",
        score: payload?.score ?? 0,
        domain: payload?.domain,
        summary: payload?.summary || payload?.detail?.domain || "",
        detail: payload
      };
      if (meta.risk !== "SAFE") setAlert(meta.risk);
      setIncidents(prev => [{ risk: meta.risk, source: meta.type, ts: Date.now() }, ...prev].slice(0, 100));
      addEntry(meta);
    },
    [addEntry]
  );

  const currentGroup = NAV.find(group => group.items.some(item => item.id === tab))?.group || "Detection";
  const currentLabel = NAV.flatMap(group => group.items).find(item => item.id === tab)?.label || "PhishGuard";

  return (
    <ThemeCtx.Provider value={{ dark, setDark }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={styles.root}>
        <AlertOverlay level={alert} onDismiss={() => setAlert(null)} />
        {isMobile && sidebarOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 115, background: "rgba(0,0,0,.55)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div style={styles.sidebar}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 48 }}>
            <BrandMark size={64} />
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 950, fontSize: 24, letterSpacing: 2, color: dark ? "#fff" : "#1a1a38", lineHeight: 1 }}>PHISHGUARD</div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#ff3355", fontWeight: 900, marginTop: 6 }}>SOC ANALYTICS ENGINE</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {NAV.map(group => (
              <div key={group.group}>
                <div style={styles.navGroup}>{group.group}</div>
                {group.items.map(item => (
                  <div key={item.id} style={styles.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${dark ? "#1a1a38" : "#f0f2f9"}` }}>
            <button
              onClick={() => setDark(!dark)}
              style={{
                width: "100%",
                background: dark ? "#1a1a38" : "#f5f6fc",
                border: `1px solid ${dark ? "#2a2a50" : "#dde0f0"}`,
                borderRadius: 10,
                padding: 14,
                cursor: "pointer",
                color: dark ? "#fff" : "#1a1a38",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                fontFamily: SYNE,
                fontWeight: 700,
                fontSize: 13,
                transition: "all .2s"
              }}
            >
              {dark ? "🌙 SWITCH TO LIGHT" : "☀️ SWITCH TO DARK"}
            </button>
          </div>
        </div>

        <div style={styles.content}>
          {isMobile && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 62, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: dark ? "#0a0a14" : "#ffffff", borderBottom: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`, zIndex: 110 }}>
              <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: dark ? "#fff" : "#1a1a38", fontWeight: 700 }}>
                ☰
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, color: dark ? "#fff" : "#1a1a38" }}>PHISHGUARD</div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#ff3355" }}>{currentGroup}</div>
              </div>
              <button onClick={() => setDark(v => !v)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: dark ? "#fff" : "#1a1a38", fontWeight: 700 }}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          )}
          <div style={{ paddingTop: isMobile ? 72 : 0 }}>
            <header style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 12, color: "#ff3355", fontWeight: 900, letterSpacing: 5, marginBottom: 12, textTransform: "uppercase" }}>
                {currentGroup} // Module
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 950, marginBottom: 12, letterSpacing: -2, color: dark ? "#fff" : "#1a1a38" }}>{currentLabel}</h1>
              <div style={{ height: 4, width: 80, background: "#ff3355", borderRadius: 2 }} />
            </header>

            <div style={{ animation: "fadeIn .4s ease" }}>
              {tab === "url" && <URLScanner onTrigger={trigger} />}
              {tab === "email" && <EmailAnalyzer onTrigger={trigger} />}
              {tab === "qr" && <QRScanner onTrigger={trigger} />}
              {tab === "attach" && <AttachmentScorer onTrigger={trigger} />}
              {tab === "homo" && <HomoglyphDetector onTrigger={trigger} />}
              {tab === "bulk" && <BulkScanner onTrigger={trigger} />}
              {tab === "quiz" && <AwarenessQuiz />}
              {tab === "drills" && <ScenarioDrills />}
              {tab === "insights" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AttackFeed />
                  <MultiVectorCard />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                    <AnalystDashboard />
                    <CLIIntegration />
                  </div>
                </div>
              )}
              {tab === "blocklist" && <BlocklistManager />}
            </div>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

export default function App() {
  return (
    <AnalystProvider>
      <AppShell />
    </AnalystProvider>
  );
}
