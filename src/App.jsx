import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;700;800;900&display=swap');`;
const MONO="Share Tech Mono,monospace", SYNE="Syne,sans-serif";

// ── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx=createContext({dark:true});
const useTheme=()=>useContext(ThemeCtx);

// ── Data constants ────────────────────────────────────────────────────────────
const BAD_TLDS=[".xyz",".top",".club",".work",".link",".click",".online",".site",".space",".live",".shop",".pw",".cc",".tk",".ml",".ga",".cf"];
const KW=["verify","account","suspended","login","update","confirm","secure","billing","urgent","unusual","activity","password","credential","limited","access","immediately","click","alert","warning","authenticate","validate","reactivate","expire","unlock"];
const BRANDS=["google.com","microsoft.com","apple.com","amazon.com","facebook.com","github.com","linkedin.com","twitter.com","paypal.com","netflix.com","instagram.com","whatsapp.com","adobe.com","dropbox.com"];
const SHORTENERS=["bit.ly","tinyurl.com","t.co","ow.ly","goo.gl","rb.gy","is.gd","shorturl.at","cutt.ly","tiny.cc"];
const BREACHES={"adobe.com":{y:2013,n:"153M",d:"Passwords, Emails"},"linkedin.com":{y:2021,n:"700M",d:"Emails, Phone numbers"},"dropbox.com":{y:2012,n:"68M",d:"Emails, Hashed passwords"},"myspace.com":{y:2016,n:"360M",d:"Emails, Passwords"},"yahoo.com":{y:2016,n:"3B",d:"Emails, Security Q&A"},"equifax.com":{y:2017,n:"147M",d:"SSN, DOB, Addresses"},"twitter.com":{y:2022,n:"200M",d:"Emails, Phone numbers"},"facebook.com":{y:2021,n:"533M",d:"Phone numbers, Emails"}};
const GEOS=[{country:"United States",flag:"🇺🇸",city:"Ashburn, VA",isp:"Amazon AWS",asn:"AS14618"},{country:"Netherlands",flag:"🇳🇱",city:"Amsterdam",isp:"Cloudflare",asn:"AS13335"},{country:"Russia",flag:"🇷🇺",city:"Moscow",isp:"Rostelecom",asn:"AS12389"},{country:"China",flag:"🇨🇳",city:"Beijing",isp:"China Unicom",asn:"AS4837"},{country:"Germany",flag:"🇩🇪",city:"Frankfurt",isp:"Hetzner Online",asn:"AS24940"},{country:"Nigeria",flag:"🇳🇬",city:"Lagos",isp:"MTN Nigeria",asn:"AS29465"},{country:"Brazil",flag:"🇧🇷",city:"São Paulo",isp:"Claro NXT",asn:"AS28573"},{country:"United Kingdom",flag:"🇬🇧",city:"London",isp:"BT Group",asn:"AS2856"}];
const RISK_CFG={SAFE:{color:"#00ff88",glow:"#00ff8844",label:"SAFE",icon:"✓"},SUSPICIOUS:{color:"#ffcc00",glow:"#ffcc0044",label:"SUSPICIOUS",icon:"⚠"},DANGER:{color:"#ff3355",glow:"#ff335544",label:"DANGER",icon:"✕"}};

// Homoglyph map (Cyrillic + common Unicode lookalikes → ASCII)
const GLYPHS={"а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","у":"y","і":"i","ѕ":"s","ԁ":"d","ɡ":"g","ʟ":"l","ᴍ":"m","ᴠ":"v","ʙ":"b","ᴛ":"t","ᴡ":"w","ᴋ":"k","ⅼ":"l","Ⅰ":"I","ℯ":"e","ɑ":"a","ƅ":"b","ϲ":"c","ᴦ":"r","ᴩ":"p","ɴ":"n","ᴢ":"z","ꜰ":"f","ᴊ":"j","ᴏ":"o","ᴜ":"u","ʜ":"h","ꜱ":"s","ᴅ":"d"};

// ── Utility helpers ───────────────────────────────────────────────────────────
const hashStr=s=>{let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return Math.abs(h);};
const fakeIP=s=>{const h=hashStr(s);return`${(h%200)+40}.${(h>>4)%256}.${(h>>8)%256}.${(h>>12)%254+1}`;};
const leet=s=>s.replace(/0/g,"o").replace(/1/g,"l").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s").replace(/8/g,"b").replace(/vv/g,"w");
const sld=d=>{const p=d.split(".");return p.length>=2?p[p.length-2]:p[0];};
const levenshtein=(a,b)=>{const dp=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j?(i?j?0:i:j):0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[a.length][b.length];};
const deGlyph=s=>[...s].map(c=>GLYPHS[c]||c).join("");
const fakeGeo=domain=>{const h=hashStr(domain),age=(h%8)+1;return{...GEOS[h%GEOS.length],ip:fakeIP(domain),age,newDomain:age<=2,registrar:["GoDaddy","Namecheap","Tucows","PDR Ltd","NameSilo"][h%5],created:`${2024-age}-${String((h%12)+1).padStart(2,"0")}-${String((h%28)+1).padStart(2,"0")}`};};
const fakeDNS=domain=>{const h=hashStr(domain),ns=i=>`ns${i+1}.${["cloudflare","awsdns","domaincontrol","google","nameserver"][(h+i*2)%5]}.${i?"net":"com"}`;return[{type:"A",value:fakeIP(domain),ttl:300},{type:"A",value:fakeIP(domain+"2"),ttl:300},{type:"AAAA",value:`2606:4700::${(h%0xffff).toString(16)}:${((h>>4)%0xffff).toString(16)}`,ttl:300},{type:"NS",value:ns(0),ttl:86400},{type:"NS",value:ns(1),ttl:86400},{type:"MX",value:`mail.${domain}`,ttl:3600},{type:"TXT",value:`v=spf1 include:${ns(0)} ~all`,ttl:3600}];};

// ── Analysis ──────────────────────────────────────────────────────────────────
let CUSTOM_DOMAINS=[], CUSTOM_KW=[];

function brandSpoof(domain){
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

function analyzeURL(raw){
  let url=raw,score=0,flags=[],parsed;
  try{if(!url.startsWith("http"))url="https://"+url;parsed=new URL(url);}
  catch{return{score:100,risk:"DANGER",flags:["Invalid URL format"],domain:raw,raw};}
  const dom=parsed.hostname.toLowerCase(),full=url.toLowerCase();
  const add=(cond,pts,msg)=>{if(cond){score+=pts;flags.push(msg);}};
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
  brandSpoof(dom).forEach(m=>{score+=m.v;flags.push(`Brand spoofing — ${m.r}`);});
  score=Math.min(score,100);
  return{score,risk:score<25?"SAFE":score<55?"SUSPICIOUS":"DANGER",flags,domain:dom,raw};
}

function analyzeEmail(text){
  const lo=text.toLowerCase();
  const keywords=KW.filter(k=>lo.includes(k));
  const urgency=["asap","immediately","right now","24 hours","within hours","expires","limited time","act now","today only"].filter(k=>lo.includes(k));
  const hasAttach=/\.exe|\.zip|invoice|attachment|\.doc|\.js|\.bat/i.test(text);
  const urls=[...text.matchAll(/https?:\/\/[^\s<>"')]+/gi)].map(m=>m[0].replace(/[.,;:!?]+$/,""));
  const scannedLinks=urls.map(u=>({url:u,...analyzeURL(u)}));
  const senderDom=text.match(/<([^>]+@[^>]+)>/)?.[1]?.split("@")[1]?.toLowerCase();
  const senderFlags=!senderDom?[]:BRANDS.flatMap(td=>{const b=td.split(".")[0],out=[];if(senderDom.includes(b)&&!senderDom.endsWith(td))out.push(`Sender spoofs "${b}": ${senderDom}`);if(BAD_TLDS.some(t=>senderDom.endsWith(t)))out.push(`Sender TLD suspicious: .${senderDom.split(".").pop()}`);return out;});
  const danger=scannedLinks.filter(l=>l.risk==="DANGER"),susp=scannedLinks.filter(l=>l.risk!=="SAFE");
  const score=Math.min(keywords.length*6+urgency.length*10+(urls.length>2?15:0)+(hasAttach?20:0)+susp.length*18+danger.length*30+senderFlags.length*25,100);
  return{score,risk:score<20?"SAFE":score<50?"SUSPICIOUS":"DANGER",keywords,urgency,linkCount:urls.length,hasAttach,scannedLinks,senderFlags};
}

function analyzeHeader(text){
  const lines=text.split(/\r?\n/);
  const get=key=>{const line=lines.find(l=>l.toLowerCase().startsWith(key.toLowerCase()+":"));return line?line.slice(key.length+1).trim():null;};
  const flags=[],info=[];let score=0;
  const from=get("From"),replyTo=get("Reply-To"),returnPath=get("Return-Path");
  const authResults=get("Authentication-Results")||"";
  const dkimSig=get("DKIM-Signature");
  const received=lines.filter(l=>l.toLowerCase().startsWith("received:"));
  // SPF
  const spfFail=/spf=fail|spf=softfail/i.test(authResults);
  const spfPass=/spf=pass/i.test(authResults);
  if(spfFail){score+=30;flags.push("SPF FAIL — sender IP not authorized for this domain");}
  else if(!spfPass&&text.length>50){score+=15;flags.push("SPF result missing — unable to verify sender IP");}
  else info.push("✓ SPF PASS");
  // DKIM
  const dkimFail=/dkim=fail/i.test(authResults);
  const dkimPass=/dkim=pass/i.test(authResults);
  if(dkimFail){score+=35;flags.push("DKIM FAIL — message signature invalid or tampered");}
  else if(!dkimSig&&text.length>50){score+=10;flags.push("DKIM signature missing");}
  else if(dkimPass)info.push("✓ DKIM PASS");
  // DMARC
  const dmarcFail=/dmarc=fail/i.test(authResults);
  const dmarcPass=/dmarc=pass/i.test(authResults);
  if(dmarcFail){score+=35;flags.push("DMARC FAIL — domain alignment failure");}
  else if(!dmarcPass&&text.length>50){score+=10;flags.push("DMARC result missing");}
  else if(dmarcPass)info.push("✓ DMARC PASS");
  // Reply-To mismatch
  if(from&&replyTo){
    const fromDom=from.match(/@([\w.-]+)/)?.[1]?.toLowerCase();
    const replyDom=replyTo.match(/@([\w.-]+)/)?.[1]?.toLowerCase();
    if(fromDom&&replyDom&&fromDom!==replyDom){score+=25;flags.push(`Reply-To mismatch: From @${fromDom} but Reply-To @${replyDom}`);}
  }
  // Return-Path mismatch
  if(from&&returnPath){
    const fromDom=from.match(/@([\w.-]+)/)?.[1]?.toLowerCase();
    const rpDom=returnPath.match(/@([\w.-]+)/)?.[1]?.toLowerCase();
    if(fromDom&&rpDom&&fromDom!==rpDom){score+=20;flags.push(`Return-Path mismatch: @${rpDom} vs From @${fromDom}`);}
  }
  // Hop count
  if(received.length>8){score+=10;flags.push(`Unusual relay count: ${received.length} hops (possible obfuscation)`);}
  // Suspicious relay IPs in Received
  const suspIPs=received.filter(r=>/\b(russia|china|nigeria|\.ru\b|\.cn\b|\.ng\b)/i.test(r));
  if(suspIPs.length){score+=15;flags.push(`Suspicious relay country detected in routing path`);}
  score=Math.min(score,100);
  return{score,risk:score<20?"SAFE":score<50?"SUSPICIOUS":"DANGER",flags,info,from,replyTo,returnPath,hopCount:received.length,authResults};
}

function analyzeAttachment(filename){
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

function analyzeHomoglyph(domain){
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
  return{score,risk:score===0?"SAFE":score<50?"SUSPICIOUS":"DANGER",flags,glyphsFound,normalized};
}

// ── Audio engine ──────────────────────────────────────────────────────────────
const distCurve=amt=>{const c=new Float32Array(512);for(let i=0;i<512;i++){const x=(i*2)/512-1;c[i]=((Math.PI+amt)*x)/(Math.PI+amt*Math.abs(x));}return c;};
function useAudio(){
  const ctxRef=useRef(null);
  const ac=()=>{if(!ctxRef.current||ctxRef.current.state==="closed")ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;};
  const tone=(a,type,freq,t,dur,vol,dist=0)=>{const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;if(dist){const d=a.createWaveShaper();d.curve=distCurve(dist);o.connect(d);d.connect(g);}else o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.start(t);o.stop(t+dur+0.01);};
  return useCallback((level="DANGER")=>{
    const a=ac(),t=a.currentTime;
    if(level==="SAFE"){[523,659,784,1047].forEach((f,i)=>tone(a,"sine",f,t+i*.12,.5,.15));return;}
    if(level==="SUSPICIOUS"){for(let p=0;p<3;p++)[880,740,880].forEach((f,j)=>tone(a,"square",f,t+p*.28+j*.07,.07,.3,120));tone(a,"sawtooth",300,t,.85,.2,80);tone(a,"sine",80,t,.22,.45);tone(a,"sine",2200,t+.75,.2,.14);return;}
    tone(a,"sawtooth",55,t,.35,.7,500);
    for(let i=0;i<6;i++){tone(a,"sawtooth",960+(i%2)*180,t+.05+i*.14,.13,.45,400);tone(a,"square",480+(i%3)*90,t+.05+i*.14,.11,.2);}
    const s=a.createOscillator(),sg=a.createGain(),sd=a.createWaveShaper();sd.curve=distCurve(200);s.type="sawtooth";[400,1600,400,1600,400].forEach((f,i)=>s.frequency.linearRampToValueAtTime(f,t+.05+i*.5));s.connect(sd);sd.connect(sg);sg.connect(a.destination);sg.gain.setValueAtTime(0,t);sg.gain.linearRampToValueAtTime(.38,t+.1);sg.gain.setValueAtTime(.38,t+1.9);sg.gain.exponentialRampToValueAtTime(.001,t+2.1);s.start(t);s.stop(t+2.1);
    for(let i=0;i<8;i++)tone(a,"sine",80,t+i*.25,.22,i<2?.55:.35);
    const buf=a.createBuffer(1,a.sampleRate*.15,a.sampleRate),dat=buf.getChannelData(0);for(let i=0;i<dat.length;i++)dat[i]=Math.random()*2-1;
    const n=a.createBufferSource(),nf=a.createBiquadFilter(),ng=a.createGain();n.buffer=buf;nf.type="bandpass";nf.frequency.value=1800;n.connect(nf);nf.connect(ng);ng.connect(a.destination);ng.gain.setValueAtTime(.5,t);ng.gain.exponentialRampToValueAtTime(.001,t+.15);n.start(t);n.stop(t+.16);
    tone(a,"sawtooth",1400,t+1.9,.45,.3,150);
  },[]);
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Card({children,border,style={}}){
  const{dark}=useTheme();
  const b=border||(dark?"#1e2240":"#dde0f0");
  return <div style={{background:dark?"#0a0a1a":"#ffffff",border:`1px solid ${b}`,borderRadius:12,padding:22,...style}}>{children}</div>;
}
function Label({children}){const{dark}=useTheme();return <div style={{fontFamily:SYNE,fontWeight:700,fontSize:10,letterSpacing:4,color:dark?"#445":"#99a",textTransform:"uppercase",marginBottom:12}}>{children}</div>;}
const Tag=({children,color="#ff3355"})=><span style={{background:`${color}18`,border:`1px solid ${color}44`,borderRadius:3,padding:"2px 9px",fontSize:11,color,fontFamily:MONO,letterSpacing:1}}>{children}</span>;
const Spinner=({color="#ff3355",size=20})=><div style={{width:size,height:size,border:`2px solid ${color}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
function TrafficLight({risk}){const c=RISK_CFG[risk]||RISK_CFG.SAFE;return <div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:54,height:54,borderRadius:"50%",background:c.color,boxShadow:`0 0 28px ${c.color},0 0 56px ${c.glow}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#000",fontWeight:900,animation:"pulse 1.4s ease-in-out infinite"}}>{c.icon}</div><span style={{fontFamily:SYNE,fontWeight:900,fontSize:24,color:c.color,letterSpacing:4}}>{c.label}</span></div>;}
function ScoreBar({score,risk}){const c=RISK_CFG[risk]||RISK_CFG.SAFE,[w,setW]=useState(0);useEffect(()=>{const t=setTimeout(()=>setW(score),80);return()=>clearTimeout(t);},[score]);return <div style={{marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontFamily:MONO,fontSize:11,color:"#445",letterSpacing:2}}><span>THREAT SCORE</span><span style={{color:c.color}}>{score}/100</span></div><div style={{height:6,background:"#0d0d1e",borderRadius:3,overflow:"hidden"}}><div style={{width:`${w}%`,height:"100%",background:`linear-gradient(90deg,${c.color}66,${c.color})`,transition:"width .9s cubic-bezier(.22,1,.36,1)",boxShadow:`0 0 10px ${c.color}`,borderRadius:3}}/></div></div>;}
function Flag({f,color="#ff3355"}){return <div style={{display:"flex",gap:10,padding:"9px 13px",background:`${color}0a`,border:`1px solid ${color}22`,borderRadius:5,marginTop:7,fontSize:12,color:"#cc8899"}}><span style={{color,flexShrink:0}}>▶</span>{f}</div>;}
function InfoBox({children,color="#00ff88",style={}}){return <div style={{padding:"10px 14px",background:`${color}08`,border:`1px solid ${color}33`,borderRadius:6,fontSize:12,color,marginTop:8,display:"flex",alignItems:"center",gap:8,...style}}>{children}</div>;}

function AlertOverlay({level,onDismiss}){
  const D=level==="DANGER";
  useEffect(()=>{if(level){const t=setTimeout(onDismiss,D?5500:3500);return()=>clearTimeout(t);}},[level]);
  if(!level)return null;
  const bc=D?"#ff1133":"#ffcc00",bg=D?"linear-gradient(90deg,#cc0022,#ff1133,#ff3355,#ff1133,#cc0022)":"linear-gradient(90deg,#aa6600,#ffaa00,#ffcc00,#ffaa00,#aa6600)";
  return <div style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none",display:"flex",flexDirection:"column"}}>
    <div style={{position:"absolute",inset:0,border:`${D?5:3}px solid ${bc}`,animation:`borderFlash ${D?".18s":".4s"} ease-in-out infinite`}}/>
    {D&&[0,1,2,3].map(i=><div key={i} style={{position:"absolute",[i%2?"right":"left"]:0,top:0,width:3,height:"100%",background:"linear-gradient(180deg,transparent,#ff1133,transparent)",animation:`scannerV ${.6+i*.15}s linear infinite`,animationDelay:`${i*.18}s`,opacity:.7}}/>)}
    <div onClick={onDismiss} style={{background:bg,backgroundSize:"300% 100%",animation:"shimmer .8s linear infinite",padding:"16px 32px",display:"flex",alignItems:"center",gap:16,pointerEvents:"auto",cursor:"pointer",borderBottom:`2px solid ${D?"#ff335588":"#ffcc0088"}`,boxShadow:`0 4px 40px ${D?"#ff113388":"#ffaa0066"}`}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:D?"#fff":"#1a1000",border:D?"none":"2px solid #ffcc00",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,animation:`pulse ${D?".3s":".5s"} ease-in-out infinite`,flexShrink:0}}>{D?"🚨":"⚠"}</div>
      <div style={{flex:1}}><div style={{fontFamily:SYNE,fontWeight:900,fontSize:D?18:15,color:"#fff",letterSpacing:D?5:3,textShadow:D?"0 0 20px #fff8":"none"}}>{D?"🚨 PHISHING THREAT DETECTED":"⚠ SUSPICIOUS ACTIVITY DETECTED"}</div><div style={{fontFamily:MONO,fontSize:11,color:"rgba(255,255,255,.8)",letterSpacing:2,marginTop:3}}>{D?"HIGH CONFIDENCE — DO NOT PROCEED":"POTENTIAL INDICATORS — PROCEED WITH CAUTION"} · CLICK TO DISMISS</div></div>
      <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"rgba(255,255,255,.5)",fontFamily:MONO}}>✕</div>
    </div>
    {D&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:6,background:"linear-gradient(90deg,#ff1133,#ff6600,#ff1133)",backgroundSize:"200% 100%",animation:"shimmer .5s linear infinite"}}/>}
    {[{top:48,left:0},{top:48,right:0},{bottom:6,left:0},{bottom:6,right:0}].map((p,i)=><div key={i} style={{position:"absolute",...p,width:D?90:60,height:D?90:60,background:`radial-gradient(circle,${D?"#ff1133":"#ffaa00"} 0%,transparent 70%)`,animation:`pulse ${D?.2+i*.04:.4+i*.06}s ease-in-out infinite`,animationDelay:`${i*.07}s`}}/>)}
    {D&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 40%,rgba(255,17,51,.25) 100%)",animation:"bgFlash .35s ease-in-out infinite"}}/>}
  </div>;
}

// ── Result card (shared between URL + email tabs) ─────────────────────────────
function ResultCard({result}){
  const c=RISK_CFG[result.risk]||RISK_CFG.SAFE;
  return <Card border={c.color+"55"} style={{marginTop:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
      <div><TrafficLight risk={result.risk}/>{result.domain&&<div style={{marginTop:8,fontSize:11,color:"#445"}}>Domain: <span style={{color:"#6677aa"}}>{result.domain}</span></div>}</div>
      <div style={{textAlign:"right"}}><div style={{fontFamily:SYNE,fontSize:44,fontWeight:900,color:c.color,lineHeight:1}}>{result.score}<span style={{fontSize:12,color:"#334",marginLeft:2}}>/100</span></div></div>
    </div>
    <ScoreBar score={result.score} risk={result.risk}/>
    {result.flags?.length>0&&<div style={{marginTop:18}}><Label>Threat Indicators ({result.flags.length})</Label>{result.flags.map((f,i)=><Flag key={i} f={f}/>)}</div>}
    {result.flags?.length===0&&<InfoBox color="#00ff88">✓ No phishing indicators detected.</InfoBox>}
  </Card>;
}

// ── URL Scanner Panel ─────────────────────────────────────────────────────────
function URLScanner({onTrigger,sound}){
  const{dark}=useTheme();
  const[url,setUrl]=useState(""), [res,setRes]=useState(null), [scanning,setScanning]=useState(false);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:13,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const scan=()=>{if(!url.trim())return;setScanning(true);setRes(null);setTimeout(()=>{const r=analyzeURL(url.trim());setRes(r);setScanning(false);onTrigger(r.risk);},900);};
  useEffect(()=>{const h=e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")scan();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[url]);
  return <div>
    <Label>Paste any URL to scan for phishing indicators</Label>
    <div style={{display:"flex",gap:10}}>
      <input style={inp} placeholder="https://suspicious-site.xyz/verify..." value={url} onChange={e=>{setUrl(e.target.value);setRes(null);}} onKeyDown={e=>e.key==="Enter"&&scan()}/>
      <button style={btnStyle()} onClick={scan}>{scanning?"SCANNING…":"SCAN URL"}</button>
    </div>
    <div style={{fontSize:10,color:"#445",marginTop:6,letterSpacing:1}}>Tip: Press Ctrl+Enter to scan</div>
    {scanning&&<Card style={{marginTop:16,position:"relative",overflow:"hidden",height:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><div style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#ff3355,transparent)",animation:"shimmer 1s linear infinite"}}/><Spinner/><span style={{fontSize:11,color:"#445",letterSpacing:4}}>ANALYZING THREAT VECTORS...</span></Card>}
    {res&&!scanning&&<>
      <ResultCard result={res}/>
      <ScreenshotPanel url={url} risk={res.risk}/>
      <DNSGeoPanel domain={res.domain}/>
      <BreachPanel domain={res.domain}/>
    </>}
    <Card style={{marginTop:18}}>
      <Label>Quick Test Examples</Label>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {["https://google.com","http://secure-paypal-verify.xyz/login","https://amaz0n-account-billing-update.click","https://go.micros.com/fwlink/?LinkId=521839","http://bit.ly/win-free-iphone-2024","https://192.168.1.1/admin"].map(ex=>(
          <button key={ex} onClick={()=>{setUrl(ex);setRes(null);}} style={{background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:4,padding:"5px 11px",color:"#556",fontSize:10,cursor:"pointer",fontFamily:MONO,transition:"all .2s"}}>{ex.length>40?ex.slice(0,40)+"…":ex}</button>
        ))}
      </div>
    </Card>
  </div>;
}

// ── Email Analyzer Panel ──────────────────────────────────────────────────────
function EmailAnalyzer({onTrigger}){
  const{dark}=useTheme();
  const[email,setEmail]=useState(""), [res,setRes]=useState(null);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:13,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const scan=()=>{if(!email.trim())return;const r=analyzeEmail(email);setRes(r);onTrigger(r.risk);};
  return <div>
    <Label>Paste suspicious email body for threat analysis</Label>
    <textarea style={{...inp,minHeight:160,resize:"vertical",lineHeight:1.7}} placeholder={"Paste email content here...\n\nExample: Dear Customer, your account has been suspended. Click immediately to verify within 24 hours."} value={email} onChange={e=>{setEmail(e.target.value);setRes(null);}}/>
    <div style={{display:"flex",gap:10,marginTop:10}}>
      <button style={btnStyle("#ff9900")} onClick={scan}>ANALYZE EMAIL</button>
      {res&&<button style={{...btnStyle("#1a1a30"),boxShadow:"none",border:"1px solid #2a2a50"}} onClick={()=>{setEmail("");setRes(null);}}>CLEAR</button>}
    </div>
    {res&&<div style={{animation:"fadeIn .3s ease"}}>
      <Card border={RISK_CFG[res.risk].color+"55"} style={{marginTop:16}}>
        <TrafficLight risk={res.risk}/>
        <ScoreBar score={res.score} risk={res.risk}/>
        <div style={{display:"flex",gap:12,marginTop:18,flexWrap:"wrap"}}>
          {[["Keywords",res.keywords.length,"#ff3355"],["Urgency",res.urgency.length,"#ffcc00"],["Links",res.linkCount,"#6699ff"],["Attachment",res.hasAttach?"YES":"NO",res.hasAttach?"#ff3355":"#00ff88"]].map(([l,v,c],i)=>(
            <div key={i} style={{background:dark?"#0d0d1e":"#f8f9ff",border:"1px solid #1a1a30",borderRadius:8,padding:"12px 16px",flex:"1 1 90px"}}>
              <div style={{fontFamily:SYNE,fontSize:24,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:9,color:"#445",letterSpacing:2,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
        {res.keywords.length>0&&<div style={{marginTop:14}}><Label>Flagged Terms</Label><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{res.keywords.map((k,i)=><Tag key={"k"+i} color="#ff3355">{k}</Tag>)}{res.urgency.map((k,i)=><Tag key={"u"+i} color="#ffcc00">{k}</Tag>)}</div></div>}
        {res.senderFlags?.length>0&&<div style={{marginTop:14}}><Label>Sender Analysis</Label>{res.senderFlags.map((f,i)=><Flag key={i} f={f}/>)}</div>}
        {res.scannedLinks?.length>0&&<div style={{marginTop:14}}><Label>URLs in Email ({res.scannedLinks.length})</Label>{res.scannedLinks.map((l,i)=>{const c=RISK_CFG[l.risk]||RISK_CFG.SAFE;return <div key={i} style={{background:dark?"#080812":"#fafbff",border:`1px solid ${c.color}44`,borderRadius:7,padding:"10px 14px",marginTop:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}><div style={{width:10,height:10,borderRadius:"50%",background:c.color,flexShrink:0}}/><span style={{fontFamily:MONO,fontSize:11,color:"#6677aa",wordBreak:"break-all"}}>{l.url.length>55?l.url.slice(0,55)+"…":l.url}</span></div><span style={{fontFamily:SYNE,fontWeight:800,fontSize:11,color:c.color,flexShrink:0}}>{l.risk}</span></div>{l.flags?.length>0&&<div style={{marginTop:6,paddingLeft:18}}>{l.flags.map((f,j)=><div key={j} style={{fontSize:11,color:"#cc8899",marginTop:2}}>▶ {f}</div>)}</div>}</div>;})}
        </div>}

      </Card>
      {email&&<Card style={{marginTop:12}}><Label>Annotated Content</Label><AnnotatedText text={email} result={res}/></Card>}
    </div>}
  </div>;
}

function AnnotatedText({text,result}){
  const allKw=[...result.keywords,...result.urgency];
  const spans=(result.scannedLinks||[]).map(l=>{const idx=text.indexOf(l.url);return idx>=0?{s:idx,e:idx+l.url.length,risk:l.risk}:null;}).filter(Boolean);
  const marks=text.split("").map((c,ci)=>{
    for(const sp of spans){if(ci===sp.s)return{c:text.slice(sp.s,sp.e),t:"url-"+sp.risk,n:sp.e-sp.s};if(ci>sp.s&&ci<sp.e)return{c:"",t:"skip",n:1};}
    const sub=text.slice(ci).toLowerCase();for(const k of allKw){if(sub.startsWith(k))return{c:text.slice(ci,ci+k.length),t:result.urgency.includes(k)?"urg":"kw",n:k.length};}
    return{c,t:"n",n:1};
  });
  const out=[];let i=0;
  while(i<text.length){const m=marks[i];if(m.t==="skip"){i++;continue;}
    if(m.t.startsWith("url-")){const r=m.t.slice(4),c=RISK_CFG[r]||RISK_CFG.SAFE;out.push(<mark key={i} style={{background:`${c.color}18`,color:c.color,borderRadius:3,padding:"1px 4px",border:`1px solid ${c.color}44`,fontFamily:MONO,fontSize:11}}>{m.c}<span style={{marginLeft:5,fontSize:9,fontFamily:SYNE,fontWeight:800,verticalAlign:"middle"}}>[{r}]</span></mark>);}
    else if(m.t!=="n"){out.push(<mark key={i} style={{background:m.t==="urg"?"rgba(255,204,0,.18)":"rgba(255,51,85,.18)",color:m.t==="urg"?"#ffcc00":"#ff6677",borderRadius:2,padding:"0 2px"}}>{m.c}</mark>);}
    else out.push(m.c);i+=m.n;}
  return <div style={{fontSize:13,lineHeight:1.9,color:"#7788aa",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{out}</div>;
}

// ── Header Analyzer Panel ─────────────────────────────────────────────────────
function HeaderAnalyzer({onTrigger}){
  const{dark}=useTheme();
  const[text,setText]=useState(""),  [res,setRes]=useState(null);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:12,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const scan=()=>{if(!text.trim())return;const r=analyzeHeader(text);setRes(r);onTrigger(r.risk);};
  const SAMPLE=`From: "PayPal Support" <support@paypall-secure.xyz>
Reply-To: harvest@evil-domain.ru
Return-Path: <bounce@phishing-farm.cn>
Received: from mail.phishing-farm.cn (1.2.3.4) by mx.victim.com
Received: from evil-relay.ru (5.6.7.8) by mail.phishing-farm.cn
Authentication-Results: mx.victim.com;
  spf=fail (sender IP is 1.2.3.4) smtp.mailfrom=paypall-secure.xyz;
  dkim=fail header.d=paypall-secure.xyz;
  dmarc=fail action=none header.from=paypall-secure.xyz
DKIM-Signature: v=1; a=rsa-sha256; d=paypall-secure.xyz;
Subject: Your account has been limited`;
  return <div>
    <Label>Paste raw email headers for authentication analysis</Label>
    <textarea style={{...inp,minHeight:180,resize:"vertical",lineHeight:1.6}} placeholder="Paste raw email headers here (From, Reply-To, Received, Authentication-Results, DKIM-Signature...)" value={text} onChange={e=>{setText(e.target.value);setRes(null);}}/>
    <div style={{display:"flex",gap:10,marginTop:10}}>
      <button style={btnStyle("#9944ff")} onClick={scan}>ANALYZE HEADERS</button>
      <button style={{...btnStyle("#1a1a30"),boxShadow:"none",border:"1px solid #2a2a50",fontSize:11}} onClick={()=>setText(SAMPLE)}>LOAD SAMPLE</button>
    </div>
    {res&&<div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <Card border={RISK_CFG[res.risk].color+"55"}>
        <TrafficLight risk={res.risk}/>
        <ScoreBar score={res.score} risk={res.risk}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
          {[["From",res.from||"—"],["Reply-To",res.replyTo||"—"],["Return-Path",res.returnPath||"—"],["Relay Hops",res.hopCount||0]].map(([l,v],i)=>(
            <div key={i} style={{background:dark?"#0d0d1e":"#f8f9ff",border:"1px solid #1a1a30",borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"#445",letterSpacing:2,marginBottom:4}}>{l}</div>
              <div style={{fontFamily:MONO,fontSize:11,color:"#8899cc",wordBreak:"break-all"}}>{String(v)}</div>
            </div>
          ))}
        </div>
        {res.info.length>0&&<div style={{marginTop:14}}>{res.info.map((m,i)=><InfoBox key={i}>{m}</InfoBox>)}</div>}
        {res.flags.length>0&&<div style={{marginTop:14}}><Label>Authentication Failures ({res.flags.length})</Label>{res.flags.map((f,i)=><Flag key={i} f={f}/>)}</div>}
      </Card>
    </div>}
  </div>;
}

// ── QR Scanner Panel ──────────────────────────────────────────────────────────
function QRScanner({onTrigger}){
  const{dark}=useTheme();
  const[loaded,setLoaded]=useState(false);
  const[res,setRes]=useState(null);
  const[status,setStatus]=useState("");
  const[manualUrl,setManualUrl]=useState("");
  const[dragOver,setDragOver]=useState(false);
  const[preview,setPreview]=useState(null);
  const canvasRef=useRef(null);
  const fileRef=useRef(null);
  const cameraRef=useRef(null);

  useEffect(()=>{
    if(window.jsQR){setLoaded(true);return;}
    const tryLoad=(urls,i=0)=>{
      if(i>=urls.length){setLoaded("fail");return;}
      const s=document.createElement("script");s.src=urls[i];
      s.onload=()=>setLoaded(true);
      s.onerror=()=>tryLoad(urls,i+1);
      document.head.appendChild(s);
    };
    tryLoad(["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js","https://unpkg.com/jsqr@1.4.0/dist/jsQR.js"]);
  },[]);

  useEffect(()=>()=>{if(preview?.startsWith("blob:"))URL.revokeObjectURL(preview);},[preview]);

  const processImage=file=>{
    if(!file)return;
    setRes(null);setStatus("Decoding...");
    const objectUrl=URL.createObjectURL(file);setPreview(prev=>{if(prev?.startsWith("blob:"))URL.revokeObjectURL(prev);return objectUrl;});
    const img=new Image(),reader=new FileReader();
    reader.onload=ev=>{
      img.src=ev.target.result;
      img.onload=()=>{
        const canvas=canvasRef.current;
        canvas.width=img.width;canvas.height=img.height;
        const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);
        const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        if(window.jsQR){
          const code=window.jsQR(imageData.data,imageData.width,imageData.height,{inversionAttempts:"attemptBoth"});
          if(code){const r=analyzeURL(code.data);setRes({...r,raw:code.data});setStatus("");onTrigger(r.risk);}
          else setStatus("No QR code detected — try a clearer, well-lit photo.");
        }else setStatus("QR engine unavailable — paste URL manually below.");
      };
    };
    reader.readAsDataURL(file);
  };

  const handleChange=e=>{const f=e.target.files?.[0];if(f)processImage(f);e.target.value="";};
  const scanManual=()=>{if(!manualUrl.trim())return;const r=analyzeURL(manualUrl.trim());setRes({...r,raw:manualUrl.trim()});onTrigger(r.risk);};
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"11px 16px",fontFamily:MONO,fontSize:13,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};

  return <div>
    <canvas ref={canvasRef} style={{display:"none"}}/>
    <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} style={{display:"none"}}/>
    <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} style={{display:"none"}}/>

    <Card style={{marginBottom:16}}>
      <Label>Upload or capture a QR code image</Label>
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)processImage(f);}}
        onClick={()=>fileRef.current?.click()}
        style={{border:`2px dashed ${dragOver?"#6644ff":"#2a2a50"}`,borderRadius:10,padding:"36px 20px",textAlign:"center",background:dark?(dragOver?"#0d0a22":"#06060f"):(dragOver?"#f0eeff":"#f8f9ff"),transition:"all .2s",marginBottom:14,cursor:"pointer"}}>
        {preview
          ?<img src={preview} alt="QR" style={{maxHeight:130,maxWidth:"100%",borderRadius:8,marginBottom:10,border:"1px solid #2a2a50",display:"block",margin:"0 auto 10px"}}/>
          :<div style={{fontSize:52,marginBottom:10}}>{loaded===false?"⏳":"🖼️"}</div>}
        <div style={{fontSize:13,color:"#6677aa"}}>
          {loaded===false?"Loading QR engine...":dragOver?"Drop it here!":"Click to browse, or drag & drop a QR image"}
        </div>
        {status&&<div style={{marginTop:12,fontSize:12,color:status==="Decoding..."?"#9977ff":status.startsWith("No")?"#ffcc00":"#ff6677",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {status==="Decoding..."&&<Spinner color="#9977ff" size={13}/>}{status}
        </div>}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button
          style={{...btnStyle("#6644ff"),flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
          onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>
          🖥️ Upload Image
        </button>
        <button
          style={{...btnStyle("#00aa66"),flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
          onClick={e=>{e.stopPropagation();cameraRef.current?.click();}}>
          📱 Take Photo
        </button>
        {(preview||res)&&<button
          style={{...btnStyle("#1a1a30"),flex:"0 0 auto",border:"1px solid #ff335533",boxShadow:"none",color:"#ff6677"}}
          onClick={e=>{e.stopPropagation();if(preview?.startsWith("blob:"))URL.revokeObjectURL(preview);setPreview(null);setRes(null);setStatus("");}}>
          ✕ Clear
        </button>}
      </div>
    </Card>

    <Card>
      <Label>Or paste the URL from the QR code</Label>
      <div style={{fontSize:12,color:"#556",marginBottom:10}}>Already scanned with Google Lens or your phone camera? Paste the URL here to analyze it.</div>
      <div style={{display:"flex",gap:10}}>
        <input style={inp} placeholder="https://qr-destination.xyz/..." value={manualUrl}
          onChange={e=>{setManualUrl(e.target.value);setRes(null);}}
          onKeyDown={e=>e.key==="Enter"&&scanManual()}/>
        <button style={btnStyle("#6644ff")} onClick={scanManual}>ANALYZE</button>
      </div>
    </Card>

    {res&&<div style={{marginTop:16,animation:"fadeIn .3s ease"}}>
      <InfoBox color="#9977ff">📷 QR decoded: <span style={{fontFamily:MONO,fontSize:11,marginLeft:6,wordBreak:"break-all"}}>{res.raw}</span></InfoBox>
      <ResultCard result={res}/>
    </div>}
  </div>;
}


// ── Attachment Risk Scorer Panel ──────────────────────────────────────────────
function AttachmentScorer(){
  const{dark}=useTheme();
  const[name,setName]=useState(""),  [res,setRes]=useState(null), [fileMeta,setFileMeta]=useState(null);
  const fileRef=useRef(null);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:13,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const EXAMPLES=["Invoice_2024.pdf.exe","payment_receipt.docm","URGENT wire transfer.exe","Quotation  .pdf.js","Договор.doc","free_iphone.zip"];
  const ACCEPT=".pdf,.txt,.csv,.log,.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.zip,.rar,.7z,.gz,.tar,.eml,.msg,.html,.htm,.js,.vbs,.jar,.bat,.cmd,.exe";
  const fmtBytes=n=>{if(!Number.isFinite(n))return "—";if(n<1024)return`${n} B`;if(n<1024**2)return`${(n/1024).toFixed(1)} KB`;if(n<1024**3)return`${(n/1024**2).toFixed(1)} MB`;return`${(n/1024**3).toFixed(1)} GB`;};
  const handleFile=file=>{
    if(!file)return;
    setName(file.name);
    setFileMeta({name:file.name,size:file.size,type:file.type||"unknown"});
    setRes(analyzeAttachment(file.name));
  };
  return <div>
    <input ref={fileRef} type="file" accept={ACCEPT} style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0];if(file)handleFile(file);e.target.value="";}}/>
    <Label>Upload a file or enter a filename to analyze for malicious indicators</Label>
    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button style={{...btnStyle("#6644ff"),display:"flex",alignItems:"center",gap:8}} onClick={()=>fileRef.current?.click()}>📂 UPLOAD FILE</button>
        {fileMeta&&<button style={{...btnStyle("#1a1a30"),boxShadow:"none",border:"1px solid #2a2a50"}} onClick={()=>{setFileMeta(null);setName("");setRes(null);}}>CLEAR FILE</button>}
      </div>
      <div style={{fontSize:11,color:"#556",marginTop:10,lineHeight:1.6}}>Supported formats: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP/RAR/7Z, TXT/CSV/LOG, EML/MSG, HTML, JS and more.</div>
      {fileMeta&&<InfoBox color="#6699ff">Selected: <span style={{fontFamily:MONO,marginLeft:6,wordBreak:"break-all"}}>{fileMeta.name}</span> <span style={{marginLeft:8,opacity:.8}}>({fmtBytes(fileMeta.size)})</span></InfoBox>}
    </Card>
    <div style={{display:"flex",gap:10}}>
      <input style={inp} placeholder="e.g. Invoice_2024.pdf.exe" value={name} onChange={e=>{setName(e.target.value);setRes(null);setFileMeta(null);}} onKeyDown={e=>e.key==="Enter"&&setRes(analyzeAttachment(name.trim()))}/>
      <button style={btnStyle("#ff6600")} onClick={()=>name.trim()&&setRes(analyzeAttachment(name.trim()))}>ANALYZE</button>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12}}>
      {EXAMPLES.map(ex=><button key={ex} onClick={()=>{setName(ex);setRes(analyzeAttachment(ex));}} style={{background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:4,padding:"4px 10px",color:"#556",fontSize:10,cursor:"pointer",fontFamily:MONO}}>{ex}</button>)}
    </div>
    {res&&<Card border={RISK_CFG[res.risk].color+"55"} style={{marginTop:16}}>
      <TrafficLight risk={res.risk}/>
      <ScoreBar score={res.score} risk={res.risk}/>
      <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap"}}>
        <div style={{background:dark?"#0d0d1e":"#f8f9ff",border:"1px solid #1a1a30",borderRadius:8,padding:"10px 14px",flex:1}}><div style={{fontSize:10,color:"#445",letterSpacing:2,marginBottom:4}}>EXTENSION</div><div style={{fontFamily:MONO,fontSize:14,color:"#ff6677"}}>.{res.lastExt}</div></div>
        <div style={{background:dark?"#0d0d1e":"#f8f9ff",border:"1px solid #1a1a30",borderRadius:8,padding:"10px 14px",flex:1}}><div style={{fontSize:10,color:"#445",letterSpacing:2,marginBottom:4}}>ALL EXTENSIONS</div><div style={{fontFamily:MONO,fontSize:12,color:"#8899cc"}}>{res.exts.join(" · ")||"none"}</div></div>
      </div>
      {res.flags.length>0?<div style={{marginTop:14}}><Label>Risk Indicators</Label>{res.flags.map((f,i)=><Flag key={i} f={f}/>)}</div>:<InfoBox color="#00ff88">✓ Filename appears clean</InfoBox>}
    </Card>}
  </div>;
}

// ── Homoglyph Detector Panel ──────────────────────────────────────────────────
function HomoglyphDetector(){
  const{dark}=useTheme();
  const[domain,setDomain]=useState(""), [res,setRes]=useState(null);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:13,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const EXAMPLES=["раурal.com","googIe.com","аmazon.com","mіcrosoft.com","ɑpple.com"];
  return <div>
    <Label>Detect Unicode lookalike attacks in domain names</Label>
    <div style={{display:"flex",gap:10}}>
      <input style={inp} placeholder="paste suspicious domain (e.g. раурal.com)" value={domain} onChange={e=>{setDomain(e.target.value);setRes(null);}} onKeyDown={e=>e.key==="Enter"&&domain.trim()&&setRes(analyzeHomoglyph(domain.trim()))}/>
      <button style={btnStyle("#00aaff")} onClick={()=>domain.trim()&&setRes(analyzeHomoglyph(domain.trim()))}>DETECT</button>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12}}>
      {EXAMPLES.map(ex=><button key={ex} onClick={()=>{setDomain(ex);setRes(analyzeHomoglyph(ex));}} style={{background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:4,padding:"4px 10px",color:"#556",fontSize:11,cursor:"pointer",fontFamily:MONO}}>{ex}</button>)}
    </div>
    {res&&<Card border={RISK_CFG[res.risk].color+"55"} style={{marginTop:16}}>
      <TrafficLight risk={res.risk}/>
      <ScoreBar score={res.score} risk={res.risk}/>
      {res.glyphsFound.length>0&&<div style={{marginTop:14}}>
        <Label>Homoglyphs Found ({res.glyphsFound.length})</Label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {res.glyphsFound.map((g,i)=><div key={i} style={{background:"rgba(255,51,85,.08)",border:"1px solid #ff335533",borderRadius:6,padding:"8px 14px",textAlign:"center"}}><div style={{fontSize:22,fontFamily:MONO}}>{g.original}</div><div style={{fontSize:10,color:"#445",marginTop:4}}>→ ASCII '{g.ascii}'</div></div>)}
        </div>
        <InfoBox color="#ffcc00">Normalized: <span style={{fontFamily:MONO,marginLeft:8}}>{res.normalized}</span></InfoBox>
      </div>}
      {res.flags.map((f,i)=><Flag key={i} f={f}/>)}
      {res.glyphsFound.length===0&&<InfoBox color="#00ff88">✓ No homoglyph characters detected</InfoBox>}
    </Card>}
  </div>;
}

// ── Bulk URL Scanner Panel ────────────────────────────────────────────────────
function BulkScanner({onTrigger}){
  const{dark}=useTheme();
  const[text,setText]=useState(""), [results,setResults]=useState(null), [scanning,setScanning]=useState(false);
  const inp={width:"100%",background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde0f0"}`,borderRadius:7,padding:"12px 16px",fontFamily:MONO,fontSize:12,color:dark?"#c8d0e0":"#1a1a38",outline:"none",boxSizing:"border-box"};
  const scan=()=>{
    const urls=text.split(/\n/).map(u=>u.trim()).filter(Boolean);
    if(!urls.length)return;setScanning(true);
    setTimeout(()=>{
      const res=urls.map(u=>analyzeURL(u));
      setResults(res);setScanning(false);
      const worst=res.reduce((a,b)=>({SAFE:0,SUSPICIOUS:1,DANGER:2}[b.risk]>({SAFE:0,SUSPICIOUS:1,DANGER:2}[a.risk])?b:a));
      onTrigger(worst.risk);
    },400);
  };
  const counts=results?{SAFE:results.filter(r=>r.risk==="SAFE").length,SUSPICIOUS:results.filter(r=>r.risk==="SUSPICIOUS").length,DANGER:results.filter(r=>r.risk==="DANGER").length}:null;
  return <div>
    <Label>Paste multiple URLs (one per line) for batch analysis</Label>
    <textarea style={{...inp,minHeight:160,resize:"vertical",lineHeight:1.8}} placeholder={"https://google.com\nhttps://secure-paypal-verify.xyz/login\nhttps://amaz0n-account-update.click\nhttp://bit.ly/win-prize"} value={text} onChange={e=>setText(e.target.value)}/>
    <div style={{display:"flex",gap:10,marginTop:10}}>
      <button style={btnStyle()} onClick={scan} disabled={scanning}>{scanning?"SCANNING…":"SCAN ALL URLs"}</button>
      {results&&<button style={{...btnStyle("#1a1a30"),boxShadow:"none",border:"1px solid #2a2a50"}} onClick={()=>setResults(null)}>CLEAR</button>}
    </div>
    {counts&&<div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
      {Object.entries(counts).map(([risk,n])=><div key={risk} style={{background:dark?"#0d0d1e":"#f8f9ff",border:`1px solid ${RISK_CFG[risk].color}33`,borderRadius:8,padding:"10px 18px",flex:1,textAlign:"center"}}><div style={{fontFamily:SYNE,fontSize:28,fontWeight:900,color:RISK_CFG[risk].color}}>{n}</div><div style={{fontSize:9,color:"#445",letterSpacing:2,marginTop:2}}>{risk}</div></div>)}
    </div>}
    {results&&<Card style={{marginTop:16}}>
      <Label>Results ({results.length} URLs)</Label>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:MONO,fontSize:11}}>
        <thead><tr style={{borderBottom:"1px solid #1a1a30"}}>{["URL","DOMAIN","SCORE","RISK"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#445",fontSize:9,letterSpacing:2,fontWeight:400}}>{h}</th>)}</tr></thead>
        <tbody>{results.map((r,i)=>{const c=RISK_CFG[r.risk];return <tr key={i} style={{borderBottom:"1px solid #0f0f1e"}}>
          <td style={{padding:"7px 10px",color:"#6677aa",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.raw.length>40?r.raw.slice(0,40)+"…":r.raw}</td>
          <td style={{padding:"7px 10px",color:"#8899bb"}}>{r.domain}</td>
          <td style={{padding:"7px 10px",color:c.color}}>{r.score}</td>
          <td style={{padding:"7px 10px"}}><Tag color={c.color}>{r.risk}</Tag></td>
        </tr>;})}
        </tbody>
      </table>
    </Card>}
  </div>;
}

// ── Custom Blocklist Manager ───────────────────────────────────────────────────

// ── Scenario Drills Panel ─────────────────────────────────────────────────────
const SCENARIOS_BANK=[
  {type:"url",label:"URL Check",content:"https://accounts.google.com/signin/v2/challenge/pwd",correct:"SAFE",explain:"Legitimate Google authentication URL on google.com. The path is expected for a 2FA challenge."},
  {type:"url",label:"URL Check",content:"http://amaz0n-account-billing-update.click/verify/payment?session=abc",correct:"DANGER",explain:"Leet substitution (0→o), suspicious TLD (.click), HTTP only, and phishing keywords — all DANGER signals."},
  {type:"url",label:"URL Check",content:"https://bit.ly/3xYz9ab",correct:"SUSPICIOUS",explain:"URL shorteners hide the true destination. You can't know where this leads — treat as SUSPICIOUS."},
  {type:"email",label:"Email Analysis",content:"From: it-support@micros0ft-helpdesk.com\nSubject: URGENT: Your account will be deleted\n\nDear User, your Microsoft account will be suspended unless you verify immediately:\nhttp://secure-microsoft-verify.xyz/login?token=abc123",correct:"DANGER",explain:"Spoofed domain (micros0ft), urgency, and a suspicious URL — classic DANGER phishing email."},
  {type:"email",label:"Email Analysis",content:"From: noreply@amazon.com\nSubject: Your order #114-8291030 has shipped\n\nHi, your order has shipped. Track it at https://amazon.com/track/114-8291030",correct:"SAFE",explain:"Legitimate sender domain, transactional content, real Amazon URL — SAFE."},
  {type:"header",label:"Header Analysis",content:"From: paypal@paypall-secure.xyz\nAuthentication-Results: spf=fail; dkim=fail; dmarc=fail\nReply-To: harvest@evil-domain.ru",correct:"DANGER",explain:"SPF, DKIM, DMARC all fail + Reply-To mismatch + bad domain = definitive DANGER."},
  {type:"url",label:"URL Check",content:"https://paypal.com/myaccount/settings/closeAccount",correct:"SAFE",explain:"Legitimate PayPal domain with a standard account path. No red flags."},
  {type:"email",label:"Email Analysis",content:"From: support@apple-id-verify.net\nSubject: Your Apple ID has been locked\n\nYour Apple ID was used to sign in from Russia. Verify immediately:\nhttps://apple-id-verify.net/confirm?token=7f3a",correct:"DANGER",explain:"apple-id-verify.net is NOT apple.com. Urgency + geographic scare + fake domain = DANGER."},
  {type:"url",label:"URL Check",content:"https://github.com/login",correct:"SAFE",explain:"Legitimate GitHub login page on github.com. Expected and safe."},
  {type:"url",label:"URL Check",content:"http://192.168.44.201/bank-login/chase",correct:"DANGER",explain:"Raw IP address instead of domain name + HTTP + 'bank-login' path = major DANGER indicators."},
  {type:"email",label:"Email Analysis",content:"From: hr@yourcompany.com\nSubject: Q3 Benefits Update\n\nPlease review your updated benefits package at:\nhttps://benefits.yourcompany.com/2024-update",correct:"SAFE",explain:"Sender matches the organization, link uses the same domain, routine HR communication — SAFE."},
  {type:"url",label:"URL Check",content:"https://secure-paypal-login.xyz/verify/identity?user=victim",correct:"DANGER",explain:"PayPal's real domain is paypal.com. This is a spoof on .xyz TLD with phishing keywords — DANGER."},
  {type:"header",label:"Header Analysis",content:"From: billing@netflix.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from mail.netflix.com",correct:"SAFE",explain:"All three authentication checks pass and the received header matches. This header looks SAFE."},
  {type:"email",label:"Email Analysis",content:"From: winner@globalprizes.top\nSubject: 🎉 You've Won $500 Amazon Gift Card!\n\nCongratulations! You were randomly selected. Claim now (expires in 2 hours):\nhttp://bit.ly/claim-prize-now",correct:"DANGER",explain:"Unsolicited prize, bad TLD (.top), artificial urgency, URL shortener hiding destination — DANGER."},
  {type:"url",label:"URL Check",content:"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",correct:"SAFE",explain:"Legitimate Microsoft OAuth endpoint on microsoftonline.com. This is the real Microsoft identity platform."},
  {type:"email",label:"Email Analysis",content:"From: security@paypall-secure-alerts.com\nSubject: Suspicious activity on your account\n\nWe've limited your account. Restore access:\nhttps://paypall-secure-alerts.com/restore",correct:"DANGER",explain:"Typosquat domain (paypall vs paypal), spoofed branding, link goes to same fake domain — DANGER."},
  {type:"url",label:"URL Check",content:"https://dropbox.com/sh/xyz123/AAbcDefg",correct:"SAFE",explain:"Legitimate Dropbox shared link on dropbox.com. Standard share URL format."},
  {type:"url",label:"URL Check",content:"https://google.com.account-verify.phishing-farm.ru/login",correct:"DANGER",explain:"The real domain is phishing-farm.ru. 'google.com.account-verify' is just a subdomain of the phishing site."},
  {type:"header",label:"Header Analysis",content:"From: ceo@yourcompany.com\nReply-To: urgentceo@gmail.com\nSubject: URGENT Wire Transfer Needed\nAuthentication-Results: spf=softfail; dkim=none",correct:"DANGER",explain:"Reply-To mismatch (CEO domain vs Gmail), SPF softfail, DKIM missing, urgent financial request — BEC DANGER."},
  {type:"email",label:"Email Analysis",content:"From: noreply@github.com\nSubject: [GitHub] Please verify your email address\n\nHey user, verify your email at:\nhttps://github.com/users/confirm_email?token=abc",correct:"SAFE",explain:"Legitimate GitHub sender, real GitHub domain in the link, expected verification email — SAFE."},
  {type:"url",label:"URL Check",content:"https://faceb00k-login.com/secure/verify",correct:"DANGER",explain:"Leet substitution (00 for oo) in 'faceb00k' + '-login' appended + suspicious path — DANGER."},
  {type:"email",label:"Email Analysis",content:"From: automated@docusign.com\nSubject: Complete your document: Contract_Final.pdf\n\nJohn Smith sent you a document to sign:\nhttps://docusign.com/sign/document?id=abc123",correct:"SAFE",explain:"Legitimate DocuSign sender and domain. Expected document signing link — SAFE."},
  {type:"url",label:"URL Check",content:"https://linkedln.com/login",correct:"DANGER",explain:"Typosquat — 'linkedln' (ln not in) looks like LinkedIn but is a different domain. DANGER."},
  {type:"email",label:"Email Analysis",content:"From: it-helpdesk@yourcompany-support.net\nSubject: Action Required: Install Security Patch\n\nInstall this critical patch immediately:\nhttps://yourcompany-support.net/patch/install.exe",correct:"DANGER",explain:"Domain 'yourcompany-support.net' is not the real company domain. .exe download from email — DANGER."},
  {type:"header",label:"Header Analysis",content:"From: updates@spotify.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from email.spotify.com",correct:"SAFE",explain:"All email authentication passes, received from Spotify's mail server — SAFE."},
  {type:"url",label:"URL Check",content:"https://apple.com/shop/buy-iphone",correct:"SAFE",explain:"Legitimate Apple store URL on apple.com. Standard e-commerce path."},
  {type:"email",label:"Email Analysis",content:"From: irs-refund@tax-refund-center.com\nSubject: Your $3,240 Tax Refund is Ready\n\nClick to claim your refund:\nhttps://tax-refund-center.com/claim?ref=IRS2024",correct:"DANGER",explain:"IRS never initiates contact via email. Fake domain, financial lure — DANGER."},
  {type:"url",label:"URL Check",content:"https://outlook.live.com/mail/0/inbox",correct:"SAFE",explain:"Legitimate Microsoft Outlook web mail URL on live.com — official Microsoft domain."},
  {type:"url",label:"URL Check",content:"https://microsoft-account-security.top/verify-now",correct:"DANGER",explain:".top TLD + 'microsoft' brand in non-Microsoft domain + 'verify-now' phishing keyword = DANGER."},
  {type:"email",label:"Email Analysis",content:"From: no-reply@slack.com\nSubject: You have a new message in #general\n\nView the message:\nhttps://slack.com/archives/C01ABC123/messages",correct:"SAFE",explain:"Legitimate Slack notification from slack.com with a real Slack archive URL — SAFE."},
  {type:"header",label:"Header Analysis",content:"From: support@amazon-prime.net\nAuthentication-Results: spf=fail; dkim=fail\nReply-To: amazon-support@protonmail.com",correct:"DANGER",explain:"amazon-prime.net is not Amazon's domain. SPF/DKIM fail + Protonmail Reply-To = DANGER."},
  {type:"url",label:"URL Check",content:"https://chase.com/personal/checking-savings",correct:"SAFE",explain:"Legitimate Chase Bank URL on chase.com. Standard banking page path."},
  {type:"email",label:"Email Analysis",content:"From: security@accounts-google.com\nSubject: Suspicious sign-in attempt blocked\n\nSomeone tried to access your account from Nigeria.\nReview activity: https://accounts-google.com/security/review",correct:"DANGER",explain:"accounts-google.com is NOT google.com. Geographic scare + fake domain = DANGER."},
  {type:"url",label:"URL Check",content:"http://secure-banking-login.info/update/creditcard",correct:"DANGER",explain:"HTTP (no encryption), suspicious TLD (.info), 'secure-banking-login' is not a real bank domain, phishing keywords — DANGER."},
  {type:"email",label:"Email Analysis",content:"From: newsletter@medium.com\nSubject: Your weekly digest is ready\n\nRead your personalized digest:\nhttps://medium.com/m/global-identity?redirectUrl=/digest",correct:"SAFE",explain:"Legitimate Medium newsletter from medium.com with a real Medium URL — SAFE."},
  {type:"url",label:"URL Check",content:"https://netflix-account-suspended.xyz/reactivate",correct:"DANGER",explain:"netflix.xyz is not Netflix. Brand + 'suspended' urgency + .xyz TLD = DANGER."},
  {type:"header",label:"Header Analysis",content:"From: billing@yourcompany.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from mail.yourcompany.com (10.0.0.1)",correct:"SAFE",explain:"All authentication passes, received from internal mail server — SAFE internal email."},
  {type:"url",label:"URL Check",content:"https://www.wellsfargo.com/online-banking/login",correct:"SAFE",explain:"Legitimate Wells Fargo URL on wellsfargo.com. Expected online banking login path."},
  {type:"email",label:"Email Analysis",content:"From: alert@paypal-customer-service.com\nSubject: Your account will be permanently closed\n\nVerify your account now to avoid permanent closure:\nhttp://paypal-customer-service.com/verify?urgent=1",correct:"DANGER",explain:"Fake PayPal domain, permanent closure threat, HTTP, urgency parameter in URL — DANGER."},
  {type:"url",label:"URL Check",content:"https://zoom.us/j/98765432100",correct:"SAFE",explain:"Legitimate Zoom meeting URL on zoom.us — the official Zoom domain."},
  {type:"email",label:"Email Analysis",content:"From: support@linkedln-jobs.com\nSubject: You have 5 new job recommendations\n\nView your recommendations:\nhttps://linkedln-jobs.com/jobs/recommended",correct:"DANGER",explain:"Typosquat: 'linkedln' not 'linkedin' + different domain entirely — DANGER."},
  {type:"url",label:"URL Check",content:"https://steamcommunity.com/tradeoffer/new",correct:"SAFE",explain:"Legitimate Steam community URL on steamcommunity.com — official Valve domain for trading."},
  {type:"url",label:"URL Check",content:"https://store-steampowered.com.steamlogin.ru/account",correct:"DANGER",explain:"Real domain is 'steamlogin.ru' — a phishing site. 'store-steampowered.com' is just a subdomain lure."},
  {type:"header",label:"Header Analysis",content:"From: no-reply@twitter.com\nAuthentication-Results: spf=pass; dkim=pass\nReceived: from smtp.twitter.com",correct:"SAFE",explain:"Authentication passes, received from Twitter's SMTP server — SAFE."},
  {type:"email",label:"Email Analysis",content:"From: delivery@dhl-package-notice.com\nSubject: Your package is pending delivery — customs fee required\n\nPay $2.99 customs fee to release your package:\nhttps://dhl-package-notice.com/pay",correct:"DANGER",explain:"DHL's real domain is dhl.com. Fake domain + small payment lure + you weren't expecting a package = DANGER."},
  {type:"url",label:"URL Check",content:"https://accounts.spotify.com/en/login",correct:"SAFE",explain:"Legitimate Spotify login on accounts.spotify.com — official subdomain."},
  {type:"url",label:"URL Check",content:"https://inst4gram-verify.com/login",correct:"DANGER",explain:"Leet substitution (4 for a) in 'inst4gram' + '-verify' + '.com' not instagram.com = DANGER."},
  {type:"email",label:"Email Analysis",content:"From: no-reply@uber.com\nSubject: Your trip receipt from today\n\nYour ride with Ahmed cost $14.30.\nView receipt: https://help.uber.com/orders/12345",correct:"SAFE",explain:"Legitimate Uber receipt from uber.com with a real help.uber.com link — SAFE."},
  {type:"header",label:"Header Analysis",content:"From: cfo@vendorcompany.com\nReply-To: cfo@vendorcompany.com\nAuthentication-Results: spf=pass; dkim=pass\nSubject: Updated banking details for invoice payment",correct:"SUSPICIOUS",explain:"Authentication passes but updating banking details mid-relationship via email alone is SUSPICIOUS — always verify by phone."},
  {type:"url",label:"URL Check",content:"https://onedrive.live.com/view?id=ABC123&authkey=DEF456",correct:"SAFE",explain:"Legitimate OneDrive shared file URL on live.com — Microsoft's official OneDrive domain."},
  {type:"url",label:"URL Check",content:"https://verify-your-bankofamerica-account.com/login",correct:"DANGER",explain:"Bank of America's domain is bankofamerica.com. This is a completely different domain with the brand name embedded — DANGER."},
  {type:"email",label:"Email Analysis",content:"From: support@coinbase.com\nSubject: Action Required: Verify your identity to continue trading\n\nYour verification is required due to new regulations:\nhttps://coinbase.com/verify/identity",correct:"SAFE",explain:"Legitimate Coinbase sender and real coinbase.com URL. Routine KYC requests happen — this looks SAFE."},
  {type:"url",label:"URL Check",content:"https://tinyurl.com/phish-demo-url",correct:"SUSPICIOUS",explain:"URL shortener conceals the true destination. Cannot determine safety — always SUSPICIOUS without expanding."},
  {type:"header",label:"Header Analysis",content:"From: hr@bigcorp.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from exchange.bigcorp.com\nSubject: Salary Review — Confidential",correct:"SAFE",explain:"All authentication passes, from internal exchange server, legitimate corporate communication — SAFE."},
  {type:"url",label:"URL Check",content:"https://adobe.com/creativecloud/plans",correct:"SAFE",explain:"Legitimate Adobe URL on adobe.com — real Creative Cloud plans page."},
  {type:"email",label:"Email Analysis",content:"From: admin@yourbank.com.security-alert.net\nSubject: Unauthorized access detected\n\nSecure your account immediately:\nhttps://yourbank.com.security-alert.net/secure",correct:"DANGER",explain:"Real domain is 'security-alert.net'. 'yourbank.com' is a subdomain prefix — complete phishing site."},
  {type:"url",label:"URL Check",content:"https://discord.com/channels/123456789/987654321",correct:"SAFE",explain:"Legitimate Discord channel URL on discord.com — the official Discord domain."},
  {type:"url",label:"URL Check",content:"http://www.miicrosoft.com/office/activate",correct:"DANGER",explain:"Typosquat: 'miicrosoft' (double i) is not Microsoft + HTTP = DANGER."},

  {type:"url",label:"URL Check",content:"https://twitter.com/home",correct:"SAFE",explain:"Legitimate Twitter/X homepage on twitter.com — official domain."},
  {type:"email",label:"Email Analysis",content:"From: billing@amazon.com.billing-update.info\nSubject: Your payment method needs updating\n\nUpdate your payment at:\nhttps://amazon.com.billing-update.info/payment",correct:"DANGER",explain:"Real domain is billing-update.info. Amazon.com is a subdomain lure — classic billing phishing."},
  {type:"url",label:"URL Check",content:"https://www.bankofamerica.com/deposits/manage/ako-open-account",correct:"SAFE",explain:"Legitimate Bank of America URL on their official bankofamerica.com domain."},
  {type:"header",label:"Header Analysis",content:"From: noreply@linkedin.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from mail.linkedin.com",correct:"SAFE",explain:"Authentication passes across all checks, originating from LinkedIn's mail server — SAFE."},
  {type:"url",label:"URL Check",content:"https://netfl1x-account-restore.com/login",correct:"DANGER",explain:"Leet substitution (1 for i in netfl1x) + 'account-restore' + fake domain = DANGER."},
  {type:"email",label:"Email Analysis",content:"From: security@microsoft.com\nSubject: Unusual sign-in activity\n\nWe noticed a sign-in from an unfamiliar location.\nReview your account: https://account.microsoft.com/security/review",correct:"SAFE",explain:"Legitimate Microsoft security alert — real sender domain, real account.microsoft.com URL — SAFE."},
  {type:"url",label:"URL Check",content:"https://signin.ebay.com/ws/eBayISAPI.dll?SignIn",correct:"SAFE",explain:"Legitimate eBay sign-in on ebay.com's signin subdomain — official authentication URL."},
  {type:"email",label:"Email Analysis",content:"From: prize-winner@lottery-international.top\nSubject: You are our €500,000 lottery winner\n\nClaim your prize by providing ID and bank details to:\nprize@lottery-claims.xyz",correct:"DANGER",explain:"Unsolicited lottery win, suspicious TLDs (.top, .xyz), requesting ID and bank details = DANGER."},
  {type:"url",label:"URL Check",content:"https://support.google.com/accounts/answer/3466521",correct:"SAFE",explain:"Legitimate Google support article on support.google.com — official Google help domain."},
  {type:"header",label:"Header Analysis",content:"From: it-support@company.com\nAuthentication-Results: spf=fail; dkim=none\nReply-To: it.support.helpdesk@gmail.com\nSubject: Install Required Security Update",correct:"DANGER",explain:"SPF fail + no DKIM + Gmail Reply-To from apparent internal IT = spoofed internal phishing attempt — DANGER."},
  {type:"url",label:"URL Check",content:"https://store.steampowered.com/app/1091500/Cyberpunk_2077/",correct:"SAFE",explain:"Legitimate Steam store URL on store.steampowered.com — official Valve gaming platform."},
  {type:"email",label:"Email Analysis",content:"From: helpdesk@apple.com\nSubject: Your iPhone has been locked remotely\n\nUnlock it immediately:\nhttps://iforgot.apple.com/password/verify/appleid",correct:"SAFE",explain:"Legitimate Apple helpdesk, real iforgot.apple.com URL for account recovery — SAFE."},
  {type:"url",label:"URL Check",content:"https://paypa1.com/verify/identity",correct:"DANGER",explain:"Leet substitution — 'paypa1' uses '1' instead of 'l'. This is NOT paypal.com — DANGER."},
  {type:"email",label:"Email Analysis",content:"From: noreply@coinbase-support.net\nSubject: Withdraw Suspended — Verify to Continue\n\nYour account withdrawals are suspended:\nhttps://coinbase-support.net/verify",correct:"DANGER",explain:"coinbase-support.net is not coinbase.com. Withdrawal suspension fear + fake domain = DANGER."},
  {type:"url",label:"URL Check",content:"https://developer.apple.com/documentation/",correct:"SAFE",explain:"Legitimate Apple Developer documentation on developer.apple.com — official Apple subdomain."},
  {type:"header",label:"Header Analysis",content:"From: ceo@bigcorp.com\nX-Mailer: iPhone Mail\nAuthentication-Results: spf=pass; dkim=pass\nReply-To: ceo@bigcorp.com\nSubject: Confidential — FWD wire transfer",correct:"SUSPICIOUS",explain:"Authentication passes but C-suite wire transfer requests via email alone are always SUSPICIOUS — requires phone verification."},
  {type:"url",label:"URL Check",content:"https://whatismyipaddress.com/",correct:"SAFE",explain:"Legitimate IP lookup utility site — no financial or credential risk in visiting."},
  {type:"email",label:"Email Analysis",content:"From: accounts@xero.com\nSubject: Invoice INV-2847 from TechSupplier Ltd\n\nView invoice: https://invoicing.xero.com/view/INV-2847",correct:"SAFE",explain:"Legitimate Xero accounting invoice notification from xero.com with a real invoicing.xero.com link — SAFE."},
  {type:"url",label:"URL Check",content:"https://www.google.com/maps/search/restaurants+near+me",correct:"SAFE",explain:"Legitimate Google Maps search URL on google.com — standard search query."},
  {type:"email",label:"Email Analysis",content:"From: team@notion.so\nSubject: John invited you to a Notion workspace\n\nJoin the workspace: https://notion.so/invite/abc123",correct:"SAFE",explain:"Legitimate Notion invitation from notion.so with a real Notion invite URL — SAFE."},
  {type:"url",label:"URL Check",content:"https://g00gle.com/account/login",correct:"DANGER",explain:"Leet substitution — 'g00gle' uses '00' instead of 'oo'. Definitely not google.com — DANGER."},
  {type:"email",label:"Email Analysis",content:"From: do-not-reply@zoom.us\nSubject: Your Zoom account has been suspended\n\nRestore access now:\nhttps://zoom-account-restore.com/login",correct:"DANGER",explain:"Legitimate From address but the link goes to 'zoom-account-restore.com' — not zoom.us. Link-domain mismatch — DANGER."},
  {type:"url",label:"URL Check",content:"https://mail.proton.me/inbox",correct:"SAFE",explain:"Legitimate ProtonMail web interface on mail.proton.me — official ProtonMail domain."},
  {type:"header",label:"Header Analysis",content:"From: newsletter@medium.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nList-Unsubscribe: <https://medium.com/unsubscribe/token>",correct:"SAFE",explain:"Authentication passes, legitimate unsubscribe header pointing to medium.com — SAFE newsletter."},
  {type:"url",label:"URL Check",content:"https://www.fedex.com/en-us/tracking.html?tracknumbers=123456789",correct:"SAFE",explain:"Legitimate FedEx tracking URL on fedex.com — official courier domain."},
  {type:"email",label:"Email Analysis",content:"From: security-alert@bank0famerica.com\nSubject: Fraud Alert: Unauthorized Transaction\n\nBlock this transaction immediately:\nhttps://bank0famerica.com/fraud/block",correct:"DANGER",explain:"Leet substitution: 'bank0famerica' uses '0' not 'o'. Fake domain despite realistic alert content — DANGER."},
  {type:"url",label:"URL Check",content:"https://www.reddit.com/r/netsec/",correct:"SAFE",explain:"Legitimate Reddit community URL on reddit.com — standard subreddit path."},
  {type:"email",label:"Email Analysis",content:"From: no-reply@dropbox.com\nSubject: Michael shared 'Q3 Report.xlsx' with you\n\nView file: https://www.dropbox.com/sh/abc123/BBDef456",correct:"SAFE",explain:"Legitimate Dropbox sharing notification from dropbox.com with a real Dropbox link — SAFE."},
  {type:"url",label:"URL Check",content:"https://secure.runescape.com/m=loginappconfig/loginform.ws",correct:"SAFE",explain:"Legitimate RuneScape login on secure.runescape.com — official Jagex authentication subdomain."},
  {type:"email",label:"Email Analysis",content:"From: legal@dmca-notice.net\nSubject: Copyright Infringement Notice — Immediate Action Required\n\nYour content violates copyright law. Respond within 24h:\nhttps://dmca-notice.net/respond?case=12345",correct:"DANGER",explain:"dmca-notice.net is not an official DMCA authority. Urgency + legal threat + fake domain = social engineering DANGER."},
  {type:"url",label:"URL Check",content:"https://www.cloudflare.com/products/r2/",correct:"SAFE",explain:"Legitimate Cloudflare product page on cloudflare.com — official infrastructure provider domain."},
  {type:"header",label:"Header Analysis",content:"From: noreply@paypal.com\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from mailer.paypal.com (64.4.250.68)",correct:"SAFE",explain:"All authentication passes, received from PayPal's documented mail infrastructure — SAFE."},
  {type:"url",label:"URL Check",content:"https://accounts.binance.com/en/login",correct:"SAFE",explain:"Legitimate Binance login on accounts.binance.com — official Binance authentication subdomain."},
  {type:"email",label:"Email Analysis",content:"From: hr@yourcompany.com\nSubject: Salary Adjustment Notification\n\nYour salary has been adjusted. Confirm bank details at:\nhttps://yourcompany-hr-portal.net/confirm-bank",correct:"DANGER",explain:"Plausible internal sender but the link domain 'yourcompany-hr-portal.net' is not the company's real domain — DANGER."},
  {type:"url",label:"URL Check",content:"https://www.amazon.co.uk/dp/B08N5WRWNW",correct:"SAFE",explain:"Legitimate Amazon UK product page on amazon.co.uk — official Amazon regional domain."},
  {type:"email",label:"Email Analysis",content:"From: admin@wordpress.com\nSubject: Your WordPress.com site is at risk\n\nSecure your site: https://wordpress.com/home",correct:"SAFE",explain:"Legitimate WordPress.com security notification with real wordpress.com link — SAFE."},
  {type:"url",label:"URL Check",content:"https://www.icloud.com/photos/",correct:"SAFE",explain:"Legitimate iCloud Photos page on icloud.com — official Apple cloud service domain."},
  {type:"email",label:"Email Analysis",content:"From: verify@paypal-billing.com\nSubject: Unusual account activity\n\nWe need you to verify your identity:\nhttps://paypal-billing.com/verify-now",correct:"DANGER",explain:"paypal-billing.com is not paypal.com. Completely separate phishing domain using PayPal branding — DANGER."},
];

function ScenarioDrills(){
  const DRILL_SIZE=8;
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const newSession=()=>shuffle(SCENARIOS_BANK).slice(0,DRILL_SIZE);
  const[idx,setIdx]=useState(0),[pick,setPick]=useState(null),[score,setScore]=useState(0),[time,setTime]=useState(30),[done,setDone]=useState(false),[streak,setStreak]=useState(0),[maxStreak,setMaxStreak]=useState(0),[session,setSession]=useState(()=>newSession());
  const timerRef=useRef(null);
  useEffect(()=>{
    if(done||pick!==null)return;
    setTime(30);
    timerRef.current=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(timerRef.current);setPick("TIMEOUT");return 0;}return t-1;}),1000);
    return()=>clearInterval(timerRef.current);
  },[idx,done,pick]);
  const answer=choice=>{clearInterval(timerRef.current);setPick(choice);const correct=choice===session[idx].correct;if(correct){setScore(s=>s+Math.max(10,time*3));setStreak(s=>{const next=s+1;setMaxStreak(m=>Math.max(m,next));return next;});}else setStreak(0);};
  const next=()=>{if(idx+1>=session.length)setDone(true);else{setIdx(i=>i+1);setPick(null);}};
  const reset=()=>{setSession(newSession());setIdx(0);setPick(null);setScore(0);setTime(30);setDone(false);setStreak(0);setMaxStreak(0);};
  if(done){
    const maxScore=session.length*30*3;
    const pct=Math.min(100,Math.round((score/maxScore)*100));
    const susc=Math.max(0,100-pct);
    const{sc:suscColor,label:suscLabel,desc:suscDesc,icon:suscIcon,advice:suscAdvice}=
      susc<=20?{sc:"#00ff88",label:"Very Low Risk",desc:"You have strong phishing awareness and respond quickly under pressure.",icon:"🛡️",advice:"Keep your skills sharp with regular drills. You're well-equipped to protect your organization."}:
      susc<=40?{sc:"#66ffaa",label:"Low Risk",desc:"Good instincts — you catch most threats but occasionally hesitate on edge cases.",icon:"✅",advice:"Review scenarios where you lost time. Speed matters in real triage situations."}:
      susc<=60?{sc:"#ffcc00",label:"Moderate Risk",desc:"You'd likely fall for some phishing attacks, especially under time pressure.",icon:"⚠️",advice:"Focus on URL structure and email authentication signals. Practice regularly to build faster instincts."}:
      susc<=80?{sc:"#ff8800",label:"High Risk",desc:"Multiple attack patterns are likely to succeed against you. Vigilance training is recommended.",icon:"🚨",advice:"Slow down on suspicious emails. When in doubt, verify through official channels — never click links directly."}:
      {sc:"#ff3355",label:"Very High Risk",desc:"You are highly susceptible to phishing attacks. Immediate awareness training is strongly advised.",icon:"🔴",advice:"Do not click links in emails. Always type URLs directly into your browser. Report suspicious messages to IT security."};
    return <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{textAlign:"center",padding:"24px 0 16px"}}>
        <div style={{fontFamily:SYNE,fontSize:56,fontWeight:900,color:score>500?"#00ff88":score>250?"#ffcc00":"#ff3355",lineHeight:1}}>{score}<span style={{fontSize:18,color:"#445",fontWeight:400}}> pts</span></div>
        <div style={{fontFamily:SYNE,fontSize:14,fontWeight:700,color:"#556",letterSpacing:3,marginTop:4}}>{score>500?"ELITE SOC ANALYST 🏆":score>250?"COMPETENT ANALYST 🎯":"NEEDS MORE TRAINING ⚠"}</div>
      </div>

      {/* Susceptibility meter */}
      <div style={{background:"#0a0a1a",border:`2px solid ${suscColor}44`,borderRadius:14,padding:24,margin:"8px 0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontFamily:SYNE,fontWeight:900,fontSize:13,color:"#445",letterSpacing:3,marginBottom:4}}>PHISHING SUSCEPTIBILITY</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:28}}>{suscIcon}</span>
              <span style={{fontFamily:SYNE,fontWeight:900,fontSize:22,color:suscColor}}>{suscLabel}</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:SYNE,fontSize:52,fontWeight:900,color:suscColor,lineHeight:1}}>{susc}<span style={{fontSize:20,color:"#445"}}>%</span></div>
            <div style={{fontSize:10,color:"#445",letterSpacing:2}}>SUSCEPTIBLE</div>
          </div>
        </div>

        {/* Gauge bar */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#445",letterSpacing:2,marginBottom:6}}>
            <span>NOT SUSCEPTIBLE</span><span>HIGHLY SUSCEPTIBLE</span>
          </div>
          <div style={{height:10,borderRadius:5,background:"#0d0d1e",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#00ff88,#66ffaa,#ffcc00,#ff8800,#ff3355)",borderRadius:5,opacity:.3}}/>
            <div style={{position:"relative",height:"100%",width:`${susc}%`,background:`linear-gradient(90deg,#00ff88,${suscColor})`,borderRadius:5,transition:"width 1.2s cubic-bezier(.22,1,.36,1)",boxShadow:`0 0 10px ${suscColor}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#334",marginTop:4}}>
            {[0,25,50,75,100].map(n=><span key={n}>{n}%</span>)}
          </div>
        </div>

        <div style={{fontSize:13,color:"#8899bb",lineHeight:1.7,marginBottom:12}}>{suscDesc}</div>
        <div style={{padding:"10px 14px",background:`${suscColor}0d`,border:`1px solid ${suscColor}33`,borderRadius:8,fontSize:12,color:suscColor,lineHeight:1.7}}>
          💡 <strong>Recommendation:</strong> {suscAdvice}
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["Correct","≈"+(Math.round(pct/100*session.length))+" / "+session.length,"#00ff88"],["Max Streak",maxStreak+"🔥","#ffcc00"],["Avg Speed",score>0?(Math.round(score/session.length))+" pts/q":"—","#6699ff"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#0a0a1a",border:"1px solid #1a1a30",borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontFamily:SYNE,fontSize:20,fontWeight:900,color:c}}>{v}</div>
            <div style={{fontSize:9,color:"#445",letterSpacing:2,marginTop:4}}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{textAlign:"center"}}><button style={{...btnStyle("#6644ff"),padding:"13px 36px"}} onClick={reset}>RETRY DRILLS</button></div>
    </div>;
  }
  const sc=session[idx];
  const timeColor=time>15?"#00ff88":time>7?"#ffcc00":"#ff3355";
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <Label>Triage Drill {idx+1}/{session.length} · Streak: <span style={{color:"#ffcc00"}}>{streak}🔥</span></Label>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontFamily:MONO,fontSize:12,color:"#6677aa"}}>Score: {score}</span>
        <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${timeColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SYNE,fontWeight:900,fontSize:16,color:timeColor}}>{time}</div>
      </div>
    </div>
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Tag color="#6644ff">{sc.type.toUpperCase()}</Tag>
        <span style={{fontFamily:SYNE,fontWeight:700,fontSize:14,color:"#dde"}}>{sc.label}</span>
      </div>
      <div style={{background:"#0d0d1e",border:"1px solid #1a1a30",borderRadius:8,padding:16,fontFamily:MONO,fontSize:12,color:"#8899bb",whiteSpace:"pre-wrap",lineHeight:1.8,marginBottom:18}}>{sc.content}</div>
      {pick===null&&<div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        {["SAFE","SUSPICIOUS","DANGER"].map(r=><button key={r} onClick={()=>answer(r)} style={{...btnStyle(RISK_CFG[r].color),padding:"14px 28px",fontSize:14}}>{RISK_CFG[r].icon} {r}</button>)}
      </div>}
      {pick!==null&&<div style={{animation:"fadeIn .3s ease"}}>
        <InfoBox color={pick===sc.correct?"#00ff88":"#ff3355"}>{pick===sc.correct?`✓ CORRECT! +${Math.max(10,time*3)} points`:`✕ ${pick==="TIMEOUT"?"Time's up!":"Wrong!"} Correct answer: ${sc.correct}`}</InfoBox>
        <div style={{marginTop:10,padding:"12px 16px",background:"rgba(102,68,255,.06)",border:"1px solid rgba(102,68,255,.2)",borderRadius:7,fontSize:12,color:"#9999dd"}}>💡 {sc.explain}</div>
        <div style={{marginTop:12,textAlign:"right"}}><button style={btnStyle("#6644ff")} onClick={next}>{idx+1>=session.length?"SEE SCORE →":"NEXT →"}</button></div>
      </div>}
    </Card>
  </div>;
}

// ── Custom Blocklist Manager ───────────────────────────────────────────────────
function BlocklistManager(){
  const{dark}=useTheme();
  const[domains,setDomains]=useState(CUSTOM_DOMAINS), [kws,setKws]=useState(CUSTOM_KW);
  const[newDom,setNewDom]=useState(""), [newKw,setNewKw]=useState("");
  const addDom=()=>{if(!newDom.trim())return;const next=[...domains,newDom.trim().toLowerCase()];setDomains(next);CUSTOM_DOMAINS=next;setNewDom("");};
  const remDom=d=>{const next=domains.filter(x=>x!==d);setDomains(next);CUSTOM_DOMAINS=next;};
  const addKw=()=>{if(!newKw.trim())return;const next=[...kws,newKw.trim().toLowerCase()];setKws(next);CUSTOM_KW=next;setNewKw("");};
  const remKw=k=>{const next=kws.filter(x=>x!==k);setKws(next);CUSTOM_KW=next;};
  const inp={flex:1,background:dark?"#0a0a18":"#f5f6fc",border:`1px solid ${dark?"#1a1a38":"#dde"}`,borderRadius:6,padding:"9px 12px",fontFamily:MONO,fontSize:12,color:dark?"#c8d0e0":"#1a1a38",outline:"none"};
  return <div>
    <Label>Custom Blocklist — feeds into all URL & Email scanners</Label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <Label>Blocked Domains ({domains.length})</Label>
        <div style={{display:"flex",gap:8,marginBottom:12}}><input style={inp} placeholder="e.g. evil-domain.xyz" value={newDom} onChange={e=>setNewDom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDom()}/><button style={btnStyle()} onClick={addDom}>ADD</button></div>
        {domains.length===0&&<div style={{fontSize:12,color:"#445"}}>No custom domains added yet.</div>}
        {domains.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:dark?"#0d0d1e":"#f8f9ff",borderRadius:5,marginBottom:5,border:"1px solid #1a1a30"}}>
          <span style={{fontFamily:MONO,fontSize:12,color:"#ff8899"}}>{d}</span>
          <button onClick={()=>remDom(d)} style={{background:"none",border:"none",color:"#ff335566",cursor:"pointer",fontSize:16}}>✕</button>
        </div>)}
      </Card>
      <Card>
        <Label>Blocked Keywords ({kws.length})</Label>
        <div style={{display:"flex",gap:8,marginBottom:12}}><input style={inp} placeholder="e.g. winprize" value={newKw} onChange={e=>setNewKw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addKw()}/><button style={btnStyle("#ff9900")} onClick={addKw}>ADD</button></div>
        {kws.length===0&&<div style={{fontSize:12,color:"#445"}}>No custom keywords added yet.</div>}
        {kws.map((k,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:dark?"#0d0d1e":"#f8f9ff",borderRadius:5,marginBottom:5,border:"1px solid #1a1a30"}}>
          <span style={{fontFamily:MONO,fontSize:12,color:"#ffaa44"}}>{k}</span>
          <button onClick={()=>remKw(k)} style={{background:"none",border:"none",color:"#ff335566",cursor:"pointer",fontSize:16}}>✕</button>
        </div>)}
      </Card>
    </div>
    <InfoBox color="#00ff88" style={{marginTop:12}}>✓ Changes apply immediately to all active scanners in this session.</InfoBox>
  </div>;
}

// ── Awareness Quiz ────────────────────────────────────────────────────────────
const QUIZ_BANK=[
  // URL & Domain Recognition
  {q:"An email link leads to 'paypa1.com/login'. What's wrong?",a:0,opts:["Leet substitution — '1' replaces 'l' to spoof PayPal","Nothing, it looks fine","Only suspicious if HTTP","Only risky on mobile"],x:"Leet substitution swaps characters to mimic real brands. 'paypa1.com' is not PayPal."},
  {q:"Which domain is most likely a phishing attempt?",a:2,opts:["mail.google.com","accounts.paypal.com","paypal-secure-login.com","support.apple.com"],x:"'paypal-secure-login.com' is a separate domain with the brand name used as a subdirectory trick."},
  {q:"A URL contains your bank name followed by '.xyz'. What do you do?",a:1,opts:["Click — it has your bank's name","Avoid it — .xyz is a suspicious TLD","Click if it has HTTPS","Only avoid on desktop"],x:".xyz is commonly used in phishing domains. Your real bank uses a well-known TLD like .com."},
  {q:"What does a URL shortener like bit.ly hide?",a:2,opts:["Your IP address","Your browser version","The true destination URL","Your email address"],x:"URL shorteners mask the real destination, making it impossible to verify safety before clicking."},
  {q:"You see 'https://google.com.malicious-site.ru'. Which domain is this actually on?",a:1,opts:["google.com","malicious-site.ru","google.ru","com.malicious-site"],x:"The real domain is always the part just before the first single slash — 'malicious-site.ru'."},
  {q:"An email has a link showing 'paypal.com' as display text but the actual URL is different. This is:",a:0,opts:["Link spoofing — a classic phishing technique","Normal — display text is always the URL","Safe if HTTPS","Fine if the email looks official"],x:"Attackers display a trusted URL as text while the actual hyperlink points elsewhere. Always hover to check."},
  {q:"Which of these URLs is safest to enter your password on?",a:3,opts:["http://bank.com/login","https://bank.com.secure-login.xyz/login","https://192.168.1.1/bank-login","https://bank.com/login"],x:"Only the last option uses HTTPS on the real bank.com domain without any suspicious additions."},
  {q:"A domain has 4 hyphens in it. This is:",a:2,opts:["Normal for long company names","Only suspicious if .tk TLD","A red flag — hyphens are abused in phishing domains","Fine if HTTPS"],x:"Multiple hyphens are a classic phishing domain pattern: 'secure-paypal-account-verify.com'."},
  {q:"What does an @ symbol in a URL like 'https://google.com@evil.com' do?",a:1,opts:["It's a mailto link","Routes to evil.com — everything before @ is ignored","Logs you into google.com","Encodes special characters"],x:"Browsers treat the text before @ as credentials and navigate to what follows — 'evil.com' in this case."},
  {q:"A website uses HTTPS. Does that mean it's safe?",a:1,opts:["Yes — HTTPS guarantees safety","No — HTTPS only encrypts traffic, phishing sites use it too","Yes if padlock is green","Only safe on banking sites"],x:"HTTPS encrypts your connection but says nothing about the site's intentions. Phishing sites use HTTPS freely."},
  // Email Indicators
  {q:"You receive an urgent email from 'security@apple-support.net'. The real Apple domain is:",a:2,opts:["apple-support.net","support.apple.net","apple.com","appleid.net"],x:"Apple's official domain is apple.com. 'apple-support.net' is a completely different domain."},
  {q:"Classic phishing email indicator?",a:0,opts:["Generic 'Dear Customer' greeting","Personalized greeting with your name","Email from hr@yourcompany.com","A reset you requested"],x:"Generic greetings are used because attackers blast emails to millions without knowing recipient names."},
  {q:"An email asks you to 'verify your account within 24 hours or it will be closed.' This is:",a:3,opts:["Legitimate — banks do this","Worth clicking to be safe","Only suspicious if unknown sender","Urgency language — a core phishing tactic"],x:"Artificial deadlines pressure victims into acting without thinking. Legitimate services rarely threaten immediate closure."},
  {q:"You receive a reply-to address that differs from the 'From' address. This suggests:",a:2,opts:["Nothing unusual","A technical email setup","The sender wants replies to go elsewhere — possibly an attacker","A newsletter"],x:"Mismatched Reply-To addresses are used to intercept your replies. It's a major phishing indicator."},
  {q:"An email claims to be from your CEO asking for urgent wire transfer. Best action?",a:1,opts:["Wire immediately — CEO said urgent","Call the CEO directly on a known number to verify","Reply to the email to confirm","Forward to accounting"],x:"This is Business Email Compromise (BEC). Always verify financial requests via a separate, known communication channel."},
  {q:"Phishing emails often avoid using your real name because:",a:0,opts:["They don't know who you are — they send mass emails","It's against spam laws","Your name is hard to spell","Email systems filter it"],x:"Mass phishing campaigns have no idea who they're emailing, hence generic greetings like 'Dear User'."},
  {q:"An email from 'noreply@paypal.com.phishingsite.com' — which domain is this from?",a:2,opts:["paypal.com","noreply.com","phishingsite.com","paypal.com.phishingsite"],x:"The sending domain is everything after the last '@' — 'phishingsite.com'. The rest is cosmetic."},
  {q:"You get an email saying 'Your package could not be delivered, pay $1.99 fee.' You weren't expecting a package. This is:",a:3,opts:["Probably real — delivery fees happen","Worth paying to be safe","Only suspicious if large fee","Almost certainly phishing — unsolicited unexpected delivery fee"],x:"Parcel delivery phishing is extremely common. Attackers hope some recipients are expecting packages."},
  {q:"An email contains multiple spelling and grammar errors. This is:",a:0,opts:["A warning sign of phishing","Normal for automated emails","Only suspicious if urgent language is used","Irrelevant to security"],x:"Poor grammar can indicate phishing, though sophisticated attacks are well-written. It's one signal among many."},
  {q:"Your colleague's email account sends you a strange link. You should:",a:2,opts:["Click it — it's from a colleague","Ignore it","Contact your colleague via phone to verify before clicking","Forward to IT automatically"],x:"Compromised accounts are used to send phishing links to contacts. Always verify unexpected links even from known people."},
  // Attachments
  {q:"Attachment 'Invoice_2024.exe' arrives. What do you do?",a:2,opts:["Open if expecting an invoice","Scan with antivirus first","Delete — .exe is never a legitimate invoice","Save to desktop first"],x:".exe files disguised as invoices are a primary malware delivery method. Never open unsolicited executables."},
  {q:"A Word document arrives and asks you to 'Enable Macros to view content.' You should:",a:1,opts:["Enable macros — the document looks official","Never enable macros in unexpected documents","Enable only if the sender is known","Enable if the email passed spam filters"],x:"Enabling macros on unexpected documents is one of the most common ways malware infects computers."},
  {q:"Which file extension is safest to open from an unknown sender?",a:2,opts:[".exe",".docm",".pdf (read-only viewer)",".zip"],x:".pdf viewed in a sandboxed reader is generally safest, though PDFs can also carry malware. .exe and .docm are high risk."},
  {q:"A file named 'Report.pdf.exe' — what is the true file type?",a:1,opts:["PDF","Executable (.exe) — PDF is a disguise","A combined PDF-EXE","Unknown"],x:"Windows hides known extensions by default. The true extension is .exe — a double-extension trick."},
  {q:"An archive (.zip) from an unknown sender contains a single file. You should:",a:3,opts:["Open the zip and run the file","Open the zip but don't run it","Scan with antivirus then open","Do not open — report to IT"],x:"Attackers use archives to bypass email filters. Even after extraction, do not run unknown files."},
  // Passwords & Credentials
  {q:"HTTP vs HTTPS for entering passwords?",a:1,opts:["HTTP is fine if the site looks official","HTTPS only — it encrypts your data in transit","Both are equally secure","Only matters on public Wi-Fi"],x:"HTTPS encrypts data between you and the server. HTTP transmits passwords in plaintext — never use it for credentials."},
  {q:"A website asks for your password to 'verify your identity' after you clicked an email link. Best action?",a:2,opts:["Enter it — verification is normal","Enter it if HTTPS","Close the tab and navigate to the site directly","Enter a fake password first"],x:"Never enter credentials via email links. Always navigate directly to the official site."},
  {q:"You're asked to enter your password to see a 'shared document'. What do you do?",a:1,opts:["Enter it — document sharing requires it","Verify the domain carefully — this is a common phishing lure","Enter it if the design looks official","Enter if a colleague sent the link"],x:"'Shared document' credential harvesting is one of the most common phishing techniques, often faking Google or Microsoft."},
  {q:"Your password manager flags a login page as not matching the saved site. You should:",a:0,opts:["Trust the password manager — this is likely a phishing site","Dismiss the warning and log in","Enter manually since autofill is glitchy","Report it as a false positive"],x:"Password managers verify the exact domain. If there's a mismatch, you're almost certainly on a phishing site."},
  {q:"What is credential harvesting?",a:2,opts:["Collecting API keys for developers","Storing passwords in a manager","Tricking users into entering credentials on a fake site","Checking password strength"],x:"Credential harvesting is the primary goal of most phishing sites — getting your username and password."},
  // Social Engineering
  {q:"'You won $1,000! Claim at bit.ly/prize' — red flags?",a:1,opts:["None if prize is real","Unsolicited prize + URL shortener = phishing","Only if unknown sender","None — prizes are real"],x:"You can't win a contest you didn't enter. URL shorteners hide the true destination. Classic phishing combo."},
  {q:"An email says your Netflix account is suspended and to click to restore it. Best action?",a:2,opts:["Click the link immediately","Ignore — Netflix never sends emails","Open Netflix directly in your browser or app","Reply to the email"],x:"Go directly to Netflix.com — if there's a real issue, it will show there. Never use email links for account access."},
  {q:"What is spear phishing?",a:0,opts:["Targeted phishing using personal details about the victim","Mass phishing emails sent to millions","Phishing via SMS","Phishing via phone calls"],x:"Spear phishing is targeted — attackers research the victim and personalize the attack, making it harder to detect."},
  {q:"A caller claims to be from your bank's fraud department and asks for your OTP. You should:",a:3,opts:["Provide it — fraud department needs it","Provide only the first digit","Ask for their employee ID first","Hang up — legitimate banks never ask for OTPs over the phone"],x:"No legitimate bank will ever ask for your one-time password. This is vishing (voice phishing)."},
  {q:"What is pretexting in phishing?",a:1,opts:["Creating a fake website","Creating a fabricated scenario to gain trust before the attack","Sending malicious attachments","Using leet speak in domains"],x:"Pretexting involves building a believable fake context (e.g., 'I'm from IT') to manipulate victims into complying."},
  {q:"'Your IT department needs your password to upgrade your account.' You should:",a:2,opts:["Provide it — IT needs it","Provide it in an encrypted email","Never — IT should never need your password","Ask a colleague first"],x:"Legitimate IT staff never need your password. They have admin access through proper channels."},
  {q:"An SMS from an unknown number contains a link to 'verify your bank details.' This is:",a:0,opts:["Smishing — SMS phishing","Normal bank verification","A security alert — click immediately","Only suspicious if the number is international"],x:"Smishing (SMS phishing) is increasingly common. Banks communicate through their official apps, not random SMS links."},
  {q:"A pop-up says 'Your computer is infected! Call this number now!' You should:",a:3,opts:["Call the number immediately","Click the X to close","Run your antivirus","Close the browser tab — this is a tech support scam"],x:"Legitimate security software doesn't use browser pop-ups with phone numbers. This is a tech support scam."},
  {q:"What is whaling?",a:2,opts:["Phishing for credit card details","Mass email phishing","Spear phishing targeting senior executives (CEOs, CFOs)","Phishing via WhatsApp"],x:"Whaling targets high-value individuals like executives. The attacks are highly tailored and often involve wire transfers."},
  {q:"A LinkedIn message from a recruiter contains a link to 'view the job description.' You should:",a:1,opts:["Click it — recruiters use links","Hover to check the URL before clicking","Never use LinkedIn links","Report the recruiter immediately"],x:"Attackers use professional platforms for phishing. Always check the actual URL before clicking, even on trusted networks."},
  // Two-Factor Authentication
  {q:"You receive an OTP text you didn't request. This likely means:",a:0,opts:["Someone has your password and is trying to log in","Your carrier sent a test message","You were randomly selected for verification","Your account is being upgraded"],x:"An unrequested OTP means someone is attempting to log in with your credentials. Change your password immediately."},
  {q:"Why doesn't SMS-based 2FA fully protect against phishing?",a:2,opts:["SMS is not encrypted","2FA codes expire too quickly","Attackers can relay codes in real time on fake sites","Mobile networks are insecure"],x:"Real-time phishing attacks capture your 2FA code as you type it and immediately relay it to the real site."},
  {q:"Which 2FA method is strongest against phishing?",a:3,opts:["SMS one-time codes","Email verification codes","App-based TOTP (Google Authenticator)","Hardware security key (FIDO2/WebAuthn)"],x:"Hardware keys cryptographically verify the site's domain — they won't work on phishing sites even if you try."},
  {q:"A fake login page captures your username, password, and 2FA code in real time. This attack is called:",a:1,opts:["Credential stuffing","Adversary-in-the-middle (AiTM) phishing","Brute force","Session hijacking"],x:"AiTM attacks proxy the real site in real time, capturing all credentials including 2FA codes instantly."},
  // Security Hygiene
  {q:"You find a USB drive in the parking lot. You should:",a:3,opts:["Plug it in to see who owns it","Plug it in on a guest computer","Scan it with antivirus before opening","Hand it to IT security without plugging it in"],x:"USB drops are a physical social engineering tactic. Malware can execute the moment you plug it in."},
  {q:"How often should you update your passwords for sensitive accounts?",a:2,opts:["Never — changing passwords weakens memory","Every day","When there's reason to (breach, suspicious activity)","Every 30 days without exception"],x:"Modern guidance: use unique strong passwords and change them when you have reason to (breach, suspicious login). Random forced rotation backfires."},
  {q:"What is the safest way to store passwords?",a:1,opts:["Write them in a notebook","Use a reputable password manager","Memorize them all","Save them in a browser text file"],x:"A password manager generates, stores, and autofills unique strong passwords. It also detects phishing domains."},
  {q:"You're on public Wi-Fi. What should you use?",a:0,opts:["A VPN to encrypt your traffic","Nothing extra — public Wi-Fi is safe","Only HTTP sites","Incognito mode"],x:"Public Wi-Fi can be intercepted. A VPN encrypts your traffic from your device to the VPN server."},
  {q:"What is the best defense against phishing?",a:3,opts:["Antivirus software","Email spam filters","Firewalls","Security awareness + skepticism about unexpected requests"],x:"Technology helps, but the most effective defense is a trained, skeptical user who pauses before clicking."},
  {q:"Your browser shows a certificate warning for a site. You should:",a:2,opts:["Click 'Advanced' and proceed","Clear browser cache and retry","Stop — do not proceed to the site","Refresh the page"],x:"Certificate warnings indicate the connection may be intercepted or the site is not who it claims to be."},
  {q:"An employee should report suspected phishing to:",a:1,opts:["Nobody — just delete it","The security/IT team immediately","Their manager","The email sender"],x:"Reporting phishing attempts helps IT teams protect others and investigate potential breaches."},
  {q:"What is a phishing kit?",a:0,opts:["A ready-made package attackers use to deploy fake login pages","A USB drive with phishing tools","An email template editor","A list of target email addresses"],x:"Phishing kits contain fake login pages, scripts, and configuration that attackers deploy on compromised servers in minutes."},
  // More URL Recognition
  {q:"'secure-microsoft-verify.com' — what makes this suspicious?",a:2,opts:["Nothing — 'secure' is a good sign","Nothing — 'microsoft' is in the name","Microsoft's real domain is microsoft.com — this is a different domain","Only suspicious if HTTP"],x:"Including a brand name in a different domain doesn't make it official. Microsoft only operates from microsoft.com."},
  {q:"A URL has 'login' in the path: 'evil.com/microsoft/login'. The site is on:",a:0,opts:["evil.com","microsoft.com","login.com","microsoft/login"],x:"The path (/microsoft/login) is just a folder name on evil.com. It has nothing to do with Microsoft."},
  {q:"Which TLD is most associated with phishing?",a:1,opts:[".com",".xyz",".org",".net"],x:".xyz and similar new TLDs (.click, .top, .work) are cheap and popular with phishing operators."},
  {q:"What should you do before clicking a link in an email?",a:3,opts:["Check if the email looks official","See if the sender name is familiar","Count the links in the email","Hover over the link to preview the actual URL"],x:"Hovering reveals the real URL before you commit. The displayed text and actual destination can be completely different."},
  {q:"A domain like 'arnazon.com' is an example of:",a:2,opts:["A legitimate Amazon regional site","A DNS error","A typosquat — a domain that looks like Amazon but isn't","An Amazon affiliate"],x:"Typosquatting registers domains that look like popular brands (arnazon vs amazon) to catch typing mistakes."},
  {q:"Why is 'amazon.com.co' suspicious?",a:1,opts:["It's not — .co is Colombia's domain","Amazon's real domain is amazon.com — '.co' makes this a subdomain of 'com.co'","It's a legitimate Amazon regional site","Only suspicious if mobile"],x:"'amazon.com.co' is actually the 'amazon' subdomain of 'com.co' — a completely different domain from Amazon."},
  {q:"An IP address in a URL (e.g., http://192.168.1.1/bank) is:",a:0,opts:["A strong red flag — legitimate sites use domain names","Normal for banking sites","Only suspicious if HTTP","Fine if the IP is local"],x:"Legitimate websites use domain names, not raw IP addresses. IPs in URLs are a strong phishing indicator."},
  {q:"Excessive subdomains like 'secure.account.verify.login.paypal.phish.com' — the actual domain is:",a:3,opts:["paypal.com","login.paypal.phish.com","verify.login.paypal.phish.com","phish.com"],x:"The real domain is always the last two segments before the first '/'. Everything else is subdomains of 'phish.com'."},
  {q:"A legitimate company's login URL will always have the company domain:",a:0,opts:["Immediately before the first '/'","Anywhere in the URL","After 'login'","After 'secure'"],x:"Legitimate domains appear as the last part of the host, right before the first forward slash."},
  {q:"You're sent a QR code to scan. What risk does it carry?",a:2,opts:["QR codes are always safe","Only unsafe if from unknown senders","It can contain a URL to a phishing site — always check before proceeding","Only unsafe on Android"],x:"QR codes encode URLs that bypass visual inspection. Always check the decoded URL before proceeding."},
  // Email Headers
  {q:"What does SPF failure in an email header indicate?",a:1,opts:["The email was encrypted","The sending IP is not authorized to send for that domain","The email contains spam keywords","The attachment is malicious"],x:"SPF (Sender Policy Framework) verifies that the sending server is authorized by the domain owner. Failure = likely spoofed."},
  {q:"DKIM failure means:",a:0,opts:["The email content may have been tampered with in transit","The domain has expired","The email was sent to the wrong person","The sender's server is down"],x:"DKIM uses cryptographic signatures to ensure email content wasn't altered after sending. Failure suggests tampering or spoofing."},
  {q:"DMARC 'fail' means:",a:3,opts:["The domain has a typo","The email was too large","The email was sent too quickly","Neither SPF nor DKIM aligned with the From domain — very likely spoofed"],x:"DMARC ties SPF and DKIM to the visible From address. Failure strongly indicates email spoofing."},
  {q:"An email shows 8 'Received' hops. This could indicate:",a:2,opts:["The email is legitimate — all major providers add hops","The email is very old","Potential routing obfuscation — legitimate emails usually have 2-4 hops","The email was flagged for spam"],x:"Excessive relay hops can indicate the attacker is routing email through multiple servers to hide its true origin."},
  {q:"The 'Reply-To' header differs from the 'From' header. This:",a:0,opts:["Is a major red flag — replies go to a different address","Is normal for newsletters","Only matters for business email","Is a sign of good email hygiene"],x:"A different Reply-To address means your reply goes to the attacker, not the apparent sender. Classic phishing technique."},
  // Advanced Topics
  {q:"What is Business Email Compromise (BEC)?",a:1,opts:["Bulk phishing targeting businesses","Impersonating executives or vendors to authorize fraudulent transactions","Installing malware via business email","Hacking business email servers"],x:"BEC causes billions in losses annually. Attackers impersonate trusted insiders to authorize wire transfers or data leaks."},
  {q:"You receive a Docusign email. What should you verify before signing?",a:3,opts:["That the document looks official","That the email has a Docusign logo","That the email wasn't in spam","The sending domain and that you expected this document"],x:"Attackers clone Docusign pages perfectly. Always verify you expected the document and the domain is docusign.com."},
  {q:"What is pharming?",a:2,opts:["Farming click data from phishing sites","Sending phishing emails to farming communities","Redirecting users to fake sites without them clicking any link, via DNS poisoning","Creating phishing kits"],x:"Pharming corrupts DNS to redirect legitimate URLs to attacker-controlled sites, even if you type the correct address."},
  {q:"A 'watering hole attack' involves:",a:0,opts:["Infecting websites frequently visited by the target group","Flooding a victim with emails","Poisoning drinking water infrastructure","Targeting water utility companies"],x:"Attackers compromise websites the target group visits regularly, infecting visitors without any phishing email needed."},
  {q:"What is typosquatting?",a:3,opts:["Squatting in a home illegally","Using malformed email headers","Injecting malicious ads into legitimate sites","Registering domains similar to popular sites to catch mistyped URLs"],x:"Typosquatting catches people who mistype URLs (e.g., 'goggle.com') and serves them malicious content."},
  {q:"Homoglyph attacks use:",a:1,opts:["Comic sans to disguise phishing","Unicode characters that look identical to Latin letters (e.g., Cyrillic 'а' for 'a')","Multiple hyphens in URLs","Look-alike email signatures"],x:"'аpple.com' using Cyrillic 'а' looks identical to 'apple.com' but is a completely different domain."},
  {q:"What should you do if you accidentally clicked a phishing link?",a:2,opts:["Close the browser immediately — no harm done","Change only the password for that site","Disconnect from the network, run a malware scan, report to IT, and change all passwords","Wait and see if anything suspicious happens"],x:"Act fast: disconnect, scan, report to IT, and change passwords — especially if you entered any credentials."},
  {q:"A phishing email passes spam filters. This means:",a:0,opts:["You still need to evaluate it manually — filters aren't perfect","It is safe","The sender is legitimate","DKIM passed"],x:"Spam filters miss sophisticated phishing. User vigilance is essential — filters are one layer of many."},
  {q:"'Juice jacking' refers to:",a:3,opts:["Phishing via juice brand ads","SQL injection via forms","SIM card attacks","Malware or data theft via compromised USB charging ports"],x:"Public USB charging ports can be modified to install malware or steal data from connected devices."},
  {q:"What is credential stuffing?",a:1,opts:["Manually guessing weak passwords","Using leaked username/password pairs from one breach to try to log into other services","Phishing for passwords via email","Brute-forcing passwords with a dictionary"],x:"Credential stuffing exploits password reuse. If you use the same password across sites, one breach exposes all accounts."},
  // Scenario-based Quiz Questions
  {q:"You receive: 'Your Apple ID was used in Russia. Verify now: http://apple-id-verify.top/confirm' — what do you do?",a:2,opts:["Click — Apple security alerts are real","Forward to Apple","Go to appleid.apple.com directly to check","Reply asking for more details"],x:"Apple security notices come from apple.com. Always navigate directly — 'apple-id-verify.top' is a phishing domain."},
  {q:"An email has your full name, job title, and manager's name. It asks you to buy gift cards urgently. This is:",a:3,opts:["Likely legitimate since they know you","Only suspicious if the gift card amount is high","A coincidence — your info is public","Spear phishing — personal details make it convincing but it's still a scam"],x:"Attackers research LinkedIn and company websites. Personalization makes phishing more convincing, not more legitimate."},
  {q:"You get an invoice from a familiar vendor but with new bank details. You should:",a:0,opts:["Call the vendor on their known number to verify before paying","Pay it — the invoice looks identical to previous ones","Email back to confirm","Ask a colleague to review it"],x:"Invoice fraud is extremely common. Attackers compromise vendor email and swap bank details. Always verify by phone."},
  {q:"An IT helpdesk ticket asks you to install remote access software. Best action?",a:1,opts:["Install it — IT requests are legitimate","Verify the request through the official helpdesk system before installing anything","Install it if the email looks official","Ask a colleague if they received the same email"],x:"Attackers impersonate helpdesks to install remote access tools. Verify all such requests through official channels."},
  {q:"You receive a security alert that your email account was compromised and to log in to secure it. You should:",a:2,opts:["Click the link — it's urgent","Ignore it","Navigate directly to your email provider's website — not via the link","Forward to IT"],x:"This is a classic phishing lure. Navigate directly to your email provider; if there's a real issue, it will show there."},
  {q:"A colleague forwards an email asking for feedback on a shared Google Doc. You should:",a:3,opts:["Click — it's from a colleague","Click if the Google logo looks real","Open Google Drive and look for the document","Check the actual link URL and that it goes to docs.google.com before clicking"],x:"Colleagues' accounts get compromised. Verify shared document links go to the real Google Docs domain."},
  {q:"You receive a charity donation request after a natural disaster. Best practice?",a:1,opts:["Click the link and donate","Find the charity independently and donate through their official website","Donate only if the email has photos","Check the charity name in the email subject"],x:"Disaster phishing exploits generosity. Find charities independently via their verified websites — not email links."},
  {q:"A Microsoft 365 login page appears when you click an email link. The URL bar shows 'microsoftonline.com.au-phish.com'. This is:",a:0,opts:["A phishing site — the real domain is 'au-phish.com'","A legitimate Australian Microsoft site","Safe because 'microsoftonline.com' is in the URL","Fine if you use Microsoft 365"],x:"The real domain is 'au-phish.com'. 'microsoftonline.com' is just a subdomain of the phishing domain."},
  {q:"Your email client shows the full headers of a suspicious email. What's the most important thing to check?",a:3,opts:["The number of recipients","Whether it was sent from a mobile device","The email timestamp","SPF, DKIM, and DMARC authentication results"],x:"Email authentication results (SPF/DKIM/DMARC) reveal whether the sender is who they claim to be."},
  {q:"What's wrong with this email? 'From: hr@yourcompany.com | Subject: New Benefits — click here | Link goes to benefits-yourcompany.xyz'",a:2,opts:["Nothing — HR sends benefits emails","The subject is too short","The link domain doesn't match the company domain — this is phishing","The From address should be HR@"],x:"Even if the From address looks right, the link going to a different domain is the critical red flag."},
  // Mobile & Social Media
  {q:"A Facebook message from a friend contains only a link with 'Is this you in this video?' You should:",a:1,opts:["Click it — it's from a friend","Ignore it — this is a common account-hijacking lure","Click if you have antivirus","Ask Facebook support"],x:"This is a classic compromised-account message. Clicking often leads to credential harvesting or malware."},
  {q:"An SMS asks you to click a link to track a package. You haven't ordered anything. You should:",a:0,opts:["Delete it — this is smishing (SMS phishing)","Click — package tracking is normal","Forward to delivery company","Click if you have antivirus on your phone"],x:"Smishing uses fake delivery texts to steal credentials or install malware. If you didn't order anything, it's a scam."},
  {q:"A WhatsApp message asks you to forward a code 'accidentally' sent to you. You should:",a:3,opts:["Forward it — it was a mistake","Forward after confirming with the sender","Forward only to the sender's number","Never forward codes — this is a WhatsApp account takeover attack"],x:"Attackers trick you into forwarding the WhatsApp verification code they requested, hijacking your account."},
  {q:"'Your phone storage is full — click to clean it' pop-up. This is most likely:",a:2,opts:["A genuine OS warning","A legitimate app notification","Adware or a browser-based phishing attempt","A carrier notification"],x:"Real OS storage warnings come from system settings, not browser pop-ups. This is likely malicious advertising."},
  {q:"An Instagram DM from a verified-looking account offers you a free product for 'just shipping costs.' This is:",a:0,opts:["A phishing/fraud attempt — 'free but pay shipping' is a common scam","A legitimate brand promotion","Only suspicious if they ask for credit card","Fine if the account has many followers"],x:"'Free but pay shipping' scams harvest your card details. Legitimate promotions don't ask for payment."},
  // More Advanced
  {q:"What makes a phishing attack 'targeted' vs 'generic'?",a:1,opts:["The number of emails sent","Personalization using specific knowledge about the victim","The quality of the fake website","Whether it uses HTTPS"],x:"Targeted (spear) phishing uses personal details to appear legitimate. Generic phishing casts a wide net with no personalization."},
  {q:"'Vishing' is phishing via:",a:2,opts:["Video calls","Verified email senders","Voice calls or phone","Virtual private networks"],x:"Vishing (voice phishing) involves attackers calling victims and impersonating banks, IT support, or government agencies."},
  {q:"A domain registered 3 days ago is hosting a banking login page. This should make you:",a:0,opts:["Immediately suspicious — new domains hosting banking pages are a major red flag","More confident — it's a new site","Neutral — registration date doesn't matter","Check it on your mobile instead"],x:"Phishing domains are freshly registered to avoid blocklists. A 3-day-old domain running a bank login page is extremely suspicious."},
  {q:"Email display name shows 'PayPal Security' but the From address is random@gmail.com. The real sender is:",a:3,opts:["PayPal Security","Unclear","PayPal's Gmail account","random@gmail.com — display names can be set to anything"],x:"Display names are completely spoofable. The actual From address is what matters — and gmail.com is not PayPal."},
  {q:"A legitimate bank email will NEVER ask you to:",a:1,opts:["Inform you about new features","Provide your full password, PIN, or OTP via email or phone","Notify you of suspicious activity","Send you a secure message link"],x:"Banks never ask for full passwords, PINs, or OTPs by email or phone. Any such request is fraudulent."},
  {q:"What is a 'clone phishing' attack?",a:2,opts:["Creating an identical copy of a target website","Phishing using cloned SIM cards","Duplicating a legitimate email and replacing links with malicious ones","Creating fake social media profiles"],x:"Clone phishing takes a real email you received, duplicates it, replaces links with malicious ones, and resends it."},
  {q:"An unexpected 'account locked' email from your bank. Best action?",a:3,opts:["Click the link — locked accounts need immediate action","Reply to the email asking for details","Forward to a colleague","Call the bank directly using the number on the back of your card"],x:"Always use the contact info from official bank documentation — never from within the suspicious email itself."},
  {q:"A free public tool asks for your Google credentials to 'access Drive.' This is:",a:0,opts:["Likely an OAuth phishing attempt — use Google's official OAuth flow","Normal — many tools need Google access","Fine if the tool is popular","Fine if it looks like Google's login page"],x:"Legitimate Google integrations use Google's official OAuth — they never ask you to type your Google password into a third-party site."},
  {q:"What is the risk of reusing the same password across multiple sites?",a:1,opts:["No risk if the password is strong","One breach exposes all accounts — credential stuffing uses leaked pairs across sites","Only a risk if one of the sites is a bank","No risk if you use 2FA on all sites"],x:"Even with a strong password, reuse means one compromised site gives attackers access to everything else you use."},
  {q:"A padlock icon in the browser address bar means:",a:2,opts:["The site is legitimate and safe","The site is verified by the government","The connection is encrypted, NOT that the site is trustworthy","The site has been scanned for malware"],x:"The padlock means TLS encryption is active. Phishing sites routinely use HTTPS and display the padlock."},
  {q:"What is social engineering in cybersecurity?",a:3,opts:["Hacking social media platforms","Building social networks for security teams","Engineering social media content","Manipulating people psychologically to reveal information or take harmful actions"],x:"Social engineering exploits human psychology rather than technical vulnerabilities. Most phishing is social engineering."},
  {q:"A coworker says they clicked a phishing link and entered their password. What should happen first?",a:0,opts:["IT resets their password and checks for unauthorized access immediately","Wait to see if anything bad happens","Tell them to change the password later","Run antivirus and continue working"],x:"Time is critical. IT must act immediately — the attacker may already be accessing the account or moving laterally."},
  {q:"'Multi-factor authentication (MFA) makes phishing impossible.' This statement is:",a:1,opts:["True — MFA fully blocks phishing","False — MFA adds protection but can be bypassed by real-time relay attacks","True if using SMS-based MFA","True for hardware keys only"],x:"MFA significantly raises the bar but isn't foolproof. AiTM attacks and SIM swapping can bypass most MFA methods."},
  {q:"An email contains a tracking pixel. What can it reveal when opened?",a:2,opts:["Your passwords","Your full browsing history","Your IP address and that the email was opened","Your location in real time"],x:"Tracking pixels are 1x1 images that when loaded confirm to the sender that you opened the email, and can reveal your IP."},
  {q:"Why do attackers often use free email services (Gmail, Outlook) to send phishing?",a:3,opts:["They have better deliverability","They are untraceable","They're harder to block","They appear more trustworthy, pass basic spam filters, and are free to create"],x:"Free email services pass many spam filters and lend an air of legitimacy when impersonating individuals rather than brands."},
  {q:"What is 'angler phishing'?",a:1,opts:["Phishing via fishing-themed emails","Phishing via fake social media customer service accounts","Phishing using angled text to bypass OCR","Phishing via compromised router DNS"],x:"Angler phishing creates fake brand customer service accounts to intercept complaints and steal credentials from frustrated customers."},
  {q:"You should report phishing emails rather than just deleting them because:",a:0,opts:["Reports help security teams block the attack for everyone","Deletion is against company policy","Reporting earns security training credits","It automatically blocks the sender"],x:"Reporting phishing helps security teams identify campaigns, protect colleagues, and improve defenses for the whole organization."},
  {q:"Your IT security team sends a simulated phishing email. What's the purpose?",a:2,opts:["To punish employees who click","To test email filters","To train employees and measure susceptibility without real risk","To comply with regulations only"],x:"Phishing simulations train users to recognize attacks in a safe environment and identify who needs additional training."},
  {q:"What is 'pretexting'?",a:3,opts:["Sending emails with text before the payload","Using pre-written phishing templates","Attacking via pre-scheduled emails","Creating a fictional scenario to manipulate a victim (e.g., 'I'm the CEO's assistant')"],x:"Pretexting fabricates a convincing scenario to build trust before extracting sensitive information or actions."},
  {q:"A vendor emails a new invoice with different payment details than usual. You should:",a:1,opts:["Pay it — vendors update bank accounts","Call the vendor on their official registered phone number to verify","Email back to confirm","Check with your manager and pay if they approve"],x:"Invoice redirection fraud costs billions annually. Always call the vendor on a previously verified number — never use contact details from the suspicious email."},
  {q:"When is it safe to click 'unsubscribe' in an email?",a:2,opts:["Always — unsubscribing is harmless","Never — it confirms your email is active","Only for newsletters you legitimately subscribed to from known senders","Only if HTTPS"],x:"Clicking unsubscribe in spam can confirm your email is active, leading to more spam. Only use for legitimate newsletters you recognise."},
  {q:"What makes a phishing site 'convincing'?",a:0,opts:["Copied branding, logos, and layout from the legitimate site","Having HTTPS","Having many pages","Fast loading speed"],x:"Modern phishing kits clone websites pixel-perfectly. Visual appearance alone is NOT a reliable safety indicator."},
  {q:"Your colleague asks for your password to 'cover for you while you're on leave.' You should:",a:3,opts:["Share it — it's a trusted colleague","Share it encrypted","Share it if approved by your manager","Never share — use delegated access features instead"],x:"Password sharing violates security policy and creates accountability issues. Proper systems have delegation features for coverage."},
  {q:"What is a 'pig butchering' scam?",a:1,opts:["Phishing via butcher-themed websites","Long-term relationship-building fraud leading to fake investment platform scams","Rapidly draining a victim's bank account","Selling fake products online"],x:"'Pig butchering' involves building a romantic or friendly relationship over weeks, then introducing a fake crypto investment platform."},
  {q:"An email says 'Confirm your details or your tax refund will be rejected.' The sender is irs-refund@taxreturn.com. This is:",a:2,opts:["Legitimate — IRS emails tax refunds","Possibly real — check the refund amount","Phishing — IRS never emails to initiate contact; they use postal mail","Legitimate if you filed recently"],x:"The IRS initiates contact via postal mail only. Any unsolicited IRS email is phishing, regardless of how official it looks."},
  {q:"What is 'callback phishing' (telephone-oriented attack delivery)?",a:3,opts:["Phishing via recorded voicemails","Calling victims back after they respond to an ad","Phishing via call center workers","An email that tricks the victim into calling a fake support number, where an agent talks them into giving access"],x:"Callback phishing bypasses email security by getting victims to call attackers, who then guide them to install malware or give remote access."},
  {q:"A recruiter on LinkedIn sends a job offer with an unusually high salary and asks for your personal ID. This is likely:",a:0,opts:["A job scam — over-inflated salaries + ID request = fraud","A legitimate executive role","A background check requirement","Only suspicious if they ask for payment"],x:"Job scams harvest personal information for identity theft or fraud. Legitimate recruiters don't need ID before an interview."},
  {q:"What does 'zero-day phishing' exploit?",a:2,opts:["Accounts created on day zero","Sites registered that day","Newly discovered vulnerabilities before patches are available","First-day employees"],x:"Zero-day phishing leverages unpatched vulnerabilities. Users cannot rely on patching alone — behavioral vigilance is essential."},
  {q:"Multi-layered email security includes which combination?",a:3,opts:["Antivirus only","Spam filters + antivirus","SPF/DKIM/DMARC + spam filters","SPF/DKIM/DMARC + spam filters + user training + endpoint security"],x:"Effective email security uses multiple overlapping layers. No single control is sufficient — human vigilance remains critical."},
  {q:"What is the first thing you should check when you receive a suspicious email?",a:1,opts:["The subject line for keywords","The actual sender's email address (not just the display name)","Whether your name is mentioned","The number of recipients"],x:"The From address (the actual email, not the display name) is the most reliable first indicator — display names are spoofable."},
  {q:"A 'safe' looking domain has an internationalized domain name (IDN). Why might this be dangerous?",a:0,opts:["IDNs can use Unicode characters from other scripts that look identical to Latin letters","IDNs are always legitimate","IDNs are used only by government sites","IDNs bypass spam filters"],x:"IDN homograph attacks use characters from foreign scripts (e.g., Cyrillic) that are visually indistinguishable from Latin characters."},
  {q:"What is the safest response to any unexpected request for sensitive information?",a:3,opts:["Comply if the requester sounds authoritative","Comply if the channel (email/phone) looks official","Ask a colleague","Stop, verify the requester's identity through a separate known channel, then decide"],x:"The golden rule: always verify through a separate, trusted channel before complying with any sensitive request."},

  // Batch 2 — 76 additional questions to reach ~200
  {q:"What is 'smishing'?",a:2,opts:["Email phishing with images","Phishing via social media","Phishing via SMS text messages","Phishing via smart TVs"],x:"Smishing = SMS + phishing. Attackers send text messages with malicious links or pretexts."},
  {q:"A website certificate is issued to 'paypal.com-secure.xyz'. What does this tell you?",a:1,opts:["The site is legitimate — certificate proves it","The certificate is for 'paypal.com-secure.xyz', not paypal.com — it's a phishing site","The site is PayPal's secure subdomain","PayPal uses xyz TLD in some regions"],x:"A certificate only confirms the domain it was issued to. 'paypal.com-secure.xyz' is NOT paypal.com."},
  {q:"What is a 'man-in-the-middle' (MitM) attack?",a:0,opts:["An attacker intercepts communications between two parties","An employee leaking data internally","A denial of service attack","An attacker guessing passwords"],x:"MitM attacks intercept and potentially alter communications between you and the legitimate server."},
  {q:"Why are Monday mornings particularly high-risk for phishing?",a:2,opts:["Attackers work Monday-Friday","Email filters are weaker on Mondays","Employees are rushed and less vigilant returning from the weekend","More emails arrive on Mondays"],x:"People are distracted catching up after the weekend. Attackers time campaigns to exploit reduced alertness."},
  {q:"An email has an attachment called 'PO_12345.iso'. You should:",a:3,opts:["Open it — ISO files are safe","Scan and open","Ask the sender to resend as PDF","Delete it — ISO disk images are not legitimate business documents"],x:"ISO files can auto-mount and execute malware. They're used specifically to bypass email security filters."},
  {q:"'Consent phishing' tricks you into:",a:1,opts:["Clicking a fake login page","Granting an OAuth app malicious permissions to your account","Approving a fake certificate","Paying a fake invoice"],x:"Consent phishing uses legitimate OAuth flows to grant attacker apps persistent access to your accounts without stealing your password."},
  {q:"A phone app asks for SMS permission when it only needs to show recipes. This is:",a:0,opts:["Suspicious — SMS access could intercept OTP codes","Normal — apps need broad permissions","Fine if the app is well-rated","Fine if it's in the official app store"],x:"Unnecessary permissions are a red flag. SMS access lets malicious apps intercept 2FA codes and steal accounts."},
  {q:"What does 'HTTPS everywhere' mean as a security practice?",a:2,opts:["Only visiting HTTPS sites guarantees safety","Using HTTP for all internal sites","Ensuring all connections use HTTPS to prevent eavesdropping","Using a VPN on all HTTPS sites"],x:"HTTPS everywhere ensures traffic is encrypted in transit, preventing eavesdropping — but it doesn't guarantee site legitimacy."},
  {q:"A free Wi-Fi network is named 'Airport_Free_WiFi'. The real airport Wi-Fi is 'LGA_Guest'. The fake network is a:",a:3,opts:["Honeypot","DNS attack","Rogue access point","Evil twin attack"],x:"Evil twin attacks create a Wi-Fi network mimicking a legitimate one. Connecting routes your traffic through the attacker."},
  {q:"An email with only an image and no text content should raise suspicion because:",a:1,opts:["Images slow down email loading","Text-based spam filters can't scan images — it's a filter evasion technique","Images use more bandwidth","Only HTML emails are secure"],x:"Image-only emails bypass text-based spam filters. The phishing content is hidden inside the image."},
  {q:"What is 'session hijacking'?",a:0,opts:["Stealing an authenticated session cookie to impersonate a logged-in user","Physically stealing a user's computer","Guessing login credentials","Intercepting SMS verification codes"],x:"Session cookies authenticate your ongoing session. If stolen, an attacker can act as you without needing your password."},
  {q:"You get a Google Calendar invite for a meeting with a link. The link goes to 'zoom.us.meet-now.click'. This is:",a:2,opts:["A legitimate Zoom link","Safe — Google Calendar filters spam","Phishing — real Zoom links are on zoom.us only","Safe if the meeting organiser is known"],x:"Real Zoom links use zoom.us. Anything like 'zoom.us.meet-now.click' puts you on 'meet-now.click', not Zoom."},
  {q:"What is 'OSINT' and how does it help attackers?",a:3,opts:["Open Security Intelligence — a defensive framework","An anti-phishing protocol","An email authentication standard","Open Source Intelligence — public info (LinkedIn, social media) used to personalise phishing attacks"],x:"Attackers research targets using publicly available info to craft convincing spear phishing messages."},
  {q:"A trusted colleague's email suddenly has unusual formatting, odd phrasing, and asks for gift cards. Most likely:",a:1,opts:["Colleague typed quickly","Colleague's account has been compromised and is being used to phish you","It's an automated email","Colleague is working from a new device"],x:"Account compromise followed by targeting colleagues is extremely common. Always verify unusual requests via a separate channel."},
  {q:"'Lookalike domains' are designed to:",a:0,opts:["Appear visually identical to legitimate domains to deceive users","Speed up DNS resolution","Provide backup domains for legitimate sites","Serve as CDN mirrors"],x:"Lookalike domains exploit the fact that people read URLs quickly. One changed character is easy to miss."},
  {q:"What risk comes with scanning a QR code on a physical poster in public?",a:2,opts:["No risk — QR codes are just images","Low risk — QR codes can't contain malware","The poster may have been replaced or overlaid with a malicious QR code","High risk only if using Android"],x:"Physical QR code attacks ('QRishing') place malicious codes over legitimate ones in public spaces, redirecting to phishing sites."},
  {q:"An auto-reply from a colleague's email reveals their vacation dates, manager name, and emergency contact. This information could be used for:",a:3,opts:["Nothing — out-of-office messages are harmless","Calendar phishing only","Timing delivery attacks","Spear phishing — personal details make attacks more convincing"],x:"Out-of-office information provides attackers with organisational details and timing windows to exploit."},
  {q:"Which statement about phishing emails is TRUE?",a:1,opts:["They always have bad spelling and grammar","They can be perfectly written and visually identical to legitimate emails","They always come from unknown senders","They are always caught by spam filters"],x:"Modern phishing is highly sophisticated — perfect branding, grammar, and personalisation. Never rely on visual quality alone."},
  {q:"What is 'SIM swapping'?",a:0,opts:["Convincing a carrier to transfer your phone number to an attacker's SIM, intercepting SMS 2FA","Swapping SIM cards between phones","A network carrier upgrade process","Installing spyware via SIM card"],x:"SIM swapping lets attackers receive your SMS 2FA codes, bypassing phone-based authentication completely."},
  {q:"The principle of 'zero trust' in security means:",a:2,opts:["Trust no external vendors","Block all external emails by default","Never trust, always verify — even internal users and devices must be authenticated","Only administrators get network access"],x:"Zero trust assumes breach and requires continuous verification of every user and device, internal or external."},
  {q:"An attacker registers 'cornpany.com' (rn → m lookalike). This is:",a:3,opts:["A typosquat","An IDN homograph","A leet substitution","A combosquat using character pair substitution (rn looks like m)"],x:"'rn' side by side looks like 'm' in most fonts. Combosquatting exploits kerning and font rendering to deceive."},
  {q:"You receive a DocuSign email but the document is from someone you've never worked with. You should:",a:1,opts:["Sign it — DocuSign is secure","Do not sign — contact the supposed sender via official channels to verify","Sign if the document looks legitimate","Sign only after reading it carefully"],x:"Attackers send fake DocuSign requests hoping recipients will sign without verifying. Always confirm unexpected signature requests."},
  {q:"An email has your correct home address in it. This makes it:",a:0,opts:["More dangerous — data from prior breaches enables targeted attacks","Legitimate — only real companies know your address","Less suspicious — personalised emails are usually real","Irrelevant to its legitimacy"],x:"Personal data from breaches is sold on dark web markets and used to personalise phishing, making it more convincing."},
  {q:"What is 'thread hijacking' in phishing?",a:2,opts:["Hacking into Slack threads","Intercepting email in transit","Replying to a real email thread with malicious content to appear as a continuation","Creating fake email threads from scratch"],x:"Thread hijacking inserts a phishing message into an existing legitimate email conversation, lending it credibility."},
  {q:"A company-wide email asks all staff to update HR details via a link. Before clicking, you should:",a:3,opts:["Click — it's company-wide so it's safe","Click if HTTPS","Ask a colleague","Verify with IT or HR via a separate, known communication channel that the request is genuine"],x:"Mass internal phishing campaigns target everyone at once. Always verify sensitive requests through official channels."},
  {q:"What is 'typosquatting' designed to catch?",a:1,opts:["Users who click phishing links","Users who mistype popular domain names in their browser","Users who ignore certificate warnings","Users who reuse passwords"],x:"Typosquatters register misspellings of popular sites (e.g., 'gooogle.com') and catch users who hit the wrong key."},
  {q:"You receive an email with a PDF that asks you to click a link inside the PDF. This tactic:",a:0,opts:["Uses PDF as a redirect container to bypass email URL scanning","Is normal — PDFs often contain links","Is only risky if the PDF is .pdff","Is safe if the PDF was scanned"],x:"Embedding links inside PDFs bypasses email security tools that scan only direct URL links in email body text."},
  {q:"What does a 'homoglyph attack' specifically exploit?",a:2,opts:["Font colour rendering","Browser URL bar length limits","Visual similarity between Unicode characters from different scripts","Slow DNS resolution"],x:"Homoglyph attacks use characters like Cyrillic 'а' which is pixel-identical to Latin 'a' but is a different character."},
  {q:"An email urges you to act 'before midnight tonight or lose access forever.' This is:",a:3,opts:["Reasonable — some offers expire","Suspicious if the amount involved is large","Suspicious if from an unknown sender","Classic artificial urgency — a core social engineering manipulation tactic"],x:"Manufactured deadlines bypass rational thinking. Legitimate services do not threaten instant permanent loss."},
  {q:"Which of these is NOT a sign of phishing?",a:1,opts:["Mismatched sender and Reply-To","Email from a known colleague's verified corporate address with expected content","Generic greeting","Suspicious URL on hover"],x:"An email from a verified corporate address with expected content and no suspicious links is not a phishing indicator."},
  {q:"What is 'dumpster diving' in a security context?",a:0,opts:["Searching physical trash for documents with sensitive information","Attacking databases via SQL injection","Overwhelming servers with traffic","A type of email spoofing"],x:"Physical dumpster diving retrieves discarded documents — invoices, org charts, contracts — used to personalise social engineering."},
  {q:"Why should you use a unique email address for each service?",a:2,opts:["Email providers require it","It makes logging in easier","A breach at one service doesn't expose your email address on others, reducing targeted spam and phishing","It improves email security scores"],x:"Unique email aliases limit the blast radius of any single breach and prevent email address harvesting across services."},
  {q:"A recruiter asks you to complete a 'skills assessment' by downloading a file from a link. You should:",a:3,opts:["Download it — assessments are normal","Download if the recruiter seems legitimate","Download if the file is a .docx","Verify the recruitment firm independently before downloading anything"],x:"Job recruitment phishing delivers malware via fake assessments. Verify the company exists through independent searches before downloading."},
  {q:"What is 'island hopping' in cyber attacks?",a:1,opts:["Attacks targeting island nations","Compromising a smaller partner/vendor to gain access to a larger target organisation","Rotating attack servers across countries","Using VPNs in multiple countries"],x:"Island hopping uses the supply chain — attackers compromise a smaller, less-defended vendor to reach their real high-value target."},
  {q:"An email from HR contains a hyperlink that displays 'click here' with no URL visible. You should:",a:0,opts:["Hover over it to see the actual URL before clicking","Click it — HR emails are trusted","Click it if the email passed spam filters","Ask HR to resend with the full URL in the text"],x:"'Click here' links always hide the real URL. Hovering before clicking is essential — display text tells you nothing."},
  {q:"A colleague says they got an unusual email from you that you didn't send. This likely means:",a:2,opts:["An email glitch occurred","A newsletter used your name","Your email account may be compromised — change your password and alert IT immediately","Someone typed the wrong address"],x:"Emails sent in your name without your knowledge indicate account compromise. Act immediately before the attacker does more damage."},
  {q:"What is the best way to verify a suspicious bank email is real?",a:3,opts:["Check if it has the bank's logo","Check if the link is HTTPS","Reply to the email asking for confirmation","Call the bank using the number on your card or official website — not from the email"],x:"Always verify via a separately confirmed contact method. The email itself could be entirely fake."},
  {q:"An attacker sends a phishing email appearing to come from your organisation's IT department. This is called:",a:1,opts:["External phishing","Internal impersonation phishing","Watering hole attack","Pretexting only"],x:"Impersonating internal IT is extremely effective — employees are conditioned to follow IT instructions and trust internal senders."},
  {q:"What makes FIDO2 hardware keys more phishing-resistant than TOTP apps?",a:0,opts:["They cryptographically verify the site domain — they won't authenticate on a phishing site","They generate longer codes","They don't require internet connection","They are harder to steal physically"],x:"FIDO2 keys verify they're talking to the genuine domain. Even if you try to use one on a phishing site, authentication will fail."},
  {q:"What should your email's spam folder never be used for?",a:2,opts:["Reviewing important emails","Storing emails","Blindly clicking links to 'unsubscribe' from unknown senders","Deleting old emails"],x:"Spam folder emails are flagged as suspicious. Never click links inside — especially 'unsubscribe' links from unknown senders."},
  {q:"A phishing email impersonates a charity after a major disaster. What should you do?",a:3,opts:["Donate via the email link if the cause is real","Donate a small amount to test the link","Forward to friends — the cause is good","Find the charity's official website independently and donate there"],x:"Disaster charity phishing is extremely common after major events. Always find charities independently, never via email links."},
  {q:"An email from 'no-reply@yourcompany.com.phish.net' appears to be internal. The real domain is:",a:1,opts:["yourcompany.com","phish.net — everything before is a subdomain lure","no-reply.com","yourcompany.com.phish.net"],x:"The actual sending domain is 'phish.net'. 'yourcompany.com' is just a subdomain label, not the real company's domain."},
  {q:"What is a 'malvertisement'?",a:0,opts:["A malicious ad on a legitimate website that can install malware without clicking","A spam email disguised as an advertisement","A fake online store","A pop-up demanding payment"],x:"Malvertising injects malicious ads into legitimate ad networks. Simply loading the page can trigger drive-by downloads."},
  {q:"A PDF invoice arrives from a known vendor. Before paying, you should check:",a:2,opts:["That the PDF has no viruses","That the PDF looks the same as previous ones","That the bank details match what you have on file for that vendor — and verify by phone if changed","That the invoice number is sequential"],x:"PDF invoice fraud modifies bank account details. Always verify changed banking information by calling a previously confirmed number."},
  {q:"Why is enabling macros on an Office document from email dangerous?",a:3,opts:["Macros slow down your computer","Macros can change document formatting","Office macros are deprecated","Macros can execute arbitrary code, install malware, or exfiltrate data silently"],x:"Office macros are essentially mini-programs. Enabling them in an unexpected document is one of the most common initial access techniques."},
  {q:"'Lookalike email' attacks use which primary technique?",a:1,opts:["Email header manipulation","Registering domains visually similar to legitimate brands and sending from them","Hacking the legitimate email server","Injecting content into legitimate emails"],x:"Lookalike email attacks use purpose-registered lookalike domains to send emails that appear to be from trusted senders."},
  {q:"What is 'formjacking'?",a:0,opts:["Injecting malicious code into a website's payment form to steal card details","Creating fake online forms to harvest credentials","Submitting forms repeatedly to crash servers","Using browser developer tools to view form data"],x:"Formjacking injects JavaScript into legitimate checkout pages to silently steal payment card data as you type."},
  {q:"You receive a security notification from your bank via push notification (official app). Compared to SMS, push notifications are:",a:2,opts:["Less secure — apps can be spoofed","Equally secure","More phishing-resistant — they're tied to the app which verifies the domain","Only secure on iOS"],x:"Official app push notifications originate from the verified app, making them harder to spoof than SMS which can be intercepted."},
  {q:"What is 'business process compromise' (BPC)?",a:3,opts:["Hacking a business's network","Compromising business email accounts","Ransomware on business systems","Manipulating legitimate business processes (e.g., payment workflows) without hacking — using social engineering"],x:"BPC manipulates people inside legitimate processes rather than hacking systems — extremely hard to detect because no security alert fires."},
  {q:"An email says 'We've updated our privacy policy — click to accept or your account will close.' This is:",a:1,opts:["Legitimate — GDPR requires consent","A phishing lure — real policy updates don't require clicking email links to avoid account closure","Worth clicking to stay compliant","Suspicious only if personal data is requested"],x:"Legitimate privacy policy updates don't close your account for not clicking an email link. This is a credential-harvesting lure."},
  {q:"What is the 'foot-in-the-door' technique in social engineering?",a:0,opts:["Making a small request first to build compliance before making a larger demand","Physically gaining entry to a building","Creating a sense of urgency","Impersonating authority figures"],x:"Small initial requests build trust and compliance, making targets more likely to agree to larger, riskier requests later."},
  {q:"Why are executives high-value phishing targets?",a:2,opts:["They check email more often","They are less tech-savvy","They have authority to approve large financial transactions and access to sensitive data","They have simpler passwords"],x:"Executives can authorise wire transfers, access confidential data, and override security controls — making them prime targets."},
  {q:"What is a 'logic bomb' in the context of insider threats?",a:3,opts:["A bomb made of logical fallacies","An email that triggers anger","An explosive device disguised as a server","Malicious code that activates under specific conditions, planted by a malicious insider"],x:"Logic bombs are dormant code that activates on a trigger (date, event). They can be planted by insiders with system access."},
  {q:"You receive a Google Docs sharing notification. Before clicking, you should verify:",a:1,opts:["That Google's logo appears in the email","The sender's email address and whether you expected a document from them","That the document title sounds legitimate","That the email wasn't in spam"],x:"Fake Google Docs sharing notifications are a top credential-harvesting technique. Verify the sender independently before clicking."},
  {q:"What is 'pretexting'?",a:0,opts:["Fabricating a scenario to manipulate someone into giving information or access","Sending phishing emails with false context","Creating fake websites","Using social media to gather target information"],x:"Pretexting builds a convincing fictional context — 'I'm the CEO's PA' or 'I'm from IT' — to gain trust before the attack."},
  {q:"Which action provides the most protection against all forms of phishing?",a:3,opts:["Installing premium antivirus","Using a VPN at all times","Only checking email on a work device","Skeptical verification of every unexpected request, regardless of apparent source or urgency"],x:"No technology fully prevents phishing. The most effective control is a skeptical, trained human who verifies before acting."},
  {q:"A website's domain was registered 2 days ago but uses a major bank's branding. Risk level?",a:2,opts:["Low — new sites are normal","Medium — check further","Extremely high — new domain + brand impersonation = almost certainly phishing","Low if HTTPS is present"],x:"Phishing domains are freshly registered to avoid blocklists. A bank wouldn't launch customer-facing services on a 2-day-old domain."},
  {q:"'Shoulder surfing' is:",a:1,opts:["A network interception technique","Physically observing someone enter credentials or sensitive information","A type of spear phishing","Calling from a spoofed number"],x:"Shoulder surfing is a physical attack — watching someone type passwords, PINs, or view sensitive data in public spaces."},
  {q:"What is 'credential exposure' and why does it matter for phishing?",a:0,opts:["Your credentials appearing in a data breach, enabling targeted phishing with your real details","Storing passwords in plaintext","Writing passwords on paper","Using the same password twice"],x:"Breached credentials confirm email addresses are active and reveal patterns, enabling highly personalised phishing attacks."},
  {q:"An email from IT asks you to 'test a new MFA system' by sharing your current 6-digit code. You should:",a:3,opts:["Share it — IT manages MFA","Share only the first 3 digits","Ask a colleague if they received the same email","Refuse — MFA codes should never be shared with anyone for any reason"],x:"A real MFA upgrade never requires sharing your current codes. This is a social engineering attack to bypass your 2FA."},
  {q:"Which of these makes a phishing simulation most effective for training?",a:2,opts:["Punishing employees who click","Only targeting junior staff","Immediate training feedback when someone clicks — not punishment","Using real phishing emails"],x:"The goal of phishing simulation is learning, not punishment. Immediate, constructive feedback when someone clicks maximises training value."},
  {q:"What is 'multi-stage phishing'?",a:1,opts:["A phishing attack sent in multiple emails","A phishing attack where the first stage (e.g., a benign link) grooms trust before the real attack","Sending phishing emails at multiple times of day","Phishing via multiple channels simultaneously"],x:"Multi-stage attacks build trust over time — first interaction is innocuous, later stages deploy the real payload when suspicion is low."},
  {q:"A 'callback phishing' email typically contains:",a:0,opts:["A phone number to call rather than a link, where a fake agent harvests credentials or installs malware","A PDF with a macro","An executable disguised as a PDF","A spoofed sender domain only"],x:"Callback phishing bypasses URL scanners entirely — the email just contains a phone number. The real attack happens over the phone call."},
  {q:"Why is 'security theatre' dangerous?",a:2,opts:["It makes employees complacent with real security","It wastes budget","It creates false confidence in inadequate security measures, reducing actual vigilance","It only applies to physical security"],x:"Security theatre looks impressive but provides little real protection — and worse, it makes people feel safe when they shouldn't be."},
  {q:"Your organisation uses email banners like '[EXTERNAL]' on outside emails. This helps because:",a:3,opts:["It blocks all phishing emails","It encrypts external emails","It satisfies compliance requirements only","It flags emails from outside the organisation, prompting extra scrutiny for unexpected requests"],x:"External email banners remind users to apply extra caution, particularly for unexpected requests from apparent internal addresses."},
  {q:"A phishing email claims your 'cloud storage is 99% full — upgrade now.' What's the risk?",a:1,opts:["None — cloud providers do send these","Credential harvesting — clicking leads to a fake login page for your cloud provider","Only a risk if you have sensitive files","Only a risk if you click the upgrade button"],x:"This lure mimics Google Drive or OneDrive alerts to steal your account credentials on a convincing fake login page."},
  {q:"What does 'defense in depth' mean for anti-phishing?",a:0,opts:["Using multiple overlapping security controls so no single failure is catastrophic","Installing the deepest possible firewall rules","Only allowing email from verified domains","Encrypting all emails end-to-end"],x:"Defense in depth layers email filters, endpoint security, user training, and monitoring — so if one layer fails, others still protect."},
  {q:"You receive a Microsoft Teams notification to join a meeting with a link to 'teams.microsoft.com.meet.click'. Real domain is:",a:2,opts:["teams.microsoft.com","microsoft.com","meet.click — everything before is a subdomain lure","teams.microsoft.com.meet"],x:"'meet.click' is the real domain. Real Teams links always live on teams.microsoft.com or microsoftteams.com."},
  {q:"What is a 'watering hole' attack?",a:3,opts:["Flooding a victim with emails","Attacking via fake water utility companies","A brute force attack on login pages","Compromising websites frequently visited by the target group to infect them passively"],x:"Watering hole attacks eliminate the need to get victims to click a phishing link — just visit a compromised trusted site."},
  {q:"A domain uses 'ì' (i with grave accent) instead of 'i'. Without zooming in, you:",a:1,opts:["Would easily spot the difference","Would likely not notice — IDN homoglyph attacks are visually undetectable at normal zoom","Would see a certificate warning","Would be blocked by your browser"],x:"Browsers and humans struggle to distinguish homoglyphs at normal size. Most people will not spot the substitution."},
  {q:"What is the most secure way to access your bank online?",a:0,opts:["Type the URL directly into your browser or use a saved bookmark — never via email links","Click the link in their email newsletter","Use a search engine and click the first result","Follow a link from a trusted website"],x:"Type or bookmark bank URLs directly. Search results and email links can be poisoned. The browser address bar is your last line of defence."},
];

function AwarenessQuiz(){
  const QUIZ_SIZE=10;
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const newSession=()=>shuffle(QUIZ_BANK).slice(0,QUIZ_SIZE);
  const[qi,setQi]=useState(0),[qs,setQs]=useState(0),[pick,setPick]=useState(null),[done,setDone]=useState(false),[results,setResults]=useState([]),[session,setSession]=useState(()=>newSession());
  const reset=()=>{setSession(newSession());setQi(0);setQs(0);setPick(null);setDone(false);setResults([]);};
  const btn2=btnStyle;
  if(done){
    const pct=Math.round((qs/session.length)*100);
    const susc=100-pct;
    const{sc:suscColor,label:suscLabel,desc:suscDesc,icon:suscIcon,advice:suscAdvice}=
      susc<=20?{sc:"#00ff88",label:"Very Low Risk",desc:"Excellent — you correctly identified nearly all phishing tactics tested.",icon:"🛡️",advice:"Share your knowledge with colleagues. Consider taking advanced threat analysis training."}:
      susc<=40?{sc:"#66ffaa",label:"Low Risk",desc:"Good awareness overall. A few techniques still slipped past you.",icon:"✅",advice:"Review the questions you missed and revisit those specific attack patterns."}:
      susc<=60?{sc:"#ffcc00",label:"Moderate Risk",desc:"You have some awareness but would likely fall for targeted phishing attacks.",icon:"⚠️",advice:"Pay closer attention to sender domains, urgency language, and unexpected attachments or links."}:
      susc<=80?{sc:"#ff8800",label:"High Risk",desc:"Several common phishing techniques would likely succeed against you.",icon:"🚨",advice:"Never click email links for sensitive accounts. Always navigate directly to official websites. When in doubt — don't click."}:
      {sc:"#ff3355",label:"Very High Risk",desc:"You are highly susceptible to phishing. Most real-world attacks would likely succeed.",icon:"🔴",advice:"Stop clicking links in emails. Always type URLs manually. Enable multi-factor authentication on all accounts immediately."};
    return <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{textAlign:"center",padding:"24px 0 16px"}}>
        <div style={{fontFamily:SYNE,fontSize:72,fontWeight:900,color:qs>=Math.ceil(session.length*.75)?"#00ff88":qs>=Math.ceil(session.length*.5)?"#ffcc00":"#ff3355",lineHeight:1}}>{qs}<span style={{fontSize:28,color:"#334"}}>/{session.length}</span></div>
        <div style={{fontFamily:SYNE,fontSize:14,fontWeight:700,color:"#556",letterSpacing:3,marginTop:4}}>{qs>=Math.ceil(session.length*.75)?"EXPERT AWARENESS 🏆":qs>=Math.ceil(session.length*.5)?"SOLID — KEEP PRACTICING 🎯":"HIGH RISK — REVIEW TACTICS ⚠"}</div>
      </div>

      {/* Susceptibility meter */}
      <div style={{background:"#0a0a1a",border:`2px solid ${suscColor}44`,borderRadius:14,padding:24,margin:"8px 0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontFamily:SYNE,fontWeight:900,fontSize:13,color:"#445",letterSpacing:3,marginBottom:4}}>PHISHING SUSCEPTIBILITY</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:28}}>{suscIcon}</span>
              <span style={{fontFamily:SYNE,fontWeight:900,fontSize:22,color:suscColor}}>{suscLabel}</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:SYNE,fontSize:52,fontWeight:900,color:suscColor,lineHeight:1}}>{susc}<span style={{fontSize:20,color:"#445"}}>%</span></div>
            <div style={{fontSize:10,color:"#445",letterSpacing:2}}>SUSCEPTIBLE</div>
          </div>
        </div>

        {/* Gauge bar */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#445",letterSpacing:2,marginBottom:6}}>
            <span>NOT SUSCEPTIBLE</span><span>HIGHLY SUSCEPTIBLE</span>
          </div>
          <div style={{height:10,borderRadius:5,background:"#0d0d1e",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#00ff88,#66ffaa,#ffcc00,#ff8800,#ff3355)",borderRadius:5,opacity:.3}}/>
            <div style={{position:"relative",height:"100%",width:`${susc}%`,background:`linear-gradient(90deg,#00ff88,${suscColor})`,borderRadius:5,transition:"width 1.2s cubic-bezier(.22,1,.36,1)",boxShadow:`0 0 10px ${suscColor}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#334",marginTop:4}}>
            {[0,25,50,75,100].map(n=><span key={n}>{n}%</span>)}
          </div>
        </div>

        <div style={{fontSize:13,color:"#8899bb",lineHeight:1.7,marginBottom:12}}>{suscDesc}</div>
        <div style={{padding:"10px 14px",background:`${suscColor}0d`,border:`1px solid ${suscColor}33`,borderRadius:8,fontSize:12,color:suscColor,lineHeight:1.7}}>
          💡 <strong>Recommendation:</strong> {suscAdvice}
        </div>
      </div>

      {/* Per-question breakdown */}
      <div style={{background:"#0a0a1a",border:"1px solid #1a1a30",borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontFamily:SYNE,fontWeight:700,fontSize:10,letterSpacing:4,color:"#445",marginBottom:12}}>QUESTION BREAKDOWN</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
          {session.map((_,i)=>(
            <div key={i} style={{width:44,height:44,borderRadius:"50%",background:results[i]===true?"rgba(0,255,136,.1)":results[i]===false?"rgba(255,51,85,.07)":"rgba(102,119,170,.08)",border:`2px solid ${results[i]===true?"#00ff88":results[i]===false?"#ff335533":"#4455aa33"}`,display:"flex",alignItems:"center",justifyContent:"center",color:results[i]===true?"#00ff88":results[i]===false?"#ff335566":"#6677aa",fontSize:16,fontWeight:900}}>
              {results[i]===true?"✓":results[i]===false?"✕":"•"}
            </div>
          ))}
        </div>
      </div>

      <div style={{textAlign:"center"}}><button style={{...btn2("#6644ff"),padding:"13px 36px"}} onClick={reset}>RETAKE QUIZ</button></div>
    </div>;
  }
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <Label>Phishing Awareness Training</Label>
      <span style={{fontSize:11,color:"#445",letterSpacing:2}}>Q{qi+1}/{session.length} · SCORE: <span style={{color:"#00ff88"}}>{qs}</span></span>
    </div>
    <Card>
      <div style={{height:3,background:"#0d0d1e",borderRadius:2,marginBottom:22,overflow:"hidden"}}><div style={{width:`${(qi/session.length)*100}%`,height:"100%",background:"linear-gradient(90deg,#ff3355,#ff9900)",transition:"width .5s ease",borderRadius:2}}/></div>
      <div style={{fontFamily:SYNE,fontWeight:700,fontSize:16,color:"#dde",lineHeight:1.6,marginBottom:22}}>{session[qi].q}</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {session[qi].opts.map((opt,i)=>{
          const chosen=pick!==null,correct=i===session[qi].a,wrong=i===pick&&!correct;
          return <button key={i} onClick={()=>{if(pick!==null)return;const correct=i===session[qi].a;setPick(i);setResults(r=>[...r,correct]);if(correct)setQs(s=>s+1);}}
            style={{background:!chosen?"#0d0d1e":correct?"rgba(0,255,136,.07)":wrong?"rgba(255,51,85,.07)":"#0d0d1e",border:`1px solid ${!chosen?"#1a1a30":correct?"#00ff88":wrong?"#ff3355":"#1a1a30"}`,borderRadius:7,padding:"13px 16px",color:!chosen?"#778899":correct?"#00ff88":wrong?"#ff6677":"#778899",fontFamily:MONO,fontSize:12,textAlign:"left",cursor:pick===null?"pointer":"default",display:"flex",gap:11,alignItems:"center",transition:"all .2s"}}>
            <span style={{fontFamily:SYNE,fontWeight:800,flexShrink:0,width:18}}>{String.fromCharCode(65+i)}</span>{opt}
            {chosen&&correct&&<span style={{marginLeft:"auto"}}>✓</span>}
            {chosen&&wrong&&<span style={{marginLeft:"auto"}}>✕</span>}
          </button>;
        })}
      </div>
      {pick!==null&&<div style={{marginTop:18,padding:"13px 16px",background:"rgba(102,68,255,.06)",border:"1px solid rgba(102,68,255,.2)",borderRadius:7,fontSize:12,color:"#9999dd",lineHeight:1.7,animation:"fadeIn .3s ease"}}>
        💡 {session[qi].x}
        <div style={{marginTop:12,textAlign:"right"}}><button style={btnStyle("#6644ff")} onClick={()=>qi+1>=session.length?setDone(true):(setQi(q=>q+1),setPick(null))}>{qi+1>=session.length?"SEE RESULTS →":"NEXT →"}</button></div>
      </div>}
    </Card>
  </div>;
}

// ── Sub-panels used in URL Scanner ───────────────────────────────────────────
function ScreenshotPanel({url,risk}){
  const[st,setSt]=useState("loading");let safe;try{safe=new URL(url.startsWith("http")?url:"https://"+url);}catch{return null;}
  return <Card style={{marginTop:16}}><Label>Site Preview</Label>
    <div style={{position:"relative",borderRadius:8,overflow:"hidden",border:"1px solid #1e2240",background:"#060610"}}>
      {st==="loading"&&<div style={{height:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}><Spinner color="#ff3355" size={32}/><span style={{fontSize:11,color:"#445",letterSpacing:3}}>LOADING PREVIEW...</span></div>}
      <iframe src={`https://thumbnail.ws/api/thumbnail/plain/get?key=16a97ec7be8a8b5765cdfb59f3b70d76de6bc5e9ff26&url=${encodeURIComponent(safe.href)}&width=640`} style={{width:"100%",height:220,border:"none",display:st==="ok"?"block":"none",opacity:.85}} onLoad={()=>setSt("ok")} onError={()=>setSt("err")} sandbox="allow-scripts allow-same-origin" title="Preview"/>
      {st==="err"&&<div style={{padding:"28px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><img src={`https://www.google.com/s2/favicons?sz=128&domain=${safe.hostname}`} style={{width:48,height:48,borderRadius:8}} alt="" onError={e=>e.target.style.display="none"}/><div style={{fontSize:12,color:"#445",letterSpacing:2}}>PREVIEW UNAVAILABLE</div><a href={safe.href} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#ff3355",textDecoration:"none",border:"1px solid #ff335533",padding:"6px 14px",borderRadius:4}}>⚠ OPEN IN NEW TAB (RISKY)</a></div>}
      {risk==="DANGER"&&st==="ok"&&<div style={{position:"absolute",inset:0,background:"rgba(255,51,85,.08)",border:"2px solid #ff335566",pointerEvents:"none",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:8}}><span style={{background:"#ff3355",color:"#fff",fontSize:10,fontFamily:MONO,padding:"3px 8px",borderRadius:3,letterSpacing:2}}>DANGER SITE</span></div>}
    </div>
    <div style={{marginTop:10,fontSize:11,color:"#445"}}>🔗 <span style={{color:"#667799"}}>{safe.href}</span></div>
  </Card>;
}

function DNSGeoPanel({domain}){
  const{dark}=useTheme();
  const[tab,setTab]=useState("geo"),[ready,setReady]=useState(false);
  const geo=fakeGeo(domain),dns=fakeDNS(domain);
  useEffect(()=>{setReady(false);const t=setTimeout(()=>setReady(true),600);return()=>clearTimeout(t);},[domain]);
  if(!ready)return <Card style={{marginTop:16}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}><Spinner color="#6644ff" size={16}/><span style={{fontSize:11,color:"#445",letterSpacing:3}}>RESOLVING DNS & GEOIP...</span></div></Card>;
  const geoRows=[["🌐","IP",geo.ip],["📍","Country",`${geo.flag} ${geo.country}`],["🏙","City",geo.city],["🖧","ISP",geo.isp],["🔢","ASN",geo.asn],["📋","Registrar",geo.registrar],["📅","Age",`${geo.age}yr${geo.age!==1?"s":""}${geo.newDomain?" ⚠":""}`,geo.newDomain],["🗓","Created",geo.created]];
  return <Card style={{marginTop:16}}>
    <div style={{display:"flex",marginBottom:18,borderBottom:"1px solid #1a1a30"}}>{["geo","dns"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"7px 20px",background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#6644ff":"transparent"}`,color:tab===t?"#9977ff":"#445",fontFamily:SYNE,fontWeight:700,fontSize:11,letterSpacing:3,cursor:"pointer",textTransform:"uppercase"}}>{t==="geo"?"GeoIP":"DNS"}</button>)}</div>
    {tab==="geo"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{geoRows.map(([icon,lbl,val,warn],i)=><div key={i} style={{background:dark?"#0d0d1e":"#f8f9ff",border:`1px solid ${warn?"#ffcc0033":"#1a1a30"}`,borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:10,color:"#445",letterSpacing:2,marginBottom:4}}>{icon} {lbl}</div><div style={{fontFamily:MONO,fontSize:12,color:warn?"#ffcc00":"#8899cc"}}>{val}</div></div>)}</div>{geo.newDomain&&<Flag f="Domain <2 years old — commonly used in phishing campaigns" color="#ffcc00"/>}</> }
    {tab==="dns"&&<table style={{width:"100%",borderCollapse:"collapse",fontFamily:MONO,fontSize:11}}><thead><tr style={{borderBottom:"1px solid #1a1a30"}}>{["Type","Value","TTL"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#445",fontSize:9,letterSpacing:2,fontWeight:400}}>{h}</th>)}</tr></thead><tbody>{dns.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #0f0f1e"}}><td style={{padding:"7px 10px"}}><Tag color={r.type==="A"?"#6699ff":r.type==="MX"?"#ff9900":r.type==="NS"?"#00ff88":"#aa88ff"}>{r.type}</Tag></td><td style={{padding:"7px 10px",color:"#7788aa",wordBreak:"break-all"}}>{r.value}</td><td style={{padding:"7px 10px",color:"#445"}}>{r.ttl}s</td></tr>)}</tbody></table>}
  </Card>;
}

function BreachPanel({domain}){
  const{dark}=useTheme();
  const[ready,setReady]=useState(false),[input,setInput]=useState(""),[result,setResult]=useState(null);
  useEffect(()=>{setReady(false);const t=setTimeout(()=>setReady(true),800);return()=>clearTimeout(t);},[domain]);
  const check=()=>{if(!input.trim())return;const h=hashStr(input),keys=Object.keys(BREACHES);const hits=[...new Set([0,1,2].map(i=>keys[(h+i*7)%keys.length]))].map(k=>({domain:k,...BREACHES[k]}));setResult({hits,pwned:hits.length>0});};
  const domHits=Object.entries(BREACHES).filter(([d])=>domain?.endsWith(d));
  if(!ready)return <Card style={{marginTop:16}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}><Spinner color="#ff3355" size={16}/><span style={{fontSize:11,color:"#445",letterSpacing:3}}>SCANNING BREACH DATABASE...</span></div></Card>;
  return <Card style={{marginTop:16}}><Label>Dark Web Breach Intelligence</Label>
    {domHits.length>0&&<div style={{marginBottom:16}}>{domHits.map(([d,b],i)=><div key={i} style={{background:"rgba(255,51,85,.06)",border:"1px solid #ff335533",borderRadius:6,padding:"10px 14px",marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:MONO,color:"#ff8899",fontSize:13}}>{d}</span><Tag color="#ff3355">{b.y}</Tag></div><div style={{fontSize:11,color:"#667",marginTop:4}}>Records: <span style={{color:"#ffcc00"}}>{b.n}</span> · {b.d}</div></div>)}</div>}
    <div style={{background:dark?"#0d0d1e":"#f8f9ff",border:"1px solid #1a1a30",borderRadius:8,padding:16}}>
      <div style={{fontSize:11,color:"#556",marginBottom:10,letterSpacing:1}}>CHECK EMAIL IN BREACH DATABASES</div>
      <div style={{display:"flex",gap:8}}><input style={{flex:1,background:dark?"#080814":"#fff",border:"1px solid #1e2240",borderRadius:6,padding:"9px 12px",fontFamily:MONO,fontSize:12,color:dark?"#c8d0e0":"#1a1a38",outline:"none"}} placeholder="analyst@company.com" value={input} onChange={e=>{setInput(e.target.value);setResult(null);}} onKeyDown={e=>e.key==="Enter"&&check()}/><button onClick={check} style={btnStyle()}>CHECK</button></div>
      {result&&<div style={{marginTop:12,animation:"fadeIn .3s ease"}}><InfoBox color={result.pwned?"#ff3355":"#00ff88"}>{result.pwned?`🔴 PWNED — Found in ${result.hits.length} breach${result.hits.length>1?"es":""}`:"✅ No breaches found"}</InfoBox>{result.pwned&&result.hits.map((b,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:dark?"#080814":"#fff",borderRadius:5,marginTop:6,border:"1px solid #1a1a30"}}><span style={{fontFamily:MONO,fontSize:12,color:"#8899bb"}}>{b.domain}</span><div style={{display:"flex",gap:8}}><span style={{fontSize:10,color:"#445"}}>{b.n} records</span><Tag color="#ffcc00">{b.y}</Tag></div></div>)}</div>}
    </div>
  </Card>;
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const btnStyle=(c="#ff3355")=>({background:c,border:"none",borderRadius:6,padding:"11px 22px",fontFamily:SYNE,fontWeight:700,fontSize:12,letterSpacing:2,color:"#fff",cursor:"pointer",boxShadow:`0 0 16px ${c}44`,transition:"all .2s",whiteSpace:"nowrap"});

// ── Navigation config ─────────────────────────────────────────────────────────
const NAV=[
  {group:"Detection",items:[
    {id:"url",icon:"🔍",label:"URL Scanner"},
    {id:"email",icon:"📧",label:"Email Analyzer"},
    {id:"header",icon:"📋",label:"Header Analyzer"},
    {id:"qr",icon:"📷",label:"QR Scanner"},
    {id:"attach",icon:"📎",label:"Attachment Scorer"},
    {id:"homoglyph",icon:"🔤",label:"Homoglyph Detect"},
    {id:"bulk",icon:"📋",label:"Bulk Scanner"},
  ]},
  {group:"Training",items:[
    {id:"quiz",icon:"🎯",label:"Awareness Quiz"},
    {id:"drills",icon:"⏱",label:"Scenario Drills"},
  ]},
  {group:"Settings",items:[
    {id:"blocklist",icon:"🚫",label:"Blocklist"},
  ]},
];

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("url");
  const[dark,setDark]=useState(true);
  const[overlay,setOverlay]=useState(null);
  const[sound,setSound]=useState(true);
  const[isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"?window.innerWidth<=900:false);

  const[sidebarOpen,setSidebarOpen]=useState(true);
  const playAlert=useAudio();

  const trigger=r=>{ if(sound)playAlert(r); if(r!=="SAFE")setOverlay(r); };


  // Keyboard shortcuts
  useEffect(()=>{
    const h=e=>{
      if(e.key==="Escape"){setOverlay(null);}
      if(e.altKey){const n=parseInt(e.key);if(n>=1&&n<=NAV.flatMap(g=>g.items).length){setTab(NAV.flatMap(g=>g.items)[n-1]?.id);}}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);
  useEffect(()=>{
    const onResize=()=>setIsMobile(window.innerWidth<=900);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  useEffect(()=>{if(isMobile)setSidebarOpen(false);},[isMobile]);
  useEffect(()=>{
    document.body.style.overflow=isMobile&&sidebarOpen?"hidden":"";
    return()=>{document.body.style.overflow="";};
  },[isMobile,sidebarOpen]);

  const th={bg:dark?"#05050e":"#f0f2f8",card:dark?"#0a0a1a":"#ffffff",border:dark?"#1e2240":"#dde0f0",text:dark?"#b0bcd0":"#1a1a3a",sidebar:dark?"#080812":"#ffffff"};
  const allNavItems=NAV.flatMap(g=>g.items);
  const current=allNavItems.find(i=>i.id===tab)||allNavItems[0];
  const blocklistCount=CUSTOM_DOMAINS.length+CUSTOM_KW.length;



  return <ThemeCtx.Provider value={{dark}}>
    <style>{FONTS}{`
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.65}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes borderFlash{0%,100%{opacity:1}50%{opacity:.15}}
      @keyframes bgFlash{0%,100%{opacity:.6}50%{opacity:1}}
      @keyframes scannerV{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
      @keyframes scanLine{0%,100%{top:15%;opacity:.5}50%{top:82%;opacity:1}}
      *{box-sizing:border-box;transition:background .2s,color .2s,border-color .2s}
      input:focus,textarea:focus{border-color:#ff3355!important;outline:none}
      button:hover{filter:brightness(1.12);transform:translateY(-1px)}
      button:active{transform:none}
      ::-webkit-scrollbar{width:4px;background:transparent}
      ::-webkit-scrollbar-thumb{background:#1a1a38;border-radius:3px}
      .app-shell{overflow:hidden}
      @media (max-width: 900px){
        .topbar{padding:10px 12px!important;gap:8px!important;flex-wrap:wrap}
        .topbar-title{font-size:15px!important}
        .topbar-controls{margin-left:0!important;width:100%;justify-content:flex-end}
        .panel-wrap{padding:14px 12px 36px!important}
        .sidebar-shell{position:fixed!important;left:0;top:0;bottom:0;height:100vh!important;z-index:120;box-shadow:0 20px 70px rgba(0,0,0,.45)}
        .desktop-live{display:none!important}
        table{display:block;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch}
        button{touch-action:manipulation}
      }
    `}</style>

    <AlertOverlay level={overlay} onDismiss={()=>setOverlay(null)}/>

    <div className="app-shell" style={{display:"flex",minHeight:"100vh",background:th.bg,color:th.text,fontFamily:MONO}}>
      {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(5,5,14,.5)",zIndex:110}}/>}

      {/* Sidebar */}
      <div className="sidebar-shell" style={{width:isMobile?220:(sidebarOpen?220:62),flexShrink:0,background:th.sidebar,borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",transition:isMobile?"transform .25s ease":"width .25s ease",overflow:"hidden",position:isMobile?"fixed":"sticky",top:0,height:"100vh",transform:isMobile?(sidebarOpen?"translateX(0)":"translateX(-100%)"):"none"}}>
        {/* Logo */}
        <div style={{padding:"18px 14px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#ff1133,#ff6633)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🛡</div>
          {sidebarOpen&&<div style={{overflow:"hidden"}}><div style={{fontFamily:SYNE,fontWeight:900,fontSize:15,color:dark?"#eef":"#1a1a3a",whiteSpace:"nowrap"}}>PHISH<span style={{color:"#ff3355"}}>GUARD</span></div><div style={{fontSize:9,color:"#445",letterSpacing:2}}>SOC EDITION</div></div>}
        </div>

        {/* Nav items */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
          {NAV.map(group=><div key={group.group} style={{marginBottom:12}}>
            {sidebarOpen&&<div style={{fontSize:9,color:"#334",letterSpacing:3,padding:"4px 8px 6px",fontFamily:SYNE,fontWeight:700,textTransform:"uppercase"}}>{group.group}</div>}
            {group.items.map(item=>(
              <button key={item.id} onClick={()=>{setTab(item.id);if(isMobile)setSidebarOpen(false);}} title={!sidebarOpen?item.label:""} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:sidebarOpen?"8px 10px":"8px 0",justifyContent:sidebarOpen?"flex-start":"center",background:tab===item.id?"rgba(255,51,85,.1)":"transparent",border:`1px solid ${tab===item.id?"#ff335533":"transparent"}`,borderRadius:7,color:tab===item.id?"#ff5566":dark?"#556":"#778",fontFamily:MONO,fontSize:11,cursor:"pointer",marginBottom:2,transition:"all .15s"}}>
                <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                {sidebarOpen&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>}
                {sidebarOpen&&item.id==="blocklist"&&blocklistCount>0&&<span style={{marginLeft:"auto",background:"#ff3355",color:"#fff",borderRadius:10,fontSize:9,padding:"1px 6px",fontFamily:SYNE,fontWeight:700}}>{blocklistCount}</span>}
              </button>
            ))}
            {!sidebarOpen&&group.group!=="Settings"&&<div style={{height:1,background:th.border,margin:"6px 4px"}}/>}
          </div>)}
        </div>

        {/* Sidebar toggle */}
        <button onClick={()=>setSidebarOpen(v=>!v)} style={{background:"transparent",border:"none",borderTop:`1px solid ${th.border}`,padding:"12px",color:"#445",cursor:"pointer",fontSize:16,fontFamily:MONO}}>{sidebarOpen?"◀":"▶"}</button>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,marginLeft:isMobile?0:undefined}}>
        {/* Topbar */}
        <div className="topbar" style={{borderBottom:`1px solid ${th.border}`,padding:"14px 28px",display:"flex",alignItems:"center",gap:12,background:th.sidebar,position:"sticky",top:0,zIndex:50}}>
          {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{background:"transparent",border:`1px solid ${th.border}`,borderRadius:6,padding:"4px 10px",color:dark?"#dde":"#334",fontSize:14,cursor:"pointer"}}>{sidebarOpen?"✕":"☰"}</button>}
          <span style={{fontSize:20}}>{current.icon}</span>
          <div className="topbar-title" style={{fontFamily:SYNE,fontWeight:800,fontSize:17,color:dark?"#eef":"#1a1a3a"}}>{current.label}</div>
          <div className="topbar-controls" style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setSound(v=>!v)} style={{background:sound?"rgba(0,255,136,.08)":"rgba(255,51,85,.08)",border:`1px solid ${sound?"#00ff8833":"#ff335533"}`,borderRadius:6,padding:"5px 12px",color:sound?"#00ff88":"#ff3355",fontFamily:MONO,fontSize:10,cursor:"pointer",letterSpacing:1}}>{sound?"🔊":"🔇"}</button>
            <button onClick={()=>setDark(v=>!v)} style={{background:dark?"rgba(255,204,0,.08)":"rgba(102,68,255,.08)",border:`1px solid ${dark?"#ffcc0033":"#6644ff33"}`,borderRadius:6,padding:"5px 12px",color:dark?"#ffcc00":"#6644ff",fontFamily:MONO,fontSize:10,cursor:"pointer",letterSpacing:1}}>{dark?"☀ LIGHT":"🌙 DARK"}</button>
            <div className="desktop-live" style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 8px #00ff88",animation:"pulse 2s ease-in-out infinite"}}/><span style={{fontSize:9,color:"#334",letterSpacing:2}}>LIVE</span></div>
          </div>
        </div>

        {/* Panel */}
        <div className="panel-wrap" style={{flex:1,maxWidth:880,width:"100%",margin:"0 auto",padding:"28px 24px 60px",animation:"fadeIn .25s ease"}}>
          {tab==="url"&&<URLScanner onTrigger={trigger} sound={sound}/>}
          {tab==="email"&&<EmailAnalyzer onTrigger={trigger}/>}
          {tab==="header"&&<HeaderAnalyzer onTrigger={trigger}/>}
          {tab==="qr"&&<QRScanner onTrigger={trigger}/>}
          {tab==="attach"&&<AttachmentScorer/>}
          {tab==="homoglyph"&&<HomoglyphDetector/>}
          {tab==="bulk"&&<BulkScanner onTrigger={trigger}/>}
          {tab==="quiz"&&<AwarenessQuiz/>}
          {tab==="drills"&&<ScenarioDrills/>}
          {tab==="blocklist"&&<BlocklistManager/>}
        </div>
      </div>
    </div>
  </ThemeCtx.Provider>;
}
