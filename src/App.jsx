import React, { useCallback, useState, useEffect, useMemo } from "react";
import { FONTS, MONO, SYNE } from "./data/constants";
import { ThemeCtx, BrandMark, AlertOverlay } from "./components/shared/UI";
import { Icon } from "./components/shared/Icon";
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
import { IntelWorkspace } from "./components/insights/IntelWorkspace";

const GLOBAL_STYLES = `
${FONTS}
:root{
  --pg-btn-wrap: nowrap;
  --pg-btn-letter: 2px;
  --pg-btn-pad-x: 22px;
  --pg-muted-dark: #9aa6c7;
}
html,body,#root{
  margin:0;
  padding:0;
  width:100%;
  min-height:100%;
  background:#05050a;
}
body{overflow-x:hidden;}
body[data-theme="dark"] [style*="color: #445"],
body[data-theme="dark"] [style*="color:#445"],
body[data-theme="dark"] [style*="color: #556"],
body[data-theme="dark"] [style*="color:#556"],
body[data-theme="dark"] [style*="color: #667"],
body[data-theme="dark"] [style*="color:#667"]{
  color: var(--pg-muted-dark) !important;
}
*,*::before,*::after{box-sizing:border-box;}
@keyframes pulse{0%,100%{transform:scale(.85);opacity:.6}50%{transform:scale(1.2);opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes blipPulse{0%{transform:scale(.7);opacity:.7}50%{transform:scale(1.3);opacity:1}100%{transform:scale(.7);opacity:.7}}
@keyframes splashIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes splashOut{from{opacity:1}to{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes borderFlash{0%,100%{opacity:.38}50%{opacity:1}}
@keyframes scannerV{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
@keyframes bgFlash{0%,100%{opacity:.12}50%{opacity:.36}}
:focus-visible{
  outline:2px solid #22aaff;
  outline-offset:3px;
}
.pg-skip-link{
  position:fixed;
  top:12px;
  left:12px;
  transform:translateY(-140%);
  padding:10px 14px;
  border-radius:999px;
  background:#ffffff;
  color:#11162a;
  font-family:${SYNE};
  font-size:12px;
  font-weight:800;
  letter-spacing:1px;
  text-decoration:none;
  z-index:10001;
  transition:transform .2s ease;
}
.pg-skip-link:focus{
  transform:translateY(0);
}
@media (max-width: 900px){
  :root{
    --pg-btn-wrap: normal;
    --pg-btn-letter: 1px;
    --pg-btn-pad-x: 16px;
  }
  .pg-row{
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .pg-row > *{
    width: 100% !important;
    max-width: 100% !important;
  }
  .pg-grid-2{
    grid-template-columns: 1fr !important;
  }
}
`;

const NAV = [
  {
    group: "Detection",
    items: [
      { id: "url", icon: "search", label: "URL Scanner" },
      { id: "email", icon: "mail", label: "Email Analyzer" },
      { id: "qr", icon: "smartphone", label: "QR Scanner" },
      { id: "attach", icon: "paperclip", label: "Attachment Scorer" },
      { id: "homo", icon: "type", label: "Homoglyph Detector" },
      { id: "bulk", icon: "package", label: "Bulk Scanner" }
    ]
  },
  {
    group: "Training",
    items: [
      { id: "quiz", icon: "graduation-cap", label: "Awareness Quiz" },
      { id: "drills", icon: "target", label: "Scenario Drills" }
    ]
  },
  {
    group: "Insights",
    items: [
      { id: "insights", icon: "radar", label: "SOC Surface" },
      { id: "intel", icon: "brain", label: "Intel Lab" }
    ]
  },
  {
    group: "Admin",
    items: [
      { id: "blocklist", icon: "shield", label: "Blocklist Manager" }
    ]
  }
];

const HERO_POINTS = [
  {
    title: "Detect phishing links",
    description:
      "Use the built-in link safety checker to inspect redirects, spoofing patterns, typosquatting, and risky protocols before someone clicks."
  },
  {
    title: "Check suspicious emails",
    description:
      "Review sender signals, urgency language, embedded URLs, and common email scam patterns from a single phishing analysis workspace."
  },
  {
    title: "Scan QR codes and attachments",
    description:
      "Uncover QR phishing traps, dangerous file names, and risky attachment indicators without leaving the browser."
  }
];

const HOW_IT_WORKS = [
  "Paste a suspicious link, email, QR code, or filename into the matching scanner.",
  "Circadian by PhishGuard scores the sample and highlights phishing indicators such as spoofing, shorteners, urgency language, and risky file types.",
  "Review the safety verdict, analyst context, and training modules to decide whether to block, report, or escalate."
];

function AppShell() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("url");
  const [alert, setAlert] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 900 : false));
  const [showSplash, setShowSplash] = useState(true);
  const { addEntry } = useAnalyst();

  const sidebarWidth = 300;
  const contentPadding = isMobile ? "92px 16px 60px" : "60px 40px";
  const heroTitleSize = isMobile ? 28 : 48;
  const heroMarginBottom = isMobile ? 42 : 56;
  const heroUnderlineWidth = isMobile ? 60 : 80;
  const contentGap = isMobile ? 28 : 36;
  const styles = {
    root: {
      minHeight: "100vh",
      background: dark ? "#05050a" : "#f0f2f9",
      color: dark ? "#c8d0e0" : "#1a1a38",
      fontFamily: SYNE,
      transition: "background .3s ease"
    },
    sidebar: {
      width: isMobile ? "82vw" : sidebarWidth,
      maxWidth: isMobile ? 320 : sidebarWidth,
      background: dark ? "#0a0a1a" : "#ffffff",
      borderRight: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`,
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      padding: isMobile ? "24px 18px" : "32px 24px",
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
      padding: contentPadding,
      maxWidth: 1100,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: contentGap,
      justifyContent: "center"
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
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    if (!isMobile) {
      setShowSplash(false);
      return;
    }
    setShowSplash(true);
    const t = setTimeout(() => setShowSplash(false), 650);
    return () => clearTimeout(t);
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
  const currentLabel = NAV.flatMap(group => group.items).find(item => item.id === tab)?.label || "Circadian";
  const productTitle = "Circadian by PhishGuard - 24-Hour Phishing Detection Tool";

  const themeValue = useMemo(() => ({ dark, setDark, isMobile }), [dark, isMobile]);

  return (
    <ThemeCtx.Provider value={themeValue}>
      <style>{GLOBAL_STYLES}</style>
      <a href="#main-content" className="pg-skip-link">Skip to main content</a>
      <div style={styles.root}>
        {showSplash && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle at 30% 20%, #1a0b16 0%, #0a0712 45%, #05050a 100%)",
              animation: "splashIn .25s ease-out"
            }}
          >
            <BrandMark size={120} />
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <div style={{ fontWeight: 950, fontSize: 24, letterSpacing: 3, color: "#fff", lineHeight: 1 }}>CIRCADIAN</div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#ff3355", fontWeight: 900, marginTop: 6 }}>BY PHISHGUARD</div>
            </div>
          </div>
        )}
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
              <div style={{ fontWeight: 950, fontSize: 24, letterSpacing: 2, color: dark ? "#fff" : "#1a1a38", lineHeight: 1 }}>CIRCADIAN</div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#ff3355", fontWeight: 900, marginTop: 6 }}>BY PHISHGUARD</div>
            </div>
          </div>

          <nav aria-label="Primary modules" style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {NAV.map(group => (
              <div key={group.group}>
                <div style={styles.navGroup}>{group.group}</div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    style={{ ...styles.navItem(tab === item.id), width: "100%", textAlign: "left", appearance: "none" }}
                    onClick={() => setTab(item.id)}
                    aria-current={tab === item.id ? "page" : undefined}
                  >
                    <span style={{ display: "inline-flex", color: tab === item.id ? "#ff3355" : dark ? "#667" : "#889" }}>
                      <Icon name={item.icon} size={19} />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${dark ? "#1a1a38" : "#f0f2f9"}` }}>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={dark}
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
              <Icon name={dark ? "moon" : "sun"} size={16} />
              {dark ? "SWITCH TO LIGHT" : "SWITCH TO DARK"}
            </button>
          </div>
        </div>

        <main style={styles.content} role="main" id="main-content">
          {isMobile && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 62, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: dark ? "#0a0a14" : "#ffffff", borderBottom: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`, zIndex: 110 }}>
              <button type="button" aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"} onClick={() => setSidebarOpen(v => !v)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: dark ? "#fff" : "#1a1a38", fontWeight: 700 }}>
                <Icon name="menu" size={18} color={dark ? "#fff" : "#1a1a38"} />
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, color: dark ? "#fff" : "#1a1a38" }}>CIRCADIAN</div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#ff3355" }}>{currentGroup}</div>
              </div>
              <button type="button" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark} onClick={() => setDark(v => !v)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: dark ? "#fff" : "#1a1a38", fontWeight: 700 }}>
                <Icon name={dark ? "sun" : "moon"} size={18} color={dark ? "#fff" : "#1a1a38"} />
              </button>
            </div>
          )}
          <div style={{ paddingTop: isMobile ? 72 : 0 }}>
          <header style={{ marginBottom: heroMarginBottom }}>
              <div style={{ fontSize: 12, color: "#ff3355", fontWeight: 900, letterSpacing: 5, marginBottom: 12, textTransform: "uppercase" }}>
                24-Hour Threat Analysis Workspace
              </div>
              <h1 style={{ fontSize: heroTitleSize, fontWeight: 950, marginBottom: 16, letterSpacing: -2, color: dark ? "#fff" : "#1a1a38", maxWidth: 780 }}>{productTitle}</h1>
              <p style={{ margin: "0 0 18px", maxWidth: 760, lineHeight: 1.75, color: dark ? "#a9b4cc" : "#4a5578", fontSize: isMobile ? 15 : 16 }}>
                Circadian by PhishGuard helps teams detect phishing links, analyze suspicious emails, scan QR codes, and review risky attachments from one browser-based security workspace.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap", maxWidth: "100%", padding: "10px 14px", borderRadius: 999, border: `1px solid ${dark ? "#2a2a50" : "#dde0f0"}`, background: dark ? "rgba(255,255,255,0.02)" : "#ffffff", color: dark ? "#dfe5f4" : "#2a3154", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
                <span style={{ color: "#ff3355" }}>Active Module</span>
                <span>{currentGroup}</span>
                <span style={{ color: dark ? "#58627f" : "#8b94b1" }}>/</span>
                <span>{currentLabel}</span>
              </div>
              <div style={{ height: 4, width: heroUnderlineWidth, background: "#ff3355", borderRadius: 2 }} />
            </header>

            {tab === "url" && (
              <section
                aria-label="Circadian overview"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  marginBottom: 30
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16
                  }}
                >
                  {HERO_POINTS.map(point => (
                    <article
                      key={point.title}
                      style={{
                        padding: "18px 18px 20px",
                        borderRadius: 18,
                        border: `1px solid ${dark ? "#1f2740" : "#d7dff4"}`,
                        background: dark ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" : "linear-gradient(180deg, #ffffff, #f6f8ff)",
                        boxShadow: dark ? "0 10px 30px rgba(0,0,0,0.22)" : "0 12px 28px rgba(48,61,102,0.08)"
                      }}
                    >
                      <h2 style={{ margin: "0 0 10px", fontSize: 18, color: dark ? "#fff" : "#1a1a38" }}>{point.title}</h2>
                      <p style={{ margin: 0, lineHeight: 1.7, color: dark ? "#9fadca" : "#526080", fontSize: 14 }}>{point.description}</p>
                    </article>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 18
                  }}
                >
                  <section
                    style={{
                      padding: "20px 22px",
                      borderRadius: 18,
                      border: `1px solid ${dark ? "#1f2740" : "#d7dff4"}`,
                      background: dark ? "#0c101c" : "#ffffff"
                    }}
                  >
                    <h2 style={{ margin: "0 0 12px", fontSize: 18, color: dark ? "#fff" : "#1a1a38" }}>How it works</h2>
                    <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: dark ? "#a9b4cc" : "#526080", fontSize: 14 }}>
                      {HOW_IT_WORKS.map(step => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </section>

                  <section
                    style={{
                      padding: "20px 22px",
                      borderRadius: 18,
                      border: `1px solid ${dark ? "#1f2740" : "#d7dff4"}`,
                      background: dark ? "#0c101c" : "#ffffff"
                    }}
                  >
                    <h2 style={{ margin: "0 0 12px", fontSize: 18, color: dark ? "#fff" : "#1a1a38" }}>Why teams use it</h2>
                    <p style={{ margin: 0, lineHeight: 1.8, color: dark ? "#a9b4cc" : "#526080", fontSize: 14 }}>
                      Circadian by PhishGuard acts as a phishing detection tool, email scam checker, and link safety checker for analysts, IT teams, and awareness programs that need around-the-clock visibility into suspicious activity.
                    </p>
                  </section>
                </div>
              </section>
            )}

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
              {tab === "intel" && <IntelWorkspace />}
              {tab === "blocklist" && <BlocklistManager />}
            </div>
          </div>
        </main>
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
