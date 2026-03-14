import React, { useState } from "react";
import { useTheme, Card, Label, InfoBox, btnStyle } from "./UI";
import { MONO, CUSTOM_DOMAINS, CUSTOM_KW, updateCustomDomains, updateCustomKeywords } from "../../data/constants";

export function BlocklistManager() {
  const { dark } = useTheme();
  const [domains, setDomains] = useState([...CUSTOM_DOMAINS]), [kws, setKws] = useState([...CUSTOM_KW]);
  const [newDom, setNewDom] = useState(""), [newKw, setNewKw] = useState("");
  const addDom = () => { if (!newDom.trim()) return; const next = [...domains, newDom.trim().toLowerCase()]; setDomains(next); updateCustomDomains(next); setNewDom(""); };
  const remDom = d => { const next = domains.filter(x => x !== d); setDomains(next); updateCustomDomains(next); };
  const addKw = () => { if (!newKw.trim()) return; const next = [...kws, newKw.trim().toLowerCase()]; setKws(next); updateCustomKeywords(next); setNewKw(""); };
  const remKw = k => { const next = kws.filter(x => x !== k); setKws(next); updateCustomKeywords(next); };
  const inp = { flex: 1, background: dark ? "#0a0a18" : "#f5f6fc", border: `1px solid ${dark ? "#1a1a38" : "#dde"}`, borderRadius: 6, padding: "9px 12px", fontFamily: MONO, fontSize: 12, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none" };
  return (
    <div>
      <Label>Custom Blocklist — feeds into all URL & Email scanners</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <Label>Blocked Domains ({domains.length})</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={inp} placeholder="e.g. evil-domain.xyz" value={newDom} onChange={e => setNewDom(e.target.value)} onKeyDown={e => e.key === "Enter" && addDom()} /><button style={btnStyle()} onClick={addDom}>ADD</button></div>
          {domains.length === 0 && <div style={{ fontSize: 12, color: "#445" }}>No custom domains added yet.</div>}
          {domains.map((d, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 5, marginBottom: 5, border: "1px solid #1a1a30" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#ff8899" }}>{d}</span><button onClick={() => remDom(d)} style={{ background: "none", border: "none", color: "#ff335566", cursor: "pointer", fontSize: 16 }}>✕</button></div>)}
        </Card>
        <Card>
          <Label>Blocked Keywords ({kws.length})</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={inp} placeholder="e.g. winprize" value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()} /><button style={btnStyle("#ff9900")} onClick={addKw}>ADD</button></div>
          {kws.length === 0 && <div style={{ fontSize: 12, color: "#445" }}>No custom keywords added yet.</div>}
          {kws.map((k, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 5, marginBottom: 5, border: "1px solid #1a1a30" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#ffaa44" }}>{k}</span><button onClick={() => remKw(k)} style={{ background: "none", border: "none", color: "#ff335566", cursor: "pointer", fontSize: 16 }}>✕</button></div>)}
        </Card>
      </div>
      <InfoBox color="#00ff88" style={{ marginTop: 12 }}>✓ Changes apply immediately to all active scanners in this session.</InfoBox>
    </div>
  );
}
