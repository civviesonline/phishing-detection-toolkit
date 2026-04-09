import React, { useState, useRef, useEffect } from "react";
import { Card, Label, Spinner, ResultCard, ThreatIntelligencePanel, btnStyle, useTheme, InfoBox, VerificationPanel } from "../shared/UI";
import { submitIOC, getDetonationArtifacts, getEnrichment } from "../../utils/api";
import { analyzeUrlWithInternet } from "../../utils/liveVerification";
import { IOCInspector } from "./IOCInspector";
import { DetonationChain } from "./DetonationChain";

export function IntelWorkspace() {
  const { dark, isMobile } = useTheme();
  const [input, setInput] = useState("https://google.com");
  const [res, setRes] = useState(null);
  const [ioc, setIoc] = useState(null);
  const [enrichment, setEnrichment] = useState(null);
  const [artifacts, setArtifacts] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const run = async () => {
    if (!input.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    setRes(null);
    setIoc(null);
    setEnrichment(null);
    setArtifacts(null);

    try {
      const result = await analyzeUrlWithInternet(input.trim());
      setRes(result);

      submitIOC({ type: "url", value: input.trim(), analysis: result }).then(setIoc);
      getEnrichment({ url: input.trim(), analysis: result }).then(setEnrichment);
      getDetonationArtifacts({ url: input.trim(), analysis: result }).then(setArtifacts);
    } finally {
      timerRef.current = setTimeout(() => setLoading(false), 120);
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <Label>Intel Lab — IOC Inspector + Detonation</Label>
        <div style={{ fontSize: 12, color: "#667", marginBottom: 12 }}>
          Run a URL through the intel pipeline to view IOC metadata, enrichment, and detonation artifacts.
        </div>
        <div className="pg-row" style={{ display: "flex", gap: 10 }}>
          <input
            aria-label="URL to run through the intel lab"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="https://example.com/login"
            style={{ flex: 1, minWidth: 0, background: dark ? "#0a0a18" : "#f5f6fc", border: "1px solid #1a1a30", borderRadius: 7, padding: "12px 14px", color: dark ? "#c8d0e0" : "#1a1a38", fontFamily: "Share Tech Mono, monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onKeyDown={e => e.key === "Enter" && run()}
          />
          <button type="button" style={btnStyle("#22aaff")} onClick={run}>{loading ? "RUNNING..." : "RUN INTEL"}</button>
        </div>
        {loading && <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, color: "#667" }}><Spinner size={16} />Collecting intel…</div>}
      </Card>

      {res && (
        <>
          <ResultCard result={res} />
          <ThreatIntelligencePanel intelligence={res.intelligence} risk={res.risk} />
          <VerificationPanel verification={res.verification} risk={res.risk} />
        </>
      )}

      {res && (
        <div className="pg-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <IOCInspector ioc={ioc} enrichment={enrichment} />
          <DetonationChain artifacts={artifacts} />
        </div>
      )}

      {!res && (
        <InfoBox color="#22aaff">
          Submit a URL to populate IOC metadata, enrichment, and detonation artifacts.
        </InfoBox>
      )}
    </div>
  );
}
