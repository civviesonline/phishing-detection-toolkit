import React, { useState } from "react";
import { useTheme, Card, Label, InfoBox, btnStyle } from "../shared/UI";
import { MONO, SYNE } from "../../data/constants";

export const QUIZ_BANK = [
  { q: "An email link leads to 'paypa1.com/login'. What's wrong?", a: 0, opts: ["Leet substitution — '1' replaces 'l' to spoof PayPal", "Nothing, it looks fine", "Only suspicious if HTTP", "Only risky on mobile"], x: "Leet substitution swaps characters to mimic real brands. 'paypa1.com' is not PayPal." },
  { q: "Which domain is most likely a phishing attempt?", a: 2, opts: ["mail.google.com", "accounts.paypal.com", "paypal-secure-login.com", "support.apple.com"], x: "'paypal-secure-login.com' is a separate domain with the brand name used as a subdirectory trick." },
  { q: "A URL contains your bank name followed by '.xyz'. What do you do?", a: 1, opts: ["Click — it has your bank's name", "Avoid it — .xyz is a suspicious TLD", "Click if it has HTTPS", "Only avoid on desktop"], x: ".xyz is commonly used in phishing domains. Your real bank uses a well-known TLD like .com." },
  { q: "What does a URL shortener like bit.ly hide?", a: 2, opts: ["Your IP address", "Your browser version", "The true destination URL", "Your email address"], x: "URL shorteners mask the real destination, making it impossible to verify safety before clicking." },
  { q: "You see 'https://google.com.malicious-site.ru'. Which domain is this actually on?", a: 1, opts: ["google.com", "malicious-site.ru", "google.ru", "com.malicious-site"], x: "The real domain is always the part just before the first single slash — 'malicious-site.ru'." },
  { q: "An email has a link showing 'paypal.com' as display text but the actual URL is different. This is:", a: 0, opts: ["Link spoofing — a classic phishing technique", "Normal — display text is always the URL", "Safe if HTTPS", "Fine if the email looks official"], x: "Attackers display a trusted URL as text while the actual hyperlink points elsewhere. Always hover to check." },
  { q: "Which of these URLs is safest to enter your password on?", a: 3, opts: ["http://bank.com/login", "https://bank.com.secure-login.xyz/login", "https://192.168.1.1/bank-login", "https://bank.com/login"], x: "Only the last option uses HTTPS on the real bank.com domain without any suspicious additions." },
  { q: "A domain has 4 hyphens in it. This is:", a: 2, opts: ["Normal for long company names", "Only suspicious if .tk TLD", "A red flag — hyphens are abused in phishing domains", "Fine if HTTPS"], x: "Multiple hyphens are a classic phishing domain pattern: 'secure-paypal-account-verify.com'." },
  { q: "What does an @ symbol in a URL like 'https://google.com@evil.com' do?", a: 1, opts: ["It's a mailto link", "Routes to evil.com — everything before @ is ignored", "Logs you into google.com", "Encodes special characters"], x: "Browsers treat the text before @ as credentials and navigate to what follows — 'evil.com' in this case." },
  { q: "A website uses HTTPS. Does that mean it's safe?", a: 1, opts: ["Yes — HTTPS guarantees safety", "No — HTTPS only encrypts traffic, phishing sites use it too", "Yes if padlock is green", "Only safe on banking sites"], x: "HTTPS encrypts your connection but says nothing about the site's intentions. Phishing sites use HTTPS freely." },
  { q: "You receive: 'Your Apple ID was used in Russia. Verify now: http://apple-id-verify.top/confirm' — what do you do?", a: 2, opts: ["Click — Apple security alerts are real", "Forward to Apple", "Go to appleid.apple.com directly to check", "Reply asking for more details"], x: "Apple security notices come from apple.com. Always navigate directly — 'apple-id-verify.top' is a phishing domain." },
  { q: "An email has your full name, job title, and manager's name. It asks you to buy gift cards urgently. This is:", a: 3, opts: ["Likely legitimate since they know you", "Only suspicious if the gift card amount is high", "A coincidence — your info is public", "Spear phishing — personal details make it convincing but it's still a scam"], x: "Attackers research LinkedIn and company websites. Personalization makes phishing more convincing, not more legitimate." },
  { q: "You receive an invoice from a familiar vendor but with new bank details. You should:", a: 0, opts: ["Call the vendor on their known number to verify before paying", "Pay it — the invoice looks identical to previous ones", "Email back to confirm", "Ask a colleague to review it"], x: "Invoice fraud is extremely common. Attackers compromise vendor email and swap bank details. Always verify by phone." },
  { q: "An IT helpdesk ticket asks you to install remote access software. Best action?", a: 1, opts: ["Install it — IT requests are legitimate", "Verify the request through the official helpdesk system before installing anything", "Install it if the email looks official", "Ask a colleague if they received the same email"], x: "Attackers impersonate helpdesks to install remote access tools. Verify all such requests through official channels." }
];

export function AwarenessQuiz() {
  const QUIZ_SIZE = 10;
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const newSession = () => shuffle(QUIZ_BANK).slice(0, QUIZ_SIZE);
  const [qi, setQi] = useState(0), [qs, setQs] = useState(0), [pick, setPick] = useState(null), [done, setDone] = useState(false), [results, setResults] = useState([]), [session, setSession] = useState(() => newSession());
  const reset = () => { setSession(newSession()); setQi(0); setQs(0); setPick(null); setDone(false); setResults([]); };
  
  if (done) {
    const pct = Math.round((qs / session.length) * 100), susc = 100 - pct;
    const { sc: suscColor, label: suscLabel, desc: suscDesc, icon: suscIcon, advice: suscAdvice } =
      susc <= 20 ? { sc: "#00ff88", label: "Very Low Risk", desc: "Excellent — you correctly identified nearly all phishing tactics tested.", icon: "🛡️", advice: "Share your knowledge with colleagues. Consider taking advanced threat analysis training." } :
      susc <= 40 ? { sc: "#66ffaa", label: "Low Risk", desc: "Good awareness overall. A few techniques still slipped past you.", icon: "✅", advice: "Review the questions you missed and revisit those specific attack patterns." } :
      susc <= 60 ? { sc: "#ffcc00", label: "Moderate Risk", desc: "You have some awareness but would likely fall for targeted phishing attacks.", icon: "⚠️", advice: "Pay closer attention to sender domains, urgency language, and unexpected attachments or links." } :
      susc <= 80 ? { sc: "#ff8800", label: "High Risk", desc: "Several common phishing techniques would likely succeed against you.", icon: "🚨", advice: "Never click email links for sensitive accounts. Always navigate directly to official websites. When in doubt — don't click." } :
      { sc: "#ff3355", label: "Very High Risk", desc: "You are highly susceptible to phishing. Most real-world attacks would likely succeed.", icon: "🔴", advice: "Stop clicking links in emails. Always type URLs manually. Enable multi-factor authentication on all accounts immediately." };
    return (
      <div style={{ animation: "fadeIn .4s ease" }}>
        <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
          <div style={{ fontFamily: SYNE, fontSize: 72, fontWeight: 900, color: qs >= Math.ceil(session.length * .75) ? "#00ff88" : qs >= Math.ceil(session.length * .5) ? "#ffcc00" : "#ff3355", lineHeight: 1 }}>{qs}<span style={{ fontSize: 28, color: "#334" }}>/{session.length}</span></div>
          <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 700, color: "#556", letterSpacing: 3, marginTop: 4 }}>{qs >= Math.ceil(session.length * .75) ? "EXPERT AWARENESS 🏆" : qs >= Math.ceil(session.length * .5) ? "SOLID — KEEP PRACTICING 🎯" : "HIGH RISK — REVIEW TACTICS ⚠"}</div>
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
        <div style={{ textAlign: "center" }}><button style={{ ...btnStyle("#6644ff"), padding: "13px 36px" }} onClick={reset}>RETAKE QUIZ</button></div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><Label>Phishing Awareness Training</Label><span style={{ fontSize: 13, color: "#445", letterSpacing: 2 }}>Q{qi + 1}/{session.length} · SCORE: <span style={{ color: "#00ff88" }}>{qs}</span></span></div>
      <Card>
        <div style={{ height: 3, background: "#0d0d1e", borderRadius: 2, marginBottom: 22, overflow: "hidden" }}><div style={{ width: `${(qi / session.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#ff3355,#ff9900)", transition: "width .5s ease", borderRadius: 2 }} /></div>
        <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, color: "#dde", lineHeight: 1.6, marginBottom: 22 }}>{session[qi].q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {session[qi].opts.map((opt, i) => {
            const chosen = pick !== null, correct = i === session[qi].a, wrong = i === pick && !correct;
            return <button key={i} onClick={() => { if (pick !== null) return; const correct = i === session[qi].a; setPick(i); setResults(r => [...r, correct]); if (correct) setQs(s => s + 1); }} style={{ background: !chosen ? "#0d0d1e" : correct ? "rgba(0,255,136,.07)" : wrong ? "rgba(255,51,85,.07)" : "#0d0d1e", border: `1px solid ${!chosen ? "#1a1a30" : correct ? "#00ff88" : wrong ? "#ff3355" : "#1a1a30"}`, borderRadius: 7, padding: "13px 16px", color: !chosen ? "#778899" : correct ? "#00ff88" : wrong ? "#ff6677" : "#778899", fontFamily: MONO, fontSize: 12, textAlign: "left", cursor: pick === null ? "pointer" : "default", display: "flex", gap: 11, alignItems: "center", transition: "all .2s" }}><span style={{ fontFamily: SYNE, fontWeight: 800, flexShrink: 0, width: 18 }}>{String.fromCharCode(65 + i)}</span>{opt}{chosen && correct && <span style={{ marginLeft: "auto" }}>✓</span>}{chosen && wrong && <span style={{ marginLeft: "auto" }}>✕</span>}</button>;
          })}
        </div>
        {pick !== null && <div style={{ marginTop: 18, padding: "13px 16px", background: "rgba(102,68,255,.06)", border: "1px solid rgba(102,68,255,.2)", borderRadius: 7, fontSize: 12, color: "#9999dd", lineHeight: 1.7, animation: "fadeIn .3s ease" }}>💡 {session[qi].x}<div style={{ marginTop: 12, textAlign: "right" }}><button style={btnStyle("#6644ff")} onClick={() => qi + 1 >= session.length ? setDone(true) : (setQi(q => q + 1), setPick(null))}>{qi + 1 >= session.length ? "SEE RESULTS →" : "NEXT →"}</button></div></div>}
      </Card>
    </div>
  );
}
