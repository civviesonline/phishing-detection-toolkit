import React, { useState, useEffect, useRef } from "react";
import { useTheme, Card, Label, InfoBox, Tag, btnStyle } from "../shared/UI";
import { MONO, SYNE, RISK_CFG } from "../../data/constants";

export const SCENARIOS_BANK = [
  { type: "url", label: "URL Check", content: "https://accounts.google.com/signin/v2/challenge/pwd", correct: "SAFE", explain: "Legitimate Google authentication URL on google.com. The path is expected for a 2FA challenge." },
  { type: "url", label: "URL Check", content: "http://amaz0n-account-billing-update.click/verify/payment?session=abc", correct: "DANGER", explain: "Leet substitution (0→o), suspicious TLD (.click), HTTP only, and phishing keywords — all DANGER signals." },
  { type: "url", label: "URL Check", content: "https://bit.ly/3xYz9ab", correct: "SUSPICIOUS", explain: "URL shorteners hide the true destination. You can't know where this leads — treat as SUSPICIOUS." },
  { type: "email", label: "Email Analysis", content: "From: it-support@micros0ft-helpdesk.com\nSubject: URGENT: Your account will be deleted\n\nDear User, your Microsoft account will be suspended unless you verify immediately:\nhttp://secure-microsoft-verify.xyz/login?token=abc123", correct: "DANGER", explain: "Spoofed domain (micros0ft), urgency, and a suspicious URL — classic DANGER phishing email." },
  { type: "email", label: "Email Analysis", content: "From: noreply@amazon.com\nSubject: Your order #114-8291030 has shipped\n\nHi, your order has shipped. Track it at https://amazon.com/track/114-8291030", correct: "SAFE", explain: "Legitimate sender domain, transactional content, real Amazon URL — SAFE." },
  { type: "header", label: "Header Analysis", content: "From: paypal@paypall-secure.xyz\nAuthentication-Results: spf=fail; dkim=fail; dmarc=fail\nReply-To: harvest@evil-domain.ru", correct: "DANGER", explain: "SPF, DKIM, DMARC all fail + Reply-To mismatch + bad domain = definitive DANGER." },
  { type: "url", label: "URL Check", content: "https://paypal.com/myaccount/settings/closeAccount", correct: "SAFE", explain: "Legitimate PayPal domain with a standard account path. No red flags." },
  { type: "email", label: "Email Analysis", content: "From: support@apple-id-verify.net\nSubject: Your Apple ID has been locked\n\nYour Apple ID was used to sign in from Russia. Verify immediately:\nhttps://apple-id-verify.net/confirm?token=7f3a", correct: "DANGER", explain: "apple-id-verify.net is NOT apple.com. Urgency + geographic scare + fake domain = DANGER." }
];

export function ScenarioDrills() {
  const DRILL_SIZE = 8;
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const newSession = () => shuffle(SCENARIOS_BANK).slice(0, DRILL_SIZE);
  const [idx, setIdx] = useState(0), [pick, setPick] = useState(null), [score, setScore] = useState(0), [time, setTime] = useState(30), [done, setDone] = useState(false), [streak, setStreak] = useState(0), [maxStreak, setMaxStreak] = useState(0), [session, setSession] = useState(() => newSession());
  const timerRef = useRef(null);

  useEffect(() => {
    if (done || pick !== null) return;
    setTime(30);
    timerRef.current = setInterval(() => setTime(t => { if (t <= 1) { clearInterval(timerRef.current); setPick("TIMEOUT"); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [idx, done, pick]);

  const answer = choice => { clearInterval(timerRef.current); setPick(choice); const correct = choice === session[idx].correct; if (correct) { setScore(s => s + Math.max(10, time * 3)); setStreak(s => { const next = s + 1; setMaxStreak(m => Math.max(m, next)); return next; }); } else setStreak(0); };
  const next = () => { if (idx + 1 >= session.length) setDone(true); else { setIdx(i => i + 1); setPick(null); } };
  const reset = () => { setSession(newSession()); setIdx(0); setPick(null); setScore(0); setTime(30); setDone(false); setStreak(0); setMaxStreak(0); };

  if (done) {
    const maxScore = session.length * 30 * 3, pct = Math.min(100, Math.round((score / maxScore) * 100)), susc = Math.max(0, 100 - pct);
    const { sc: suscColor, label: suscLabel, desc: suscDesc, icon: suscIcon, advice: suscAdvice } =
      susc <= 20 ? { sc: "#00ff88", label: "Very Low Risk", desc: "You have strong phishing awareness and respond quickly under pressure.", icon: "🛡️", advice: "Keep your skills sharp with regular drills. You're well-equipped to protect your organization." } :
      susc <= 40 ? { sc: "#66ffaa", label: "Low Risk", desc: "Good instincts — you catch most threats but occasionally hesitate on edge cases.", icon: "✅", advice: "Review scenarios where you lost time. Speed matters in real triage situations." } :
      susc <= 60 ? { sc: "#ffcc00", label: "Moderate Risk", desc: "You'd likely fall for some phishing attacks, especially under time pressure.", icon: "⚠️", advice: "Focus on URL structure and email authentication signals. Practice regularly to build faster instincts." } :
      susc <= 80 ? { sc: "#ff8800", label: "High Risk", desc: "Multiple attack patterns are likely to succeed against you. Vigilance training is recommended.", icon: "🚨", advice: "Slow down on suspicious emails. When in doubt, verify through official channels — never click links directly." } :
      { sc: "#ff3355", label: "Very High Risk", desc: "You are highly susceptible to phishing attacks. Immediate awareness training is strongly advised.", icon: "🔴", advice: "Do not click links in emails. Always type URLs directly into your browser. Report suspicious messages to IT security." };
    return (
      <div style={{ animation: "fadeIn .4s ease" }}>
        <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
          <div style={{ fontFamily: SYNE, fontSize: 56, fontWeight: 900, color: score > 500 ? "#00ff88" : score > 250 ? "#ffcc00" : "#ff3355", lineHeight: 1 }}>{score}<span style={{ fontSize: 18, color: "#445", fontWeight: 400 }}> pts</span></div>
          <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 700, color: "#556", letterSpacing: 3, marginTop: 4 }}>{score > 500 ? "ELITE SOC ANALYST 🏆" : score > 250 ? "COMPETENT ANALYST 🎯" : "NEEDS MORE TRAINING ⚠"}</div>
        </div>
        <div style={{ background: "#0a0a1a", border: `2px solid ${suscColor}44`, borderRadius: 14, padding: 24, margin: "8px 0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <div><div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 13, color: "#445", letterSpacing: 3, marginBottom: 4 }}>PHISHING SUSCEPTIBILITY</div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 28 }}>{suscIcon}</span><span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: suscColor }}>{suscLabel}</span></div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: SYNE, fontSize: 52, fontWeight: 900, color: suscColor, lineHeight: 1 }}>{susc}<span style={{ fontSize: 20, color: "#445" }}>%</span></div><div style={{ fontSize: 10, color: "#445", letterSpacing: 2 }}>SUSCEPTIBLE</div></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#445", letterSpacing: 2, marginBottom: 6 }}><span>NOT SUSCEPTIBLE</span><span>HIGHLY SUSCEPTIBLE</span></div>
            <div style={{ height: 10, borderRadius: 5, background: "#0d0d1e", overflow: "hidden", position: "relative" }}><div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#00ff88,#66ffaa,#ffcc00,#ff8800,#ff3355)", borderRadius: 5, opacity: .3 }} /><div style={{ position: "relative", height: "100%", width: `${susc}%`, background: `linear-gradient(90deg,#00ff88,${suscColor})`, borderRadius: 5, transition: "width 1.2s cubic-bezier(.22,1,.36,1)", boxShadow: `0 0 10px ${suscColor}` }} /></div>
          </div>
          <div style={{ fontSize: 13, color: "#8899bb", lineHeight: 1.7, marginBottom: 12 }}>{suscDesc}</div>
          <div style={{ padding: "10px 14px", background: `${suscColor}0d`, border: `1px solid ${suscColor}33`, borderRadius: 8, fontSize: 12, color: suscColor, lineHeight: 1.7 }}>💡 <strong>Recommendation:</strong> {suscAdvice}</div>
        </div>
        <div style={{ textAlign: "center" }}><button style={{ ...btnStyle("#6644ff"), padding: "13px 36px" }} onClick={reset}>RETRY DRILLS</button></div>
      </div>
    );
  }

  const sc = session[idx], timeColor = time > 15 ? "#00ff88" : time > 7 ? "#ffcc00" : "#ff3355";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Label>Triage Drill {idx + 1}/{session.length} · Streak: <span style={{ color: "#ffcc00" }}>{streak}🔥</span></Label>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ fontFamily: MONO, fontSize: 12, color: "#6677aa" }}>Score: {score}</span><div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${timeColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SYNE, fontWeight: 900, fontSize: 16, color: timeColor }}>{time}</div></div>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Tag color="#6644ff">{sc.type.toUpperCase()}</Tag><span style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: "#dde" }}>{sc.label}</span></div>
        <div style={{ background: "#0d0d1e", border: "1px solid #1a1a30", borderRadius: 8, padding: 16, fontFamily: MONO, fontSize: 12, color: "#8899bb", whiteSpace: "pre-wrap", lineHeight: 1.8, marginBottom: 18 }}>{sc.content}</div>
        {pick === null && <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>{["SAFE", "SUSPICIOUS", "DANGER"].map(r => <button key={r} onClick={() => answer(r)} style={{ ...btnStyle(RISK_CFG[r].color), padding: "14px 28px", fontSize: 14 }}>{RISK_CFG[r].icon} {r}</button>)}</div>}
        {pick !== null && <div style={{ animation: "fadeIn .3s ease" }}>
          <InfoBox color={pick === sc.correct ? "#00ff88" : "#ff3355"}>{pick === sc.correct ? `✓ CORRECT! +${Math.max(10, time * 3)} points` : `✕ ${pick === "TIMEOUT" ? "Time's up!" : "Wrong!"} Correct answer: ${sc.correct}`}</InfoBox>
          <div style={{ marginTop: 10, padding: "12px 16px", background: "rgba(102,68,255,.06)", border: "1px solid rgba(102,68,255,.2)", borderRadius: 7, fontSize: 12, color: "#9999dd" }}>💡 {sc.explain}</div>
          <div style={{ marginTop: 12, textAlign: "right" }}><button style={btnStyle("#6644ff")} onClick={next}>{idx + 1 >= session.length ? "SEE SCORE →" : "NEXT →"}</button></div>
        </div>}
      </Card>
    </div>
  );
}
