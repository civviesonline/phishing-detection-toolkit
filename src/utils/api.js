import { hashStr } from "./analysis";

const now = () => new Date().toISOString();

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
  const verificationSources = (analysis?.verification?.sources || [])
    .filter(source => source?.ok)
    .map(source => ({
      name: source.label,
      confidence: Math.round(confidence),
      at: analysis?.verification?.checkedAt || now(),
      href: source.href || ""
    }));
  const ioc = {
    id,
    type,
    value,
    normalized,
    tags: [],
    confidence: Math.round(confidence),
    first_seen: now(),
    last_seen: now(),
    sources: verificationSources.length
      ? verificationSources
      : [{ name: "circadian", confidence: Math.round(confidence), at: now() }],
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
  const redirectChain = analysis?.deob?.chain?.length
    ? analysis.deob.chain.map((hopUrl, index) => ({
        url: hopUrl,
        status: index === 0 && hopUrl.startsWith("http:") ? 301 : 200,
        at_ms: 80 + index * 60
      }))
    : [{ url: finalUrl, status: finalUrl.startsWith("http:") ? 301 : 200, at_ms: 120 }];

  const forms = /login|signin|verify|account/i.test(finalUrl)
    ? [{ action: finalUrl.replace(/\/$/, "") + "/submit", method: "POST", fields: ["email", "password"] }]
    : [];

  const domHash = hashStr(finalUrl + "dom").toString(16);
  const textHash = hashStr(finalUrl + "text").toString(16);

  const artifacts = {
    scan_id: scanId,
    final_url: finalUrl,
    redirect_chain: redirectChain,
    forms,
    fingerprints: { dom_hash: domHash, text_hash: textHash },
    screenshot_url: `https://image.thum.io/get/width/1200/noanimate/${encodeURIComponent(finalUrl)}`,
    headers: {
      source: analysis?.verification?.minimumSourcesMet ? "live-verification" : "verification-pending",
      content_type: "text/html"
    },
    risk: analysis?.risk || "UNVERIFIED",
    score: analysis?.score ?? 0,
    verification_sources: analysis?.verification?.sources || []
  };

  store.scans.set(scanId, artifacts);
  return artifacts;
}

export async function getEnrichment({ url, analysis }) {
  const normalized = normalizeValue("url", url);
  const id = makeId("enrich", normalized);
  const existing = store.enrich.get(id);
  if (existing) return existing;

  const enrichment = {
    dns: {
      ok: Boolean(analysis?.verification?.dns?.ok),
      detail: analysis?.verification?.dns?.detail || "No live DNS evidence collected yet.",
      addresses: analysis?.verification?.dns?.addresses || []
    },
    search: {
      matches: analysis?.verification?.search?.matches || 0,
      negative_hits: analysis?.verification?.search?.negativeHits || [],
      positive_hits: analysis?.verification?.search?.positiveHits || []
    },
    page: {
      ok: Boolean(analysis?.verification?.page?.ok),
      detail: analysis?.verification?.page?.detail || "No live page evidence collected yet.",
      signals: analysis?.verification?.page?.signals || [],
      http_targets: analysis?.verification?.page?.relatedHttpTargets || [],
      suspicious_targets: analysis?.verification?.page?.suspiciousTargetHosts || []
    },
    verified_at: analysis?.verification?.checkedAt || now(),
    summary: analysis?.verification?.summary || "Live verification has not completed yet.",
    sources: (analysis?.verification?.sources || []).map(source => ({
      name: source.label,
      ok: Boolean(source.ok),
      at: analysis?.verification?.checkedAt || now(),
      href: source.href || "",
      detail: source.detail || "",
      excerpt: source.excerpt || ""
    }))
  };
  store.enrich.set(id, enrichment);
  return enrichment;
}
