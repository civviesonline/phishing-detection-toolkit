import React, { useState, useEffect, useRef } from "react";
import { useTheme, Card, Label, Spinner, ResultCard, btnStyle, Flag, InfoBox, Tag, ThreatIntelligencePanel } from "../shared/UI";
import { SitePreview } from "../shared/SitePreview";
import { MONO, SYNE, BREACHES, RISK_CFG, CUSTOM_DOMAINS, CUSTOM_KW } from "../../data/constants";
import { analyzeURL, fakeGeo, fakeDNS, hashStr, playSound } from "../../utils/analysis";

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
  const scanTimer = useRef(null);
  const inp = { width: "100%", background: dark ? "#0a0a18" : "#f5f6fc", border: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`, borderRadius: 7, padding: "13px 17px", fontFamily: MONO, fontSize: 16, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none", boxSizing: "border-box" };
  const runScan = (value) => {
    const target = (value ?? url).trim();
    if (!target) return;
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
    }
    setScanning(true);
    setRes(null);
    if (value !== undefined) setUrl(value);
    try {
      const r = analyzeURL(target, CUSTOM_DOMAINS, CUSTOM_KW);
      setRes(r);
      onTrigger?.({ type: "url", risk: r.risk, score: r.score, domain: r.domain, summary: r.flags?.[0] ?? "URL analysis", detail: r });
      playSound(r.risk);
    } catch (err) {
      setRes({
        score: 100,
        risk: "DANGER",
        flags: ["Scan error — unable to analyze URL"],
        domain: target,
        raw: target,
        intelligence: {
          tactic: "Analysis Failure",
          intent: "Unknown",
          recommendation: "Retry the scan or verify the URL manually.",
          technicalDetail: String(err?.message || err)
        }
      });
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
      <div className="pg-row" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
        <input
          style={{ ...inp, flex: 1, minWidth: 0 }}
          placeholder="https://suspicious-site.xyz/verify..."
          value={url}
          onChange={e => { setUrl(e.target.value); setRes(null); }}
          onKeyDown={e => e.key === "Enter" && runScan()}
        />
        <button style={{ ...btnStyle(), width: isMobile ? "100%" : "auto" }} onClick={() => runScan()}>
          {scanning ? "SCANNING…" : "SCAN URL"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: "#445", marginTop: 6, letterSpacing: 1 }}>Tip: Press Ctrl+Enter to scan</div>
      {scanning && <Card style={{ marginTop: 16, position: "relative", overflow: "hidden", height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}><div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#ff3355,transparent)", animation: "shimmer 1s linear infinite" }} /><Spinner /><span style={{ fontSize: 12, color: "#445", letterSpacing: 4 }}>ANALYZING THREAT VECTORS...</span></Card>}
      {res && <>
        <ResultCard result={res} />
        <ThreatIntelligencePanel intelligence={res.intelligence} risk={res.risk} />
        <SitePreview url={url || res.domain} risk={res.risk} label="Live Preview" hint={res.risk === "SAFE" ? "Verified for this scan" : "Isolate before visiting"} />
        <DNSGeoPanel domain={res.domain} />
        <BreachPanel domain={res.domain} />
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
    </div>
  );
}

function DNSGeoPanel({ domain }) {
  const { dark } = useTheme();
  const [tab, setTab] = useState("geo"), [ready, setReady] = useState(false);
  const geo = fakeGeo(domain), dns = fakeDNS(domain);
  useEffect(() => { setReady(true); }, [domain]);
  if (!ready) return <Card style={{ marginTop: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}><Spinner color="#6644ff" size={16} /><span style={{ fontSize: 13, color: "#445", letterSpacing: 3 }}>RESOLVING DNS & GEOIP...</span></div></Card>;
  const geoRows = [["🌐", "IP", geo.ip], ["📍", "Country", `${geo.flag} ${geo.country}`], ["🏙", "City", geo.city], ["🖧", "ISP", geo.isp], ["🔢", "ASN", geo.asn], ["📋", "Registrar", geo.registrar], ["📅", "Age", `${geo.age}yr${geo.age !== 1 ? "s" : ""}${geo.newDomain ? " ⚠" : ""}`, geo.newDomain], ["🗓", "Created", geo.created]];
  return (
    <Card style={{ marginTop: 16 }}>
      <div style={{ display: "flex", marginBottom: 18, borderBottom: "1px solid #1a1a30" }}>{["geo", "dns"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#6644ff" : "transparent"}`, color: tab === t ? "#9977ff" : "#445", fontFamily: SYNE, fontWeight: 700, fontSize: 11, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase" }}>{t === "geo" ? "GeoIP" : "DNS"}</button>)}</div>
      {tab === "geo" && <><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{geoRows.map(([icon, lbl, val, warn], i) => <div key={i} style={{ background: dark ? "#0d0d1e" : "#f8f9ff", border: `1px solid ${warn ? "#ffcc0033" : "#1a1a30"}`, borderRadius: 8, padding: "10px 14px" }}><div style={{ fontSize: 10, color: "#445", letterSpacing: 2, marginBottom: 4 }}>{icon} {lbl}</div><div style={{ fontFamily: MONO, fontSize: 12, color: warn ? "#ffcc00" : "#8899cc" }}>{val}</div></div>)}</div>{geo.newDomain && <Flag f="Domain <2 years old — commonly used in phishing campaigns" color="#ffcc00" />}</>}
      {tab === "dns" && <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 11 }}><thead><tr style={{ borderBottom: "1px solid #1a1a30" }}>{["Type", "Value", "TTL"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "#445", fontSize: 9, letterSpacing: 2, fontWeight: 400 }}>{h}</th>)}</tr></thead><tbody>{dns.map((r, i) => <tr key={i} style={{ borderBottom: "1px solid #0f0f1e" }}><td style={{ padding: "7px 10px" }}><Tag color={r.type === "A" ? "#6699ff" : r.type === "MX" ? "#ff9900" : r.type === "NS" ? "#00ff88" : "#aa88ff"}>{r.type}</Tag></td><td style={{ padding: "7px 10px", color: "#7788aa", wordBreak: "break-all" }}>{r.value}</td><td style={{ padding: "7px 10px", color: "#445" }}>{r.ttl}s</td></tr>)}</tbody></table>}
    </Card>
  );
}

function BreachPanel({ domain }) {
  const { dark } = useTheme();
  const [ready, setReady] = useState(false), [input, setInput] = useState(""), [result, setResult] = useState(null);
  useEffect(() => { setReady(true); }, [domain]);
  const check = () => { if (!input.trim()) return; const h = hashStr(input), keys = Object.keys(BREACHES); const hits = [...new Set([0, 1, 2].map(i => keys[(h + i * 7) % keys.length]))].map(k => ({ domain: k, ...BREACHES[k] })); setResult({ hits, pwned: hits.length > 0 }); };
  const domHits = Object.entries(BREACHES).filter(([d]) => domain?.endsWith(d));
  if (!ready) return <Card style={{ marginTop: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}><Spinner color="#ff3355" size={16} /><span style={{ fontSize: 13, color: "#445", letterSpacing: 3 }}>SCANNING BREACH DATABASE...</span></div></Card>;
  return (
    <Card style={{ marginTop: 16 }}><Label>Dark Web Breach Intelligence</Label>
      {domHits.length > 0 && <div style={{ marginBottom: 16 }}>{domHits.map(([d, b], i) => <div key={i} style={{ background: "rgba(255,51,85,.06)", border: "1px solid #ff335533", borderRadius: 6, padding: "10px 14px", marginBottom: 6 }}><div style={{ display: "flex", justifyBox: "space-between", alignItems: "center" }}><span style={{ fontFamily: MONO, color: "#ff8899", fontSize: 13 }}>{d}</span><Tag color="#ff3355">{b.y}</Tag></div><div style={{ fontSize: 11, color: "#667", marginTop: 4 }}>Records: <span style={{ color: "#ffcc00" }}>{b.n}</span> · {b.d}</div></div>)}</div>}
      <div style={{ background: dark ? "#0d0d1e" : "#f8f9ff", border: "1px solid #1a1a30", borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 11, color: "#556", marginBottom: 10, letterSpacing: 1 }}>CHECK EMAIL IN BREACH DATABASES</div>
        <div className="pg-row" style={{ display: "flex", gap: 8 }}><input style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: dark ? "#080814" : "#fff", border: "1px solid #1e2240", borderRadius: 6, padding: "9px 12px", fontFamily: MONO, fontSize: 12, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none" }} placeholder="analyst@company.com" value={input} onChange={e => { setInput(e.target.value); setResult(null); }} onKeyDown={e => e.key === "Enter" && check()} /><button onClick={check} style={btnStyle()}>CHECK</button></div>
        {result && <div style={{ marginTop: 12, animation: "fadeIn .3s ease" }}><InfoBox color={result.pwned ? "#ff3355" : "#00ff88"}>{result.pwned ? `🔴 PWNED — Found in ${result.hits.length} breach${result.hits.length > 1 ? "es" : ""}` : "✅ No breaches found"}</InfoBox>{result.pwned && result.hits.map((b, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: dark ? "#080814" : "#fff", borderRadius: 5, marginTop: 6, border: "1px solid #1a1a30" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#8899bb" }}>{b.domain}</span><div style={{ display: "flex", gap: 8 }}><span style={{ fontSize: 10, color: "#445" }}>{b.n} records</span><Tag color="#ffcc00">{b.y}</Tag></div></div>)}</div>}
      </div>
    </Card>
  );
}
