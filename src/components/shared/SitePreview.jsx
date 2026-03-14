import React, { useEffect, useMemo, useState } from "react";
import { Card, Label, Spinner, btnStyle } from "./UI";

const PREVIEW_SERVICES = [
  href => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(href)}?w=1200`,
  href => `https://image.thum.io/get/width/1200/noanimate/${href}`,
  href => `https://mini.s-shot.com/1200x800/JPEG/1200/Z100/?${href}`
];

export function SitePreview({ url, risk = "SAFE", label = "Site Preview", hint }) {
  const [stage, setStage] = useState("loading");
  const [index, setIndex] = useState(0);
  const [safeHref, setSafeHref] = useState(null);

  useEffect(() => {
    if (!url) {
      setSafeHref(null);
      return;
    }
    try {
      const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
      setSafeHref(parsed.href);
      setStage("loading");
      setIndex(0);
    } catch {
      setSafeHref(null);
    }
  }, [url]);

  const previewSources = useMemo(() => {
    if (!safeHref) return [];
    return PREVIEW_SERVICES.map(fn => fn(safeHref));
  }, [safeHref]);

  const borderColor = risk === "DANGER" ? "#ff335533" : risk === "SUSPICIOUS" ? "#ffcc0033" : "#00ff8833";
  const glowColor = risk === "DANGER" ? "#ff335544" : risk === "SUSPICIOUS" ? "#ffcc0044" : "#00ff8844";

  const nextPreview = () => {
    if (index < previewSources.length - 1) {
      setIndex(index + 1);
      setStage("loading");
    } else {
      setStage("err");
    }
  };

  if (!safeHref) {
    return (
      <Card style={{ marginTop: 16 }}>
        <Label>{label}</Label>
        <div style={{ fontSize: 12, color: "#667" }}>Provide a valid URL to render a live preview.</div>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 16, border: `1px solid ${borderColor}`, background: risk === "DANGER" ? "#160713" : "#070712", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>{label}</Label>
        {hint && <span style={{ fontSize: 10, color: "#667" }}>{hint}</span>}
      </div>
      <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: `1px solid ${borderColor}` }}>
        {stage === "loading" && (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Spinner size={24} />
            <span style={{ color: "#8899aa", fontSize: 12 }}>Rendering preview…</span>
          </div>
        )}
        {stage !== "err" && (
          <img
            src={previewSources[index]}
            alt={`Preview of ${safeHref}`}
            style={{ width: "100%", height: 220, objectFit: "cover", display: stage === "loading" ? "none" : "block" }}
            onLoad={() => setStage("ready")}
            onError={nextPreview}
          />
        )}
        {stage === "err" && (
          <div style={{ height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: "#667" }}>
            <div>Preview unavailable for this URL.</div>
            <button style={{ ...btnStyle("#1a1a30"), fontSize: 10, padding: "6px 14px" }} onClick={() => setStage("loading")}>
              Retry services
            </button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#8899bb", display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: glowColor.replace(/44$/, "ff") }}>🚀 {risk === "SAFE" ? "Verified" : "Caution"}</span>
        <a href={safeHref} target="_blank" rel="noreferrer" style={{ fontSize: 11, textDecoration: "underline", color: "#22aaff" }}>
          Open URL
        </a>
      </div>
    </Card>
  );
}
