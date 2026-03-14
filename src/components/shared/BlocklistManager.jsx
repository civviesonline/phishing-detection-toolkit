import React, { useState } from "react";
import { useTheme, Card, Label, InfoBox, btnStyle } from "./UI";
import { MONO, CUSTOM_DOMAINS, CUSTOM_KW, SAFE_DOMAINS, updateCustomDomains, updateCustomKeywords, updateSafeDomains } from "../../data/constants";

export function BlocklistManager() {
  const { dark } = useTheme();
  const [domains, setDomains] = useState([...CUSTOM_DOMAINS]), [kws, setKws] = useState([...CUSTOM_KW]);
  const [newDom, setNewDom] = useState(""), [newKw, setNewKw] = useState("");
  const [safeDomains, setSafeDomains] = useState([...SAFE_DOMAINS]), [newSafe, setNewSafe] = useState("");
  const addDom = () => { if (!newDom.trim()) return; const next = [...domains, newDom.trim().toLowerCase()]; setDomains(next); updateCustomDomains(next); setNewDom(""); };
  const remDom = d => { const next = domains.filter(x => x !== d); setDomains(next); updateCustomDomains(next); };
  const addKw = () => { if (!newKw.trim()) return; const next = [...kws, newKw.trim().toLowerCase()]; setKws(next); updateCustomKeywords(next); setNewKw(""); };
  const remKw = k => { const next = kws.filter(x => x !== k); setKws(next); updateCustomKeywords(next); };
  const addSafe = () => {
    if (!newSafe.trim()) return;
    const candidate = newSafe.trim().toLowerCase();
    if (safeDomains.includes(candidate)) {
      setNewSafe("");
      return;
    }
    const next = [...safeDomains, candidate];
    setSafeDomains(next);
    updateSafeDomains(next);
    setNewSafe("");
  };
  const remSafe = domain => {
    const next = safeDomains.filter(x => x !== domain);
    setSafeDomains(next);
    updateSafeDomains(next);
  };
  const inp = { flex: 1, minWidth: 0, boxSizing: "border-box", background: dark ? "#0a0a18" : "#f5f6fc", border: `1px solid ${dark ? "#1a1a38" : "#dde"}`, borderRadius: 6, padding: "9px 12px", fontFamily: MONO, fontSize: 12, color: dark ? "#c8d0e0" : "#1a1a38", outline: "none" };
  return (
    <div>
      <Label>Custom Blocklist — feeds into all URL & Email scanners</Label>
      <div className="pg-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <Label>Blocked Domains ({domains.length})</Label>
          <div className="pg-row" style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={inp} placeholder="e.g. evil-domain.xyz" value={newDom} onChange={e => setNewDom(e.target.value)} onKeyDown={e => e.key === "Enter" && addDom()} /><button style={btnStyle()} onClick={addDom}>ADD</button></div>
          {domains.length === 0 && <div style={{ fontSize: 12, color: "#445" }}>No custom domains added yet.</div>}
          {domains.map((d, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 5, marginBottom: 5, border: "1px solid #1a1a30" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#ff8899" }}>{d}</span><button onClick={() => remDom(d)} style={{ background: "none", border: "none", color: "#ff335566", cursor: "pointer", fontSize: 16 }}>✕</button></div>)}
        </Card>
        <Card>
          <Label>Blocked Keywords ({kws.length})</Label>
          <div className="pg-row" style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={inp} placeholder="e.g. winprize" value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()} /><button style={btnStyle("#ff9900")} onClick={addKw}>ADD</button></div>
          {kws.length === 0 && <div style={{ fontSize: 12, color: "#445" }}>No custom keywords added yet.</div>}
          {kws.map((k, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 5, marginBottom: 5, border: "1px solid #1a1a30" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#ffaa44" }}>{k}</span><button onClick={() => remKw(k)} style={{ background: "none", border: "none", color: "#ff335566", cursor: "pointer", fontSize: 16 }}>✕</button></div>)}
        </Card>
      </div>
      <InfoBox color="#00ff88" style={{ marginTop: 12 }}>✓ Changes apply immediately to all active scanners in this session.</InfoBox>
      <Card style={{ marginTop: 18 }}>
        <Label>Safe Domain Allowlist ({safeDomains.length})</Label>
        <div style={{ fontSize: 12, color: "#445", marginBottom: 10 }}>Add verified resources so they are always trusted even if they contain busy parameters.</div>
        <div className="pg-row" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={inp} placeholder="e.g. reddit.com" value={newSafe} onChange={e => setNewSafe(e.target.value)} onKeyDown={e => e.key === "Enter" && addSafe()} />
          <button style={{ ...btnStyle("#00ff88"), padding: "10px 16px" }} onClick={addSafe}>ADD SAFE DOMAIN</button>
        </div>
        {safeDomains.length === 0 && <div style={{ fontSize: 12, color: "#445" }}>No safe domains configured yet.</div>}
        {safeDomains.map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: dark ? "#0d0d1e" : "#f8f9ff", borderRadius: 5, marginBottom: 5, border: "1px solid #1a1a30" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#00ff88" }}>{d}</span>
            <button onClick={() => remSafe(d)} style={{ background: "none", border: "none", color: "#ff335566", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ))}
        <InfoBox color="#00ff88" style={{ marginTop: 10 }}>
          Safe domains are honored across scanners and the CLI bridge. This data is stored locally so Kali workflows keep their trusted list.
        </InfoBox>
      </Card>
    </div>
  );
}
