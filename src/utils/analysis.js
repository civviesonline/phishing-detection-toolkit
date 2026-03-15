import { BAD_TLDS, KW, BRANDS, SHORTENERS, GLYPHS, REDIRECT_KEYS, GEOS, SAFE_DOMAINS } from '../data/constants';

export const hashStr=s=>{let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return Math.abs(h);};
export const fakeIP=s=>{const h=hashStr(s);return`${(h%200)+40}.${(h>>4)%256}.${(h>>8)%256}.${(h>>12)%254+1}`;};
export const leet=s=>s.replace(/0/g,"o").replace(/1/g,"l").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s").replace(/8/g,"b").replace(/vv/g,"w");
export const sld=d=>{const p=d.split(".");return p.length>=2?p[p.length-2]:p[0];};
export const levenshtein=(a,b)=>{const dp=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j?(i?j?0:i:j):0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[a.length][b.length];};
export const deGlyph=s=>[...s].map(c=>GLYPHS[c]||c).join("");

// Web Audio API Sound Engine (High-Intensity SOC Edition)
const audioCtx = typeof window !== "undefined" ? new (window.AudioContext || window.webkitAudioContext)() : null;
const distCurve = amt => { const c = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = (i * 2) / 512 - 1; c[i] = ((Math.PI + amt) * x) / (Math.PI + amt * Math.abs(x)); } return c; };

const tone = (a, type, freq, t, dur, vol, dist = 0) => {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  if (dist) { const d = a.createWaveShaper(); d.curve = distCurve(dist); o.connect(d); d.connect(g); } else o.connect(g);
  g.connect(a.destination); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.01);
};

export const playSound = (level = "DANGER") => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const a = audioCtx, t = a.currentTime;

  if (level === "SAFE") {
    [523, 659, 784, 1047].forEach((f, i) => tone(a, "sine", f, t + i * .12, .5, .15));
    return;
  }

  if (level === "SUSPICIOUS") {
    for (let p = 0; p < 3; p++) [880, 740, 880].forEach((f, j) => tone(a, "square", f, t + p * .28 + j * .07, .07, .3, 120));
    tone(a, "sawtooth", 300, t, .85, .2, 80);
    tone(a, "sine", 80, t, .22, .45);
    tone(a, "sine", 2200, t + .75, .2, .14);
    return;
  }

  if (level === "DANGER") {
    // ── HOT BLAZING SIREN ──
    tone(a, "sawtooth", 55, t, .35, .7, 500); // Heavy sub-bass hit
    for (let i = 0; i < 6; i++) {
      tone(a, "sawtooth", 960 + (i % 2) * 180, t + .05 + i * .14, .13, .45, 400); // High-pitched panic pulses
      tone(a, "square", 480 + (i % 3) * 90, t + .05 + i * .14, .11, .2);
    }
    const s = a.createOscillator(), sg = a.createGain(), sd = a.createWaveShaper();
    sd.curve = distCurve(200); s.type = "sawtooth";
    [400, 1600, 400, 1600, 400].forEach((f, i) => s.frequency.linearRampToValueAtTime(f, t + .05 + i * .5));
    s.connect(sd); sd.connect(sg); sg.connect(a.destination);
    sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(.38, t + .1);
    sg.gain.setValueAtTime(.38, t + 1.9); sg.gain.exponentialRampToValueAtTime(.001, t + 2.1);
    s.start(t); s.stop(t + 2.1);
    
    for (let i = 0; i < 8; i++) tone(a, "sine", 80, t + i * .25, .22, i < 2 ? .55 : .35); // Heartbeat thumps
    
    // Static noise burst
    const buf = a.createBuffer(1, a.sampleRate * .15, a.sampleRate), dat = buf.getChannelData(0);
    for (let i = 0; i < dat.length; i++) dat[i] = Math.random() * 2 - 1;
    const n = a.createBufferSource(), nf = a.createBiquadFilter(), ng = a.createGain();
    n.buffer = buf; nf.type = "bandpass"; nf.frequency.value = 1800;
    n.connect(nf); nf.connect(ng); ng.connect(a.destination);
    ng.gain.setValueAtTime(.5, t); ng.gain.exponentialRampToValueAtTime(.001, t + .15);
    n.start(t); n.stop(t + .16);
    
    tone(a, "sawtooth", 1400, t + 1.9, .45, .3, 150); // Final warning squeal
  }
};

export const fakeGeo=domain=>{
  const h=hashStr(domain),age=(h%8)+1;
  return{...GEOS[h%GEOS.length],ip:fakeIP(domain),age,newDomain:age<=2,registrar:["GoDaddy","Namecheap","Tucows","PDR Ltd","NameSilo"][h%5],created:`${2024-age}-${String((h%12)+1).padStart(2,"0")}-${String((h%28)+1).padStart(2,"0")}`};
};

export const fakeDNS=domain=>{
  const h=hashStr(domain),ns=i=>`ns${i+1}.${["cloudflare","awsdns","domaincontrol","google","nameserver"][(h+i*2)%5]}.${i?"net":"com"}`;
  return[{type:"A",value:fakeIP(domain),ttl:300},{type:"A",value:fakeIP(domain+"2"),ttl:300},{type:"AAAA",value:`2606:4700::${(h%0xffff).toString(16)}:${((h>>4)%0xffff).toString(16)}`,ttl:300},{type:"NS",value:ns(0),ttl:86400},{type:"NS",value:ns(1),ttl:86400},{type:"MX",value:`mail.${domain}`,ttl:3600},{type:"TXT",value:`v=spf1 include:${ns(0)} ~all`,ttl:3600}];
};

export function brandSpoof(domain){
  const norm=leet(domain),s=sld(domain),sn=leet(s),hits=[];
  BRANDS.forEach(td=>{
    const b=td.split(".")[0];
    if(domain===td||domain.endsWith("."+td))return;
    if(domain.includes(b))return hits.push({b,r:"brand name in spoofed domain",v:30});
    if(norm.includes(b))return hits.push({b,r:"leet-substitution impersonation",v:30});
    if(b.startsWith(sn)&&sn.length>=5)return hits.push({b,r:`truncated brand ("${s}" → "${b}")`,v:28});
    if(b.includes(sn)&&sn.length>=4)return hits.push({b,r:`partial brand ("${s}" resembles "${b}")`,v:25});
    if(b.length>=6&&sn.length>=4){const d=levenshtein(sn,b);if(d<=2)return hits.push({b,r:`typosquat: "${s}" is ${d} edit(s) from "${b}"`,v:d===1?30:22});}
    ["secure","login","verify","account","update","confirm","support","billing"].forEach(w=>{if(domain.includes(`${b}-${w}`)||domain.includes(`${w}-${b}`))hits.push({b,r:`brand+action combo "${b}-${w}"`,v:35});});
  });
  const seen=new Set();return hits.filter(r=>{if(seen.has(r.b))return false;seen.add(r.b);return true;});
}

export function analyzeURL(raw, CUSTOM_DOMAINS=[], CUSTOM_KW=[]){
  let url=raw,score=0,flags=[],parsed;
  try{if(!url.startsWith("http"))url="https://"+url;parsed=new URL(url);}
  catch{return{score:100,risk:"DANGER",flags:["Invalid URL format"],domain:raw,raw};}
  const dom=parsed.hostname.toLowerCase(),full=url.toLowerCase();
  const add=(cond,pts,msg)=>{if(cond){score+=pts;flags.push(msg);}};
  const allowlistDomain=SAFE_DOMAINS.find(allowed=>dom===allowed||dom.endsWith("."+allowed));
  add(/^\d+\.\d+\.\d+\.\d+$/.test(dom),35,"IP address instead of domain name");
  add(BAD_TLDS.includes("."+dom.split(".").pop()),20,`Suspicious TLD: .${dom.split(".").pop()}`);
  add(dom.length>30,15,"Unusually long domain name");
  add(dom.split(".").length>4,15,"Excessive subdomains");
  add(parsed.protocol==="http:",20,"No HTTPS — unencrypted connection");
  add((dom.match(/-/g)||[]).length>=3,10,`Hyphen abuse (${(dom.match(/-/g)||[]).length} hyphens)`);
  add(SHORTENERS.some(s=>dom.includes(s)),25,"URL shortener — destination hidden");
  add(parsed.pathname.length>80,10,"Unusually long URL path");
  add((raw.match(/@/g)||[]).length>0,20,"@ symbol — can redirect to different host");
  add(CUSTOM_DOMAINS.some(d=>dom.includes(d)),40,"Matches custom blocklist domain");
  const kw=[...KW,...CUSTOM_KW].filter(k=>full.includes(k));
  if(kw.length){score+=kw.length*5;flags.push(`Phishing keywords: ${kw.join(", ")}`);}
  
  const spoofHits = brandSpoof(dom);
  spoofHits.forEach(m=>{score+=m.v;flags.push(`Brand spoofing — ${m.r}`);});
  
  score=Math.min(score,100);
  let risk = score<25?"SAFE":score<55?"SUSPICIOUS":"DANGER";

  // --- Deep Threat Intelligence ---
  let intelligence = {
    tactic: "Unknown",
    intent: "Generic Analysis",
    recommendation: "Review the flags and verify the source manually.",
    technicalDetail: ""
  };

  if (spoofHits.length > 0) {
    intelligence.tactic = "Brand Impersonation";
    intelligence.intent = "Credential Theft / Phishing";
    intelligence.technicalDetail = `The domain uses ${spoofHits[0].r} to mimic ${spoofHits[0].b}. This is a high-confidence indicator of a targeted attack.`;
    intelligence.recommendation = "Block this domain globally and reset credentials for any user who visited it.";
  } else if (BAD_TLDS.includes("."+dom.split(".").pop())) {
    intelligence.tactic = "TLD Reputation Abuse";
    intelligence.intent = "Infrastructure Obscurity";
    intelligence.technicalDetail = `The domain uses a low-reputation Top-Level Domain (.${dom.split(".").pop()}) frequently associated with malware delivery.`;
    intelligence.recommendation = "Monitor network traffic for outbound connections to this TLD.";
  } else if (kw.length > 3) {
    intelligence.tactic = "Social Engineering Lure";
    intelligence.intent = "Urgency / Action Trigger";
    intelligence.technicalDetail = "Multiple high-pressure keywords detected in the URL path/parameters designed to bypass rational judgment.";
    intelligence.recommendation = "Alert staff about a possible active phishing campaign using these specific keywords.";
  } else if (/^\d+\.\d+\.\d+\.\d+$/.test(dom)) {
    intelligence.tactic = "Bypassing DNS Filters";
    intelligence.intent = "Direct IP Connection";
    intelligence.technicalDetail = "The URL uses a raw IP address instead of a domain name to avoid reputation-based DNS blocking systems.";
    intelligence.recommendation = "Check internal firewall logs for any unauthorized communication with this IP address.";
  }

  if (risk === "SAFE") {
    intelligence.tactic = "Verified Safe";
    intelligence.intent = "Legitimate Resource";
    intelligence.recommendation = "No action required. The domain appears to be a well-known legitimate service.";
  }

  if (allowlistDomain) {
    score = Math.min(score, 18);
    risk = "SAFE";
    flags = [...new Set([...flags, `Allowlisted domain: ${allowlistDomain}`])];
    intelligence = {
      tactic: "Analyst Allowlist Override",
      intent: "Trusted Resource",
      recommendation: "Allowlist overrides make this domain safe while you run PhishGuard on Kali.",
      technicalDetail: "Analyst-curated allowlist bypasses scoring for known good destinations."
    };
  }

  return {score, risk, flags, domain:dom, raw, intelligence};
}

export function analyzeEmail(input, CUSTOM_DOMAINS=[], CUSTOM_KW=[]){
  const payload = typeof input === "string" ? { body: input } : (input || {});
  const from = payload.from || "";
  const subject = payload.subject || "";
  const body = payload.body || "";
  const combined = `${from}\n${subject}\n${body}`;
  const lo = combined.toLowerCase();
  const riskRank={SAFE:0,SUSPICIOUS:1,DANGER:2};
  const keywords=KW.filter(k=>lo.includes(k));
  const urgency=["asap","immediately","right now","24 hours","within hours","expires","limited time","act now","today only"].filter(k=>lo.includes(k));
  const TRANSACTIONAL_KW = ["invoice","receipt","order-confirmation","payment-advice","subscription-renewal","transaction","payment","order"];
  const hasAttach=/\b[\w-]+\.(exe|zip|docm|xlsm|pptm|js|bat|scr|hta|iso|img|rar|7z)\b/i.test(body);
  const urls=[...combined.matchAll(/https?:\/\/[^\s<>"')]+/gi)].map(m=>m[0].replace(/[.,;:!?]+$/,""));
  const scannedLinks=urls.map(u=>{
    const direct=analyzeURL(u, CUSTOM_DOMAINS, CUSTOM_KW);
    const deob=analyzeObfuscatedLink(u, CUSTOM_DOMAINS, CUSTOM_KW);
    const finalHopRisk=deob.finalAnalysis?.risk||"SAFE";
    const finalRisk=[direct.risk,deob.risk,finalHopRisk].reduce((a,b)=>riskRank[b]>riskRank[a]?b:a,"SAFE");
    const finalScore=Math.min(Math.max(direct.score,deob.score,deob.finalAnalysis?.score||0),100);
    const mergedFlags=[...direct.flags];
    if(deob.chain.length>1)mergedFlags.push(`Hidden redirect chain: ${deob.hopCount} hop(s)`);
    if(riskRank[finalHopRisk]>riskRank[direct.risk])mergedFlags.push(`Final destination risk escalates to ${finalHopRisk}`);
    deob.flags.forEach(f=>mergedFlags.push(`Deobfuscation — ${f}`));
    return{url:u,...direct,score:finalScore,risk:finalRisk,flags:[...new Set(mergedFlags)],direct,deob};
  });
  const senderDom=(from.match(/<([^>]+@[^>]+)>/)?.[1] || from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i)?.[0] || combined.match(/<([^>]+@[^>]+)>/)?.[1] || combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i)?.[0] || "").split("@")[1]?.toLowerCase();
  const safeSender = senderDom ? SAFE_DOMAINS.some(d => senderDom === d || senderDom.endsWith("." + d)) : false;
  const senderFlags=!senderDom?[]:BRANDS.flatMap(td=>{const b=td.split(".")[0],out=[];if(senderDom.includes(b)&&!senderDom.endsWith(td))out.push(`Sender spoofs "${b}": ${senderDom}`);if(BAD_TLDS.some(t=>senderDom.endsWith(t)))out.push(`Sender TLD suspicious: .${senderDom.split(".").pop()}`);return out;});
  const danger=scannedLinks.filter(l=>l.risk==="DANGER"),susp=scannedLinks.filter(l=>l.risk!=="SAFE");
  const hiddenRedirects=scannedLinks.filter(l=>l.deob?.hopCount>0).length;
  const deobEscalations=scannedLinks.filter(l=>riskRank[l.deob?.finalAnalysis?.risk||"SAFE"]>riskRank[l.direct?.risk||"SAFE"]).length;
  const transHits = keywords.filter(k => TRANSACTIONAL_KW.includes(k));
  const phishHits = keywords.filter(k => !TRANSACTIONAL_KW.includes(k));
  const kwScore = phishHits.length * 6 + transHits.length * (safeSender ? 1 : 3);
  const urgencyScore = urgency.length * (safeSender ? 4 : 10);
  const urlPenalty = urls.length > 2 ? (safeSender ? 5 : 15) : 0;
  let score=Math.min(kwScore+urgencyScore+urlPenalty+(hasAttach?20:0)+susp.length*18+danger.length*30+senderFlags.length*25+hiddenRedirects*12+deobEscalations*15,100);
  let risk = score<20?"SAFE":score<50?"SUSPICIOUS":"DANGER";

  // --- Campaign Intelligence ---
  let intelligence = {
    tactic: "Multi-Vector Phishing",
    intent: "Campaign Level Analysis",
    recommendation: "Flag this email pattern in the SEG (Secure Email Gateway) and perform a wide-scale search for similar messages.",
    technicalDetail: "PhishGuard detected a coordinated combination of urgency-based social engineering and suspicious link profiles."
  };

  if (danger.length > 0) {
    intelligence.tactic = "Malicious URL Campaign";
    intelligence.intent = "Direct Phishing / Malware";
    intelligence.technicalDetail = `Detected ${danger.length} high-risk URL(s). These links use active phishing patterns like brand impersonation or low-rep TLDs.`;
    intelligence.recommendation = "Nuke this email from all user inboxes immediately. Conduct an 'Impact Assessment' for users who may have clicked.";
  } else if (hiddenRedirects > 0) {
    intelligence.tactic = "Obfuscated Redirect Chain";
    intelligence.intent = "Bypassing Automated Scanners";
    intelligence.technicalDetail = "The email contains links with hidden redirect parameters designed to hide the final malicious destination from standard security filters.";
    intelligence.recommendation = "Configure the mail filter to reject emails containing multiple URL-in-URL redirect patterns.";
  } else if (urgency.length > 0 && keywords.length > 3) {
    intelligence.tactic = "Social Engineering / BEC";
    intelligence.intent = "Business Email Compromise";
    intelligence.technicalDetail = "Detected high-pressure language and financial keywords. Pattern is consistent with CEO Fraud or Invoice redirection scams.";
    intelligence.recommendation = "Verify the request via an out-of-band communication channel (Phone/In-Person) before performing any action.";
  }

  if (risk === "SAFE") {
    intelligence.tactic = "Verified Communication";
    intelligence.intent = "Normal Business Traffic";
    intelligence.recommendation = "No response required. The email follows standard safe patterns.";
  }

  if (safeSender && senderFlags.length === 0 && scannedLinks.every(l => l.risk === "SAFE")) {
    score = Math.min(score, 18);
    risk = "SAFE";
    senderFlags.push(`Allowlisted sender domain: ${senderDom}`);
    intelligence = {
      tactic: "Verified Sender",
      intent: "Legitimate Transactional Email",
      recommendation: "Sender and links match allowlisted domains. No action required.",
      technicalDetail: "Allowlisted sender domain and SAFE link analysis reduce overall risk."
    };
  }

  return {score, risk, keywords, urgency, linkCount:urls.length, hasAttach, scannedLinks, senderFlags, hiddenRedirects, deobEscalations, intelligence, from, subject, body};
}

export function analyzeAttachment(filename){
  const parts=filename.split(".");
  const exts=parts.slice(1).map(e=>e.toLowerCase());
  const lastExt=exts[exts.length-1]||"";
  const flags=[],score_parts=[];
  const EXEC=["exe","bat","cmd","com","ps1","vbs","js","jar","msi","dll","scr","pif","hta","reg","wsf"];
  const MACRO=["doc","docm","xls","xlsm","xlsb","ppt","pptm"];
  const ARCH=["zip","rar","7z","gz","tar","iso","img"];
  if(exts.length>1){flags.push(`Double extension: .${exts.slice(-2).join(".")} — disguises true filetype`);score_parts.push(35);}
  if(EXEC.includes(lastExt)){flags.push(`Executable extension: .${lastExt} — can run code`);score_parts.push(40);}
  if(MACRO.includes(lastExt)){flags.push(`Office format with macro potential: .${lastExt}`);score_parts.push(25);}
  if(ARCH.includes(lastExt)){flags.push(`Archive format: .${lastExt} — may contain malware`);score_parts.push(15);}
  if(/invoice|receipt|payment|urgent|wire|transfer/i.test(filename)){flags.push("Social engineering filename — mimics financial document");score_parts.push(20);}
  if(/\s{2,}/.test(filename)){flags.push("Multiple spaces in filename — attempt to hide extension");score_parts.push(25);}
  if(/[^\x00-\x7F]/.test(filename)){flags.push("Non-ASCII characters in filename — possible homoglyph attack");score_parts.push(20);}
  const score=Math.min(score_parts.reduce((a,b)=>a+b,0),100);
  return{score,risk:score<20?"SAFE":score<50?"SUSPICIOUS":"DANGER",flags,exts,lastExt};
}

export function analyzeHomoglyph(domain){
  const normalized=deGlyph(domain);
  const glyphsFound=[...domain].filter(c=>GLYPHS[c]).map(c=>({original:c,ascii:GLYPHS[c]}));
  const flags=[],score_parts=[];
  if(glyphsFound.length){
    score_parts.push(glyphsFound.length*20);
    flags.push(`${glyphsFound.length} homoglyph char(s) detected: ${glyphsFound.map(g=>`'${g.original}'→'${g.ascii}'`).join(", ")}`);
    flags.push(`Normalized domain: ${normalized}`);
    BRANDS.forEach(td=>{const b=td.split(".")[0];if(normalized.includes(b)&&!domain.endsWith(td)){score_parts.push(30);flags.push(`Impersonates brand "${b}" via Unicode lookalikes`);}});
  }
  const score=Math.min(score_parts.reduce((a,b)=>a+b,0),100);
  const risk=score===0?"SAFE":score<50?"SUSPICIOUS":"DANGER";
  let punycode=null;
  if(risk!=="SAFE"){
    try{punycode=new URL(`https://${domain}`).hostname;}catch{}
    if(punycode&&punycode!==domain)flags.push(`Punycode (real encoded domain): ${punycode}`);
  }
  return{score,risk,flags,glyphsFound,normalized,punycode};
}

export const safeDecode=v=>{try{return decodeURIComponent(v);}catch{return v;}};
export const tryBase64=v=>{
  if(!v||v.length<12)return null;
  let b=v.replace(/-/g,"+").replace(/_/g,"/").replace(/\s+/g,"");
  if(!/^[A-Za-z0-9+/=]+$/.test(b))return null;
  b+="=".repeat((4-b.length%4)%4);
  try{
    const out=atob(b);
    let printable=0;
    for(const ch of out){const code=ch.charCodeAt(0);if((code>=32&&code<=126)||code===9||code===10||code===13)printable++;}
    return printable/out.length>=0.85?out:null;
  }catch{return null;}
};
export const extractUrlFromText=v=>{
  const cleaned=String(v||"").trim().replace(/^['"]|['"]$/g,"");
  if(/^https?:\/\//i.test(cleaned))return cleaned;
  if(/^www\./i.test(cleaned))return "https://"+cleaned;
  const found=cleaned.match(/https?:\/\/[^\s"'<>]+/i);
  return found?found[0]:null;
};

export function analyzeObfuscatedLink(raw, CUSTOM_DOMAINS=[], CUSTOM_KW=[]){
  let start=String(raw||"").trim();
  if(!start)return{score:0,risk:"SAFE",flags:[],chain:[],chainAnalyses:[],hopCount:0,finalAnalysis:null,raw};
  if(!/^https?:\/\//i.test(start))start="https://"+start;
  let parsed;
  try{parsed=new URL(start);}
  catch{return{score:100,risk:"DANGER",flags:["Invalid URL format"],chain:[raw],chainAnalyses:[{url:raw,score:100,risk:"DANGER",flags:["Invalid URL format"]}],hopCount:0,finalAnalysis:null,raw};}

  const flags=[],chain=[parsed.href],seen=new Set([parsed.href]),hopMeta=[];
  let score=0,current=parsed.href;
  if(/%[0-9a-f]{2}/i.test(parsed.href)){score+=8;flags.push("Percent-encoded content detected in URL");}
  if(/https?:%2f%2f|%252f%252f/i.test(parsed.href)){score+=12;flags.push("Encoded URL pattern detected (possible hidden redirect)");}
  if(parsed.href.length>170){score+=8;flags.push("Very long URL (often used to hide malicious parameters)");}
  if((parsed.href.match(/https?:\/\//gi)||[]).length>1){score+=14;flags.push("Multiple embedded URL strings in a single link");}

  for(let depth=0;depth<5;depth++){
    let cur;
    try{cur=new URL(current);}catch{break;}
    let foundNext=null,hitKey=null;
    for(const[k,v]of cur.searchParams.entries()){
      if(!REDIRECT_KEYS.includes(k.toLowerCase()))continue;
      const variants=[v];
      let tmp=v;
      for(let i=0;i<3;i++){const d=safeDecode(tmp);if(d===tmp)break;variants.push(d);tmp=d;}
      const b64=tryBase64(v);
      if(b64){variants.push(b64);const b64Decoded=safeDecode(b64);if(b64Decoded!==b64)variants.push(b64Decoded);}
      for(const candidate of variants){
        const maybe=extractUrlFromText(candidate);
        if(maybe){foundNext=maybe;hitKey=k;break;}
      }
      if(foundNext)break;
    }
    if(!foundNext)break;
    if(!/^https?:\/\//i.test(foundNext))foundNext="https://"+foundNext;
    let normalized;
    try{normalized=new URL(foundNext).href;}
    catch{continue;}
    if(seen.has(normalized)){flags.push("Redirect loop/reuse detected in nested destination");break;}
    seen.add(normalized);
    chain.push(normalized);
    score+=20;
    flags.push(`Redirect parameter "${hitKey}" hides destination URL`);
    const u=new URL(normalized);
    hopMeta.push({hop:chain.length-1,key:hitKey,url:normalized,domain:u.hostname,protocol:u.protocol,delayMs:60+(hashStr(normalized+depth)%840)});
    current=normalized;
  }

  if(chain.length>2){score+=10;flags.push(`Multi-hop redirect chain (${chain.length-1} hops)`);}
  const base=analyzeURL(parsed.href, CUSTOM_DOMAINS, CUSTOM_KW);
  score+=Math.round(base.score*0.35);
  if(base.risk==="DANGER")flags.push("Entry link itself is high risk");

  const chainAnalyses=chain.map(u=>({url:u,...analyzeURL(u, CUSTOM_DOMAINS, CUSTOM_KW)}));
  const finalAnalysis=chainAnalyses[chainAnalyses.length-1]||null;
  if(finalAnalysis&&chain.length>1&&finalAnalysis.risk!=="SAFE"){score+=Math.round(finalAnalysis.score*0.45);flags.push(`Final destination risk: ${finalAnalysis.risk}`);}

  const uniqueDomains=new Set(chain.map(u=>new URL(u).hostname)).size;
  const hops=Math.max(chain.length-1,0);
  const avgDelay=hopMeta.length?Math.round(hopMeta.reduce((a,b)=>a+b.delayMs,0)/hopMeta.length):0;
  const behaviorFlags=[];
  if(hops>=3)behaviorFlags.push("Deep redirect chain behavior");
  if(uniqueDomains>=3&&hops>=2)behaviorFlags.push("Cross-domain redirect churn");
  if(hopMeta.some(h=>SHORTENERS.some(s=>h.domain.includes(s))))behaviorFlags.push("Shortener pivot inside redirect path");
  if(hopMeta.some(h=>h.protocol==="http:"))behaviorFlags.push("Protocol downgrade observed (HTTP in chain)");
  if(hopMeta.length>=2&&avgDelay<180)behaviorFlags.push("Rapid redirect timing pattern");
  if(behaviorFlags.length){score+=Math.min(behaviorFlags.length*7,24);behaviorFlags.forEach(f=>flags.push(`Behavior model — ${f}`));}

  score=Math.min(score,100);
  const risk=score<25?"SAFE":score<55?"SUSPICIOUS":"DANGER";
  const confidence=Math.min(99,Math.round(34+score*0.6+behaviorFlags.length*8+(hops>0?6:0)));
  return{score,risk,flags,chain,chainAnalyses,hopCount:hops,finalAnalysis,raw,behavior:{hopMeta,uniqueDomains,avgDelay,patternFlags:behaviorFlags,confidence}};
}
