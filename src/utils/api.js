import { hashStr } from "./analysis";

const now = () => new Date().toISOString();
const REGISTRARS = ["Namecheap", "GoDaddy", "Tucows", "PDR Ltd", "NameSilo"];

const store = {
  iocs: new Map(),
  enrich: new Map(),
  scans: new Map()
};

const makeId = (prefix, value) => `${prefix}_${hashStr(value).toString(16)}`;

const normalizeValue = (type, value) => {
  if (type === "url") {
    try {
      const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
      return parsed.hostname.toLowerCase();
    } catch {
      return value.toLowerCase();
    }
  }
  return String(value || "").trim().toLowerCase();
};

const makeIp = (value) => {
  const h = hashStr(value);
  return `${(h % 200) + 40}.${(h >> 4) % 256}.${(h >> 8) % 256}.${(h >> 12) % 254 + 1}`;
};

export async function submitIOC({ type, value, analysis }) {
  const normalized = normalizeValue(type, value);
  const id = makeId("ioc", `${type}:${normalized}`);
  const existing = store.iocs.get(id);
  if (existing) {
    const updated = { ...existing, last_seen: now() };
    store.iocs.set(id, updated);
    return updated;
  }

  const confidence = Math.max(5, Math.min(95, 35 + (analysis?.score || 0) * 0.6));
  const ioc = {
    id,
    type,
    value,
    normalized,
    tags: [],
    confidence: Math.round(confidence),
    first_seen: now(),
    last_seen: now(),
    sources: [
      { name: "circadian", confidence: Math.round(confidence), at: now() }
    ],
    related_iocs: type === "url"
      ? [{ type: "domain", value: normalized, id: makeId("ioc", `domain:${normalized}`) }]
      : []
  };
  store.iocs.set(id, ioc);
  return ioc;
}

export async function getIOC(id) {
  return store.iocs.get(id) || null;
}

export async function getDetonationArtifacts({ url, analysis }) {
  const normalized = normalizeValue("url", url);
  const scanId = makeId("scan", `url:${normalized}`);
  const existing = store.scans.get(scanId);
  if (existing) return existing;

  const finalUrl = url.startsWith("http") ? url : `https://${url}`;
  const chain = [
    { url: finalUrl, status: finalUrl.startsWith("http:") ? 301 : 200, at_ms: 120 }
  ];

  const hasRedirect = /bit\.ly|t\.co|tinyurl|goo\.gl|redirect|login/i.test(finalUrl);
  if (hasRedirect) {
    chain.unshift({ url: `http://short.link/${hashStr(finalUrl).toString(16)}`, status: 301, at_ms: 40 });
  }

  const forms = /login|signin|verify|account/i.test(finalUrl)
    ? [{ action: finalUrl.replace(/\/$/, "") + "/submit", method: "POST", fields: ["email", "password"] }]
    : [];

  const domHash = hashStr(finalUrl + "dom").toString(16);
  const textHash = hashStr(finalUrl + "text").toString(16);

  const artifacts = {
    scan_id: scanId,
    final_url: finalUrl,
    redirect_chain: chain,
    forms,
    fingerprints: { dom_hash: domHash, text_hash: textHash },
    screenshot_url: `https://image.thum.io/get/width/1200/noanimate/${encodeURIComponent(finalUrl)}`,
    headers: {
      server: "nginx",
      content_type: "text/html"
    },
    risk: analysis?.risk || "SAFE",
    score: analysis?.score ?? 0
  };

  store.scans.set(scanId, artifacts);
  return artifacts;
}

export async function getEnrichment({ url }) {
  const normalized = normalizeValue("url", url);
  const id = makeId("enrich", normalized);
  const existing = store.enrich.get(id);
  if (existing) return existing;

  const registrar = REGISTRARS[hashStr(normalized) % REGISTRARS.length];
  const ip = makeIp(normalized);
  const enrichment = {
    whois: {
      registrar,
      created: `${2024 - (hashStr(normalized) % 6)}-0${(hashStr(normalized) % 8) + 1}-1${hashStr(normalized) % 8}`
    },
    passive_dns: {
      ip_history: [
        { ip, first_seen: "2025-01-01", last_seen: now().slice(0, 10) }
      ]
    },
    sources: [
      { name: "whois_provider", confidence: 70, at: now() },
      { name: "passive_dns_provider", confidence: 65, at: now() }
    ]
  };
  store.enrich.set(id, enrichment);
  return enrichment;
}
