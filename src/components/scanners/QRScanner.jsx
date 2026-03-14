import React, { useState, useEffect, useRef } from "react";
import { useTheme, Card, Label, Spinner, ResultCard, btnStyle, InfoBox } from "../shared/UI";
import { SitePreview } from "../shared/SitePreview";
import { MONO, SYNE, CUSTOM_DOMAINS, CUSTOM_KW, RISK_CFG } from "../../data/constants";
import { analyzeURL, playSound } from "../../utils/analysis";

const isMobile = typeof window !== "undefined" ? window.innerWidth <= 900 : false;

const QR_STEPS = [
  { title: "Steady the frame", detail: "Keep the entire QR code centered and well-lit for sharp decoding." },
  { title: "Validate the source", detail: "Only scan codes from trusted senders; phishing QR is on the rise." },
  { title: "Mirror the preview", detail: "Review the decoded preview before opening any link." }
];

export function QRScanner({ onTrigger }) {
  const { dark } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [res, setRes] = useState(null);
  const [status, setStatus] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  
  const fileRef = useRef(null);
  const scannerRef = useRef(null); // Html5Qrcode instance

  useEffect(() => {
    if (window.Html5Qrcode) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    s.onload = () => setLoaded(true);
    s.onerror = () => setLoaded("fail");
    document.head.appendChild(s);
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error("Stop error", e);
      }
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    if (!window.Html5Qrcode) return;
    setRes(null);
    setPreview(null);
    setStatus("Initializing camera...");
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new window.Html5Qrcode("reader");
      }
      
      setCameraOn(true);
      setStatus("");

      const config = { fps: 15, qrbox: { width: 250, height: 250 } };
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 30, // Increased FPS for 'at a glance' detection
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          const analysis = analyzeURL(decodedText, CUSTOM_DOMAINS, CUSTOM_KW);
          setRes({ ...analysis, raw: decodedText });
          onTrigger?.({
            type: "qr",
            risk: analysis.risk,
            score: analysis.score,
            domain: analysis.domain,
            summary: analysis.flags?.[0] || "QR link scan",
            detail: analysis
          });
          playSound(analysis.risk);
          stopCamera();
        },
        () => {} 
      );
    } catch (e) {
      setStatus(`Camera Error: ${e.message}`);
      setCameraOn(false);
    }
  };

  const handleFile = async (f) => {
    if (!f || !window.Html5Qrcode) return;
    setRes(null);
    setStatus("Processing image...");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    
    try {
      const html5QrCode = new window.Html5Qrcode("reader", false);
      const decodedText = await html5QrCode.scanFile(f, true);
      const analysis = analyzeURL(decodedText, CUSTOM_DOMAINS, CUSTOM_KW);
      setRes(analysis);
      onTrigger?.({
        type: "qr",
        risk: analysis.risk,
        score: analysis.score,
        domain: analysis.domain,
        summary: analysis.flags?.[0] || "QR upload scan",
        detail: analysis
      });
      playSound(analysis.risk);
      setStatus("");
    } catch (e) {
      setStatus("No QR or Barcode found in this image. Try another.");
    }
  };

  useEffect(() => () => { stopCamera(); }, []);

  const riskMeta = res ? (RISK_CFG[res.risk] || RISK_CFG.SAFE) : RISK_CFG.SAFE;
  const detectionHighlights = res ? [
    { label: "Risk", value: res.risk, color: riskMeta.color },
    { label: "Score", value: `${res.score}/100`, color: riskMeta.color },
    { label: "Domain", value: res.domain || "n/a", color: "#889" },
    { label: "Flags", value: res.flags?.length ?? 0, color: "#667" }
  ] : [];

  if (loaded === "fail") return <InfoBox color="#ff3355">Failed to load QR/Barcode engine.</InfoBox>;

  const cameraStatusLabel = status || (cameraOn ? "Scanning…" : "Standby");

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Label>Scan QR & Barcodes via camera or image upload</Label>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {QR_STEPS.map(step => (
          <Card key={step.title} style={{ padding: "12px 14px", borderRadius: 12, background: dark ? "#0a0a18" : "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#667", marginBottom: 6 }}>{step.title}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#dde" }}>{step.detail}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr", gap: 16 }}>
        <Card border={dragOver ? "#ff3355" : undefined} style={{ position: "relative", minHeight: 320, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Live Camera Feed</div>
            <span style={{ fontSize: 11, color: "#889" }}>{cameraStatusLabel}</span>
          </div>
          <div id="reader" style={{ width: "100%", display: cameraOn ? "block" : "none", minHeight: 260 }}></div>

          {!cameraOn && !preview && (
            <div style={{ color: "#445", padding: "60px 0", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 13, letterSpacing: 2, fontWeight: 800 }}>CAMERA STANDBY</div>
              <div style={{ fontSize: 10, marginTop: 8 }}>Drag/drop an image to scan instantly</div>
            </div>
          )}

          {preview && !cameraOn && (
            <img src={preview} style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 10, opacity: 0.85 }} alt="Scan Preview" />
          )}

          <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", justifyContent: "center", gap: 10 }}>
            <button style={btnStyle(cameraOn ? "#333" : "#ff3355")} onClick={cameraOn ? stopCamera : startCamera}>
              {cameraOn ? "STOP SCANNER" : "START CAMERA"}
            </button>
            <button style={btnStyle("#1a1a30")} onClick={() => fileRef.current.click()}>UPLOAD FILE</button>
          </div>
          <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => handleFile(e.target.files[0])} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <Label>Manual Entry / Results</Label>
            <div style={{ marginBottom: 16 }}>
              <input
                style={{ width: "100%", background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 6, padding: "12px 14px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: MONO, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                placeholder="Paste decoded text or URL..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
              />
              <button
                style={{ ...btnStyle("#6644ff"), width: "100%", marginTop: 10 }}
                onClick={() => {
                  if (!manualUrl) return;
                  const r = analyzeURL(manualUrl, CUSTOM_DOMAINS, CUSTOM_KW);
                  setRes(r);
                  onTrigger?.({
                    type: "qr",
                    risk: r.risk,
                    score: r.score,
                    domain: r.domain,
                    summary: r.flags?.[0] || "Manual QR input",
                    detail: r
                  });
                  playSound(r.risk);
                }}
              >
                ANALYZE INPUT
              </button>
            </div>

            {status && (
              <div style={{ padding: "12px", background: "#ffcc0015", border: "1px solid #ffcc0033", borderRadius: 6, fontSize: 12, color: "#ffcc00", animation: "fadeIn .3s ease" }}>
                ℹ️ {status}
              </div>
            )}

            {!res && !status && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#445", fontSize: 12 }}>Awaiting data from scan or manual entry...</div>
            )}

            {res && (
              <div style={{ animation: "fadeIn .3s ease" }}>
                <ResultCard result={res} />
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {detectionHighlights.map(highlight => (
                    <div key={highlight.label} style={{ borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", padding: "6px 10px", fontSize: 11, color: highlight.color }}>
                      <strong>{highlight.label}: </strong>{highlight.value}
                    </div>
                  ))}
                </div>
                <SitePreview url={res.domain || res.raw || manualUrl} risk={res.risk} label="Decoded Preview" hint="Smart isolation preview" />
                <div style={{ marginTop: 16, padding: "16px", background: res.risk === "SAFE" ? "#00ff880a" : "#ff33550a", border: `1px solid ${res.risk === "SAFE" ? "#00ff8833" : "#ff335533"}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#445", letterSpacing: 2, marginBottom: 8, fontWeight: 800 }}>EXTRACTED DATA</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: res.risk === "SAFE" ? "#00ff88" : "#ff8899", wordBreak: "break-all", marginBottom: 12 }}>{res.raw}</div>
                  {res.risk === "SAFE" ? (
                    <a href={res.raw.startsWith("http") ? res.raw : "https://" + res.raw} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#00ff88", color: "#000", padding: "12px", borderRadius: 6, textDecoration: "none", fontFamily: SYNE, fontWeight: 900, fontSize: 13, letterSpacing: 1, boxShadow: "0 0 20px rgba(0,255,136,0.3)" }}>
                      🚀 OPEN SECURE URL
                    </a>
                  ) : (
                    <div style={{ padding: "10px", background: "#ff335515", borderRadius: 6, color: "#ff3355", fontSize: 11, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
                      ⚠️ DIRECT LINK DISABLED — THREAT DETECTED
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
