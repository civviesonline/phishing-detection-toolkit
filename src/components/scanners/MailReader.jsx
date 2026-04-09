import React, { useEffect, useRef, useState } from "react";
import { useTheme, Card, Label, TrafficLight, ScoreBar, Tag, Flag, InfoBox, Spinner, btnStyle, ThreatIntelligencePanel } from "../shared/UI";
import { MONO, CUSTOM_DOMAINS, CUSTOM_KW, RISK_CFG, getRiskColor } from "../../data/constants";
import { playSound } from "../../utils/analysis";
import { analyzeEmailWithInternet } from "../../utils/liveVerification";
import { buildMailFields, cleanDetectedText } from "../../utils/mailInput";
import { Icon } from "../shared/Icon";

const OCR_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

const READER_STEPS = [
  { title: "Paste copied mail", detail: "Drop in a full email, a copied Gmail thread, or a mobile notification body." },
  { title: "Read another screen", detail: "Point the camera at another phone or computer screen and capture the visible message text." },
  { title: "Review extracted fields", detail: "Circadian parses sender, subject, and body before running the phishing analysis." }
];

let ocrLoaderPromise = null;

const ensureOcrEngine = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OCR is only available in the browser."));
  }
  if (window.Tesseract) return Promise.resolve(window.Tesseract);

  if (!ocrLoaderPromise) {
    ocrLoaderPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-circadian-ocr="tesseract"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Tesseract), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load OCR engine.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = OCR_CDN;
      script.async = true;
      script.dataset.circadianOcr = "tesseract";
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error("Failed to load OCR engine."));
      document.head.appendChild(script);
    });
  }

  return ocrLoaderPromise;
};

const inputStyle = dark => ({
  width: "100%",
  background: dark ? "#0a0a18" : "#f5f6fc",
  border: `1px solid ${dark ? "#1a1a38" : "#dde0f0"}`,
  borderRadius: 7,
  padding: "13px 17px",
  fontFamily: MONO,
  fontSize: 14,
  color: dark ? "#c8d0e0" : "#1a1a38",
  outline: "none",
  boxSizing: "border-box"
});

export function MailReader({ onTrigger }) {
  const { dark, isMobile } = useTheme();
  const [pasteInput, setPasteInput] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [intakeSource, setIntakeSource] = useState("manual");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [res, setRes] = useState(null);
  const [status, setStatus] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrProgress, setOcrProgress] = useState("");
  const [analysisBusy, setAnalysisBusy] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const canUseCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const ingestText = (raw, sourceLabel) => {
    const next = buildMailFields(raw);
    setSourceText(next.raw);
    setFrom(next.from);
    setSubject(next.subject);
    setBody(next.body);
    setRes(null);
    setStatus(`Imported ${sourceLabel} into the mail reader.`);
    setIntakeSource(sourceLabel);
    return next;
  };

  const analyzeFields = async (payload, sourceLabel = intakeSource, sourceRaw = sourceText) => {
    const nextPayload = payload || { from, subject, body };
    if (!nextPayload.from.trim() && !nextPayload.subject.trim() && !nextPayload.body.trim()) return;

    setAnalysisBusy(true);
    try {
      const result = await analyzeEmailWithInternet(nextPayload, CUSTOM_DOMAINS, CUSTOM_KW);
      setRes(result);
      onTrigger?.({
        type: "email",
        risk: result.risk,
        score: result.score,
        summary: result.senderFlags?.[0] || nextPayload.subject || `${sourceLabel} mail scan`,
        detail: { ...result, intakeSource: sourceLabel, sourceText: sourceRaw },
        domain: result.scannedLinks?.[0]?.domain
      });
      playSound(result.risk);
      setStatus(`Mail analysis completed from ${sourceLabel}.`);
    } catch (error) {
      setRes({
        score: 0,
        risk: "UNVERIFIED",
        keywords: [],
        urgency: [],
        linkCount: 0,
        hasAttach: false,
        scannedLinks: [],
        senderFlags: ["Analysis failed — check the imported message text"],
        hiddenRedirects: 0,
        deobEscalations: 0,
        verification: {
          mode: "email",
          checkedAt: new Date().toISOString(),
          online: false,
          minimumSourcesMet: false,
          coverage: 0,
          summary: "Circadian could not finish the live verification pass for this message.",
          sources: []
        },
        intelligence: {
          tactic: "Verification Failure",
          intent: "Unknown",
          recommendation: "Retry the import with internet access and review the parsed fields before trusting the verdict.",
          technicalDetail: String(error?.message || error)
        }
      });
    } finally {
      setAnalysisBusy(false);
    }
  };

  const analyzeImportedText = (raw, sourceLabel) => {
    const next = ingestText(raw, sourceLabel);
    analyzeFields({ from: next.from, subject: next.subject, body: next.body }, sourceLabel, next.raw);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    if (!canUseCamera) {
      setStatus("Camera access is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setStatus("Camera ready. Point it at a mail or SMS screen, then capture text.");
    } catch (error) {
      setStatus(`Camera error: ${error.message}`);
      setCameraOn(false);
    }
  };

  const extractText = async (source, sourceLabel) => {
    setOcrBusy(true);
    setOcrProgress("Loading OCR engine...");
    setStatus(`Reading text from ${sourceLabel}...`);

    try {
      const Tesseract = await ensureOcrEngine();
      const result = await Tesseract.recognize(source, "eng", {
        logger: message => {
          if (!message?.status) return;
          const pct = typeof message.progress === "number" ? ` ${Math.round(message.progress * 100)}%` : "";
          setOcrProgress(`${message.status}${pct}`);
        }
      });
      const text = cleanDetectedText(result?.data?.text || "");
      if (!text) {
        throw new Error("No readable text was detected. Try a clearer photo or tighter crop.");
      }
      ingestText(text, sourceLabel);
      setStatus(`Extracted text from ${sourceLabel}. Review the parsed fields, then analyze.`);
    } catch (error) {
      setStatus(error.message || "OCR failed while reading the message.");
    } finally {
      setOcrBusy(false);
      setOcrProgress("");
    }
  };

  const captureCurrentFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapshot = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(snapshot);
    await extractText(canvas, "camera capture");
  };

  const handleImageFile = async file => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(current => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return url;
    });
    await extractText(file, "uploaded screenshot");
  };

  useEffect(() => () => {
    stopCamera();
  }, []);

  useEffect(() => () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      return () => URL.revokeObjectURL(previewUrl);
    }
    return undefined;
  }, [previewUrl]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Label>Read copied emails or scan another screen to extract message text</Label>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {READER_STEPS.map(step => (
          <Card key={step.title} style={{ padding: "12px 14px", borderRadius: 12, background: dark ? "#0a0a18" : "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#667", marginBottom: 6 }}>{step.title}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#dde" : "#1a1a38" }}>{step.detail}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Label>Paste Reader</Label>
            <Tag color="#22aaff">RAW TEXT</Tag>
          </div>
          <textarea
            style={{ ...inputStyle(dark), minHeight: 220, resize: "vertical", lineHeight: 1.7 }}
            placeholder={"Paste a full email, copied Gmail/Outlook view, or an SMS alert here.\n\nCircadian will try to parse sender, subject, and body automatically."}
            value={pasteInput}
            onChange={e => {
              setPasteInput(e.target.value);
              setRes(null);
            }}
            onPaste={e => {
              const text = e.clipboardData.getData("text");
              if (text.trim()) {
                setPasteInput(text);
              }
            }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button type="button" style={btnStyle("#22aaff")} onClick={() => ingestText(pasteInput, "pasted message")}>IMPORT PASTE</button>
            <button type="button" style={btnStyle("#ff9900")} onClick={() => analyzeImportedText(pasteInput, "pasted message")}>{analysisBusy ? "VERIFYING..." : "ANALYZE PASTE"}</button>
          </div>
          <InfoBox color="#22aaff" style={{ marginTop: 12 }}>
            Paste works for raw headers, copied inbox text, or full message bodies from desktop and mobile.
          </InfoBox>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Label>Screen Reader</Label>
            <Tag color={ocrBusy ? "#ffcc00" : "#ff3355"}>{ocrBusy ? "READING" : "OCR"}</Tag>
          </div>

          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${dark ? "#1a1f36" : "#dde0f0"}`, background: dark ? "#070712" : "#f8faff", minHeight: 240 }}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Mail reader preview" style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#6677aa", textAlign: "center", padding: "0 22px" }}>
                <Icon name="camera" size={42} color="#6677aa" />
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>CAMERA / SCREENSHOT OCR</div>
                <div style={{ fontSize: 11 }}>Use the camera for another screen or upload a screenshot with the message visible.</div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          <div className="pg-row" style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            <button type="button" style={btnStyle(cameraOn ? "#1a1a30" : "#ff3355")} onClick={cameraOn ? stopCamera : startCamera}>
              {cameraOn ? "STOP CAMERA" : "START CAMERA"}
            </button>
            <button type="button" style={btnStyle("#22aaff")} onClick={captureCurrentFrame} disabled={!cameraOn || ocrBusy}>
              {ocrBusy ? "READING TEXT..." : "READ CURRENT FRAME"}
            </button>
            <button type="button" style={btnStyle("#6644ff")} onClick={() => fileRef.current?.click()}>
              UPLOAD SCREENSHOT
            </button>
            <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => handleImageFile(e.target.files?.[0])} />
          </div>

          {!canUseCamera && (
            <InfoBox color="#ffcc00" style={{ marginTop: 12 }}>
              Camera access is unavailable here, but screenshot OCR and pasted-text intake still work.
            </InfoBox>
          )}

          {(ocrBusy || ocrProgress) && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, color: "#ffcc00", fontSize: 12 }}>
              <Spinner color="#ffcc00" size={14} />
              <span>{ocrProgress || "Reading message text..."}</span>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <Label>Extracted Message Text</Label>
          <Tag color="#6644ff">{intakeSource.toUpperCase()}</Tag>
        </div>
        <textarea
          style={{ ...inputStyle(dark), minHeight: 200, resize: "vertical", lineHeight: 1.65 }}
          placeholder="Imported or OCR-extracted message text appears here."
          value={sourceText}
          onChange={e => {
            setSourceText(e.target.value);
            setRes(null);
          }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" style={btnStyle("#22aaff")} onClick={() => ingestText(sourceText, "edited source text")}>RE-PARSE TEXT</button>
          <button type="button" style={btnStyle("#ff9900")} onClick={() => analyzeImportedText(sourceText, intakeSource || "edited source text")}>{analysisBusy ? "VERIFYING..." : "ANALYZE EXTRACTED TEXT"}</button>
        </div>
      </Card>

      <Card>
        <Label>Parsed Mail Fields</Label>
        <div className="pg-row" style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input style={inputStyle(dark)} placeholder="From: sender@example.com" value={from} onChange={e => { setFrom(e.target.value); setRes(null); }} />
          <input style={inputStyle(dark)} placeholder="Subject: Suspicious login alert" value={subject} onChange={e => { setSubject(e.target.value); setRes(null); }} />
        </div>
        <textarea
          style={{ ...inputStyle(dark), minHeight: 180, resize: "vertical", lineHeight: 1.7 }}
          placeholder="Message body or SMS content..."
          value={body}
          onChange={e => { setBody(e.target.value); setRes(null); }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" style={btnStyle("#ff9900")} onClick={() => analyzeFields()}>{analysisBusy ? "VERIFYING..." : "ANALYZE MESSAGE"}</button>
          <button
            type="button"
            style={{ ...btnStyle("#1a1a30"), boxShadow: "none", border: "1px solid #2a2a50" }}
            onClick={() => {
              setPasteInput("");
              setSourceText("");
              setFrom("");
              setSubject("");
              setBody("");
              setRes(null);
              setStatus("");
              setIntakeSource("manual");
              setPreviewUrl(current => {
                if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
                return "";
              });
            }}
          >
            CLEAR READER
          </button>
        </div>
      </Card>

      {status && (
        <InfoBox color="#22aaff">
          <Icon name="info" size={16} color="#22aaff" />
          {status}
        </InfoBox>
      )}
      {analysisBusy && (
        <InfoBox color="#22aaff">
          <Spinner color="#22aaff" size={14} />
          Collecting live search and DNS evidence before Circadian issues the final verdict…
        </InfoBox>
      )}

      {res && (
        <div style={{ animation: "fadeIn .3s ease" }}>
          <Card border={RISK_CFG[res.risk]?.color + "55"}>
            <TrafficLight risk={res.risk} />
            <ScoreBar score={res.score ?? 0} risk={res.risk} />
            {res.verification?.summary && (
              <InfoBox color="#22aaff">
                <Icon name="globe" size={16} color="#22aaff" />
                {res.verification.summary}
              </InfoBox>
            )}
            <ThreatIntelligencePanel intelligence={res.intelligence} risk={res.risk} />

            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              {[["Keywords", res.keywords?.length ?? 0, "#ff3355"], ["Urgency", res.urgency?.length ?? 0, "#ffcc00"], ["Links", res.linkCount ?? 0, "#6699ff"], ["Hidden Redirects", res.hiddenRedirects || 0, "#22aaff"], ["Escalated Links", res.deobEscalations || 0, "#9977ff"], ["Attachment", res.hasAttach ? "YES" : "NO", res.hasAttach ? "#ff3355" : "#00ff88"]].map(([label, value, color]) => (
                <div key={label} style={{ background: dark ? "#0d0d1e" : "#f8f9ff", border: "1px solid #1a1a30", borderRadius: 8, padding: "12px 16px", flex: "1 1 90px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#445", letterSpacing: 2, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {res.senderFlags?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Label>Sender Analysis</Label>
                {res.senderFlags.map((flag, index) => <Flag key={index} f={flag} />)}
              </div>
            )}

            {res.scannedLinks?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Label>URLs In Message ({res.scannedLinks.length})</Label>
                {res.scannedLinks.map((link, index) => {
                  const linkColor = getRiskColor(link.risk);
                  return (
                    <div key={index} style={{ background: dark ? "#080812" : "#fafbff", border: `1px solid ${linkColor}44`, borderRadius: 7, padding: "10px 14px", marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: "#6677aa", wordBreak: "break-all" }}>{link.url}</span>
                        <Tag color={linkColor}>{link.risk}</Tag>
                      </div>
                      {link.flags?.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {link.flags.slice(0, 4).map((flag, flagIndex) => (
                            <div key={flagIndex} style={{ fontSize: 11, color: "#cc8899", marginTop: 2 }}>▶ {flag}</div>
                          ))}
                        </div>
                      )}
                      {link.verification?.summary && <div style={{ marginTop: 8, fontSize: 11, color: "#6677aa" }}>{link.verification.summary}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <InfoBox color="#6644ff" style={{ marginTop: 14 }}>
              Intake source: {intakeSource} · Review the parsed fields above if OCR introduced mistakes before trusting the result.
            </InfoBox>
          </Card>
        </div>
      )}
    </div>
  );
}
