import React, { useState, useEffect, useRef } from "react";
import { useTheme, Card, Label, Spinner, ResultCard, btnStyle, InfoBox, ThreatIntelligencePanel, VerificationPanel } from "../shared/UI";
import { SitePreview } from "../shared/SitePreview";
import { MONO, SYNE, CUSTOM_DOMAINS, CUSTOM_KW } from "../../data/constants";
import { playSound } from "../../utils/analysis";
import { submitIOC, getDetonationArtifacts, getEnrichment } from "../../utils/api";
import { analyzeUrlWithInternet, VERIFICATION_REQUIRED_MESSAGE } from "../../utils/liveVerification";
import { IOCInspector } from "../insights/IOCInspector";
import { DetonationChain } from "../insights/DetonationChain";

const SAMPLE_GROUPS = [
  { title: "Requested Domains", urls: [
    "https://rexmfbank.com", "https://itskillscenter.com", "https://mydomihive.com", "https://www.nectahub.com", "https://cvpadi.com"
  ] },
  { title: "Social Media", urls: [
    "https://facebook.com", "https://twitter.com", "https://instagram.com", "https://linkedin.com", "https://youtube.com", "https://reddit.com", "https://tiktok.com", "https://snapchat.com", "https://discord.com", "https://twitch.tv"
  ] },
  { title: "Common Utilities", urls: [
    "https://google.com", "https://microsoft.com", "https://github.com", "https://apple.com", "https://paypal.com", "https://wikipedia.org", "https://amazon.com", "https://netflix.com", "https://spotify.com", "https://zoom.us"
  ] },
  { title: "Malicious Samples", variant: "alert", urls: [
    "http://secure-paypal-verify.xyz/login", "https://amaz0n-account-billing-update.click", "http://bit.ly/win-free-iphone-2024", "https://192.168.1.1/admin"
  ] }
];

const sampleButtonStyle = (dark, variant) => {
  const isAlert = variant === "alert";
  return {
    background: dark ? "#0a0a18" : "#f5f6fc",
    border: `1px solid ${isAlert ? (dark ? "#ff335544" : "#ffcccc") : (dark ? "#1a1a38" : "#dde0f0")}`,
    borderRadius: 4,
    padding: "6px 12px",
    color: isAlert ? "#ff3355" : "#556",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: MONO,
    transition: "all .2s"
  };
};

export function URLScanner({ onTrigger, sound }) {
  const { dark, isMobile } = useTheme();
  const [url, setUrl] = useState(""), [res, setRes] = useState(null), [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const scanTimer = useRef(null);
  const [ioc, setIoc] = useState(null);
  const [enrichment, setEnrichment] = useState(null);
  const [artifacts, setArtifacts] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const inp = { width: "100%", background: dark ? "#0a0a18" : "#f5f6fc", border: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`, borderRadius: 7, padding: "13px 17px", fontFamily: MONO, fontSize: 16, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none", boxSizing: "border-box" };
  const runScan = async value => {
    const target = (value ?? url).trim();
    if (!target) return;
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
    }
    setScanning(true);
    setStatusText("Connecting to live verification sources…");
    setRes(null);
    setDrawer(null);
    if (value !== undefined) setUrl(value);
    try {
      const r = await analyzeUrlWithInternet(target, CUSTOM_DOMAINS, CUSTOM_KW);
      setRes(r);
      setIoc(null);
      setEnrichment(null);
      setArtifacts(null);
      onTrigger?.({ type: "url", risk: r.risk, score: r.score, domain: r.domain, summary: r.flags?.[0] ?? "URL analysis", detail: r });
      playSound(r.risk);
      setStatusText(r.risk === "UNVERIFIED" ? VERIFICATION_REQUIRED_MESSAGE : "Live verification complete.");
      submitIOC({ type: "url", value: target, analysis: r }).then(setIoc);
      getEnrichment({ url: target, analysis: r }).then(setEnrichment);
      getDetonationArtifacts({ url: target, analysis: r }).then(setArtifacts);
    } catch (err) {
      setRes({
        score: 0,
        risk: "UNVERIFIED",
        flags: ["Scan error — unable to collect live verification evidence"],
        domain: target,
        raw: target,
        verification: {
          mode: "internet",
          checkedAt: new Date().toISOString(),
          online: false,
          minimumSourcesMet: false,
          coverage: 0,
          summary: "Circadian could not finish the live verification pass.",
          sources: []
        },
        intelligence: {
          tactic: "Verification Failure",
          intent: "Unknown",
          recommendation: "Retry the scan with internet access and review the live source links before trusting the URL.",
          technicalDetail: String(err?.message || err)
        }
      });
      setStatusText("Live verification failed before Circadian could issue a final verdict.");
    } finally {
      scanTimer.current = setTimeout(() => setScanning(false), 120);
    }
  };
  useEffect(() => () => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
  }, []);
  useEffect(() => { const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runScan(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [url]);
  return (
    <div>
      <Label>Paste any URL to scan for phishing indicators</Label>
      <InfoBox color="#22aaff" style={{ marginTop: 0, marginBottom: 12 }}>
        Circadian now requires live internet checks before it will mark a website `SAFE`, `SUSPICIOUS`, or `DANGER`.
      </InfoBox>
      <div className="pg-row" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
        <input
          style={{ ...inp, flex: 1, minWidth: 0 }}
          aria-label="URL to scan"
          placeholder="https://suspicious-site.xyz/verify..."
          value={url}
          onChange={e => { setUrl(e.target.value); setRes(null); }}
          onKeyDown={e => e.key === "Enter" && runScan()}
        />
        <button type="button" aria-label="Scan URL" style={{ ...btnStyle(), width: isMobile ? "100%" : "auto" }} onClick={() => runScan()}>
          {scanning ? "SCANNING…" : "SCAN URL"}
        </button>
        {url && (
          <button
            type="button"
            aria-label="Clear URL scanner"
            style={{
              ...btnStyle("#1a1a30"),
              boxShadow: "none",
              border: "1px solid #2a2a50",
              width: isMobile ? "100%" : "auto"
            }}
            onClick={() => {
              setUrl("");
              setRes(null);
              setDrawer(null);
              setIoc(null);
              setEnrichment(null);
              setArtifacts(null);
            }}
          >
            CLEAR
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#445", marginTop: 6, letterSpacing: 1 }}>Tip: Press Ctrl+Enter to scan</div>
      {scanning && <Card style={{ marginTop: 16, position: "relative", overflow: "hidden", height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}><div style={{ position: "absolute", left: 0, right: 0, height: 2, backgroundImage: "linear-gradient(90deg,transparent,#22aaff,transparent)", backgroundColor: "#22aaff", backgroundSize: "200% 100%", animation: "shimmer 1s linear infinite" }} /><Spinner color="#22aaff" /><span role="status" aria-live="polite" style={{ fontSize: 12, color: "#445", letterSpacing: 3 }}>{statusText || "VERIFYING WITH LIVE SOURCES..."}</span></Card>}
      {res && <>
        <ResultCard result={res} />
        <ThreatIntelligencePanel intelligence={res.intelligence} risk={res.risk} />
        <VerificationPanel verification={res.verification} risk={res.risk} />
        <SitePreview url={url || res.domain} risk={res.risk} verification={res.verification} label="Live Preview" hint={res.risk === "SAFE" ? "Live-verified for this scan" : res.risk === "UNVERIFIED" ? "Evidence incomplete" : "Isolate before visiting"} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" style={btnStyle("#22aaff")} onClick={() => setDrawer("ioc")}>IOC INSPECTOR</button>
          <button type="button" style={btnStyle("#6644ff")} onClick={() => setDrawer("detonation")}>DETONATION CHAIN</button>
        </div>
      </>}
      <Card style={{ marginTop: 18 }}>
        <Label>Quick Test Examples</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SAMPLE_GROUPS.map(group => (
            <div key={group.title}>
              <div style={{ fontSize: 10, color: "#445", letterSpacing: 2, marginBottom: 8, fontWeight: 800 }}>{group.title.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {group.urls.map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => { runScan(ex); }}
                    style={sampleButtonStyle(dark, group.variant)}
                  >
                    {group.variant === "alert" && ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {drawer && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 130 }}
            onClick={() => setDrawer(null)}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: isMobile ? "100%" : 460,
              background: dark ? "#0a0a1a" : "#ffffff",
              borderLeft: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`,
              zIndex: 140,
              padding: isMobile ? "20px 16px" : "24px 22px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: SYNE, fontWeight: 900, letterSpacing: 2, fontSize: 13, color: dark ? "#fff" : "#1a1a38" }}>
                {drawer === "ioc" ? "IOC INSPECTOR" : "DETONATION CHAIN"}
              </div>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                style={{ ...btnStyle("#1a1a30"), padding: "6px 12px", fontSize: 10, boxShadow: "none", border: "1px solid #2a2a50" }}
              >
                CLOSE
              </button>
            </div>
            {drawer === "ioc" ? <IOCInspector ioc={ioc} enrichment={enrichment} /> : <DetonationChain artifacts={artifacts} />}
          </div>
        </>
      )}
    </div>
  );
}
