import { SAFE_DOMAINS, RISK_ORDER } from "../data/constants";
import { analyzeEmail, analyzeURL } from "./analysis";

const PROBE_TTL_MS = 20_000;
const URL_CACHE_TTL_MS = 2 * 60_000;
const URL_CACHE_VERSION = "2026-04-09-http-scrutiny";
const PROBE_TARGET = "https://dns.google/resolve?name=example.com&type=A";
const VERIFICATION_REQUIRED_MESSAGE =
  "Internet verification is required before Circadian can mark this result safe, suspicious, or dangerous.";
const SEARCH_NEGATIVE_TERMS = [
  "phishing",
  "scam",
  "fraud",
  "malware",
  "abuse",
  "blacklist",
  "spam",
  "fake",
  "impersonation"
];
const SEARCH_POSITIVE_TERMS = ["official", "homepage", "company", "brand", "support"];
const NO_RESULT_PATTERNS = [
  "did not match any documents",
  "no results found",
  "no results",
  "couldn't find any results",
  "there are no results"
];
const READER_BLOCK_PATTERNS = [
  "securitycompromiseerror",
  "anonymous access to domain",
  "\"code\":451",
  "\"status\":45102",
  "ddos attack suspected"
];
const PAGE_PARKED_RULES = [
  { label: "Parked or for-sale domain language detected", pattern: /buy this domain|domain (?:may be )?for sale|this domain is parked|parked free courtesy of|parkingcrew|sedo|bodis|related searches|domain parking|cash parking/i }
];
const PAGE_WARNING_RULES = [
  { label: "Hidden iframe content detected", pattern: /hidden iframe|contains iframe that are currently hidden/i },
  { label: "Embedded iframe processing warning detected", pattern: /consider enabling iframe processing/i }
];
const PAGE_REDIRECT_RULES = [
  { label: "Script-driven redirect detected", pattern: /window\.location\.(?:replace|assign)|window\.location\s*=|location\.href\s*=/i },
  { label: "Meta refresh redirect detected", pattern: /http-equiv=["']refresh|meta refresh/i },
  { label: "Redirect placeholder detected in page source", pattern: /redirect_link/i },
  { label: "Noscript redirect fallback detected", pattern: /<noscript[\s\S]*http-equiv=["']refresh|noscript.*url=/i },
  { label: "Forced entry redirect lure detected", pattern: /click here to enter/i }
];
const PAGE_TRACKING_RULES = [
  { label: "Browser fingerprinting script detected", pattern: /fingerprintjs|visitorid/i },
  { label: "Tracking redirect token detected", pattern: /tr_uuid=|[?&]fp=-?\d+/i },
  { label: "Hidden redirect container detected", pattern: /display:\s*none/i }
];
const ABSOLUTE_URL_RE = /\bhttps?:\/\/[^\s"'<>`)\]]+/gi;
const SUSPICIOUS_REDIRECT_HOST_RE = /^ww\d+\./i;

const probeCache = { at: 0, value: null };
const urlCache = new Map();

const SEARCH_PROVIDERS = [
  {
    id: "google-web",
    label: "Google web search",
    query: domain => `"${domain}"`,
    url: query => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: "google-reputation",
    label: "Google reputation sweep",
    query: domain => `"${domain}" scam OR phishing OR malware OR fraud`,
    url: query => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: "bing-web",
    label: "Bing web search",
    query: domain => `"${domain}"`,
    url: query => `https://www.bing.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: "duckduckgo-web",
    label: "DuckDuckGo search",
    query: domain => `"${domain}"`,
    url: query => `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  }
];

const unique = items => [...new Set(items.filter(Boolean))];

const clamp = value => Math.max(0, Math.min(100, value));
const DOMAIN_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

const buildReaderUrl = url => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https:\/\//i.test(value)) return `https://r.jina.ai/http://${value}`;
  return `https://r.jina.ai/http://${value.replace(/^http:\/\//i, "")}`;
};

const withTimeout = async (promise, timeoutMs = 8_000) => {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out while collecting live verification evidence.")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const fetchJson = async url => {
  const response = await withTimeout(fetch(url, { cache: "no-store" }));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const fetchText = async url => {
  const response = await withTimeout(
    fetch(url, {
      cache: "no-store",
      headers: { Accept: "text/plain, text/markdown, application/json;q=0.8, */*;q=0.5" }
    })
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

const normalizeUrl = raw => {
  const value = String(raw || "").trim();
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
};

const trimUrlTrail = value => String(value || "").replace(/[),.;!?'"`\]]+$/g, "");

const extractUrlsFromText = text => unique((String(text || "").match(ABSOLUTE_URL_RE) || []).map(trimUrlTrail));

const collectRuleHits = (text, rules) =>
  rules.filter(rule => rule.pattern.test(text)).map(rule => rule.label);

const isReaderBlocked = text => READER_BLOCK_PATTERNS.some(pattern => text.includes(pattern));

const countMentions = (text, needle) => {
  if (!text || !needle) return 0;
  const haystack = String(text).toLowerCase();
  const target = String(needle).toLowerCase();
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(target, index)) !== -1) {
    count += 1;
    index += target.length;
  }
  return count;
};

const pickExcerpt = (text, domain, terms = []) => {
  const lines = String(text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
  const domainLower = String(domain || "").toLowerCase();
  const wantedTerms = terms.map(term => term.toLowerCase());
  const match =
    lines.find(line => {
      const lower = line.toLowerCase();
      return lower.includes(domainLower) && wantedTerms.some(term => lower.includes(term));
    }) ||
    lines.find(line => line.toLowerCase().includes(domainLower)) ||
    lines[0];
  if (!match) return "";
  return match.length > 180 ? `${match.slice(0, 180)}…` : match;
};

const mapScoreToRisk = score => (score < 25 ? "SAFE" : score < 55 ? "SUSPICIOUS" : "DANGER");

const isIpHostname = hostname => /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":");

const isSameHostnameFamily = (candidate, hostname) =>
  Boolean(candidate && hostname) &&
  (candidate === hostname || candidate.endsWith(`.${hostname}`) || hostname.endsWith(`.${candidate}`));

const hasLegitimateRegisteredDomain = hostname => {
  if (!hostname || hostname === "localhost" || isIpHostname(hostname)) return false;
  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return false;
  const tld = labels.at(-1) || "";
  if (!/^[a-z]{2,63}$/i.test(tld) && !/^xn--[a-z0-9-]{2,59}$/i.test(tld)) return false;
  return labels.every(label => DOMAIN_LABEL_RE.test(label));
};

const getAllowlistMatch = domain => SAFE_DOMAINS.find(allowed => domain === allowed || domain.endsWith(`.${allowed}`));

const makeVerificationSource = patch => ({
  id: patch.id,
  label: patch.label,
  ok: Boolean(patch.ok),
  detail: patch.detail || "",
  href: patch.href || "",
  excerpt: patch.excerpt || "",
  query: patch.query || "",
  kind: patch.kind || "source",
  negativeHits: patch.negativeHits || [],
  positiveHits: patch.positiveHits || [],
  noResults: Boolean(patch.noResults),
  domainMentions: patch.domainMentions || 0
});

const buildVerificationSummary = ({ minimumSourcesMet, searchMatches, negativeHits, allowlisted, dnsResolved, page }) => {
  if (!minimumSourcesMet) {
    if (!page?.ok) {
      return "Circadian could not inspect the live destination content, so the result stays unverified.";
    }
    return "Circadian could not collect enough live evidence, so the result stays unverified.";
  }
  if (page?.warningSignals?.length || page?.parkedSignals?.length) {
    return `Live page inspection surfaced high-risk landing-page signals: ${[...(page.warningSignals || []), ...(page.parkedSignals || [])].join(", ")}.`;
  }
  if (page?.httpDowngrade) {
    return "The inspected page attempted to downgrade users from HTTPS to HTTP, so Circadian denied a safe verdict.";
  }
  if (page?.suspiciousTargetHosts?.length) {
    return `The inspected page referenced suspicious redirect host(s): ${page.suspiciousTargetHosts.join(", ")}.`;
  }
  if (page?.redirectSignals?.length && page?.trackingSignals?.length) {
    return "Live page inspection found a scripted redirector with tracking or fingerprinting behavior.";
  }
  if (negativeHits.length) {
    return `Live search evidence surfaced reputation warnings for this domain: ${negativeHits.join(", ")}.`;
  }
  if (allowlisted && dnsResolved && searchMatches > 0) {
    return "Live DNS and search evidence support a trusted allowlisted domain.";
  }
  if (searchMatches === 0) {
    return "Circadian reached the internet, but open-web search did not provide enough legitimacy evidence to call this site safe.";
  }
  return "Circadian verified the site with live DNS and search evidence before issuing this verdict.";
};

const buildUnverifiedIntelligence = detail => ({
  tactic: "Internet Verification Required",
  intent: "Deferred Verdict",
  recommendation: "Reconnect Circadian to the internet and rerun the scan before trusting the result.",
  technicalDetail: detail || VERIFICATION_REQUIRED_MESSAGE
});

const buildVerifiedSummary = ({ risk, httpOnly, registrableDomain, dns, searchMatches, negativeHits, page }) => {
  if (!registrableDomain) {
    return "Circadian confirmed the hostname does not look like a legitimate registered domain, so it cannot be safe.";
  }
  if (httpOnly) {
    return "This site uses plain HTTP. Circadian will not mark HTTP-only destinations safe.";
  }
  if (dns.rawStatus === 3) {
    return "Live DNS indicates the domain does not resolve, which is consistent with an unregistered or non-existent destination.";
  }
  if (!dns.ok) {
    return "Live DNS could not resolve this domain, so Circadian denied a safe verdict.";
  }
  if (!page?.ok) {
    return "Circadian could not inspect the live destination content, so it denied a safe verdict.";
  }
  if (page.warningSignals?.length) {
    return `Live page inspection surfaced high-risk rendering signals: ${page.warningSignals.join(", ")}.`;
  }
  if (page.parkedSignals?.length) {
    return `Live page inspection suggests the domain is acting like a parked or monetized redirector: ${page.parkedSignals.join(", ")}.`;
  }
  if (page.httpDowngrade) {
    return "The inspected page attempted to send users to plain HTTP destinations, which Circadian treats as unsafe.";
  }
  if (page.suspiciousTargetHosts?.length) {
    return `The inspected page referenced suspicious redirect host(s): ${page.suspiciousTargetHosts.join(", ")}.`;
  }
  if (page.redirectSignals?.length && page.trackingSignals?.length) {
    return "Live page inspection found a scripted redirector with tracking or fingerprinting behavior.";
  }
  if (negativeHits.length) {
    return `Live search evidence surfaced reputation warnings for this domain: ${negativeHits.join(", ")}.`;
  }
  if (risk === "SAFE") {
    return "Live DNS, live page inspection, and multiple search sources corroborated the domain, and Circadian did not find meaningful negative reputation signals.";
  }
  if (searchMatches === 0) {
    return "Circadian verified connectivity, but the domain still lacks enough legitimate web corroboration to be treated as safe.";
  }
  return "Circadian collected enough live evidence to deny a safe verdict, even though the domain is reachable.";
};

export async function probeInternetAccess(force = false) {
  const now = Date.now();
  if (!force && probeCache.value && now - probeCache.at < PROBE_TTL_MS) {
    return probeCache.value;
  }

  const navigatorOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (navigatorOffline) {
    const offline = {
      online: false,
      checkedAt: new Date().toISOString(),
      source: makeVerificationSource({
        id: "internet-probe",
        label: "Internet probe",
        ok: false,
        kind: "connectivity",
        detail: "Browser reports the device is offline."
      })
    };
    probeCache.at = now;
    probeCache.value = offline;
    return offline;
  }

  try {
    await fetchJson(PROBE_TARGET);
    const result = {
      online: true,
      checkedAt: new Date().toISOString(),
      source: makeVerificationSource({
        id: "internet-probe",
        label: "Internet probe",
        ok: true,
        kind: "connectivity",
        detail: "Live connectivity confirmed with dns.google.",
        href: "https://dns.google/resolve?name=example.com&type=A"
      })
    };
    probeCache.at = now;
    probeCache.value = result;
    return result;
  } catch (error) {
    const result = {
      online: false,
      checkedAt: new Date().toISOString(),
      source: makeVerificationSource({
        id: "internet-probe",
        label: "Internet probe",
        ok: false,
        kind: "connectivity",
        detail: `Live connectivity probe failed: ${error.message}`
      })
    };
    probeCache.at = now;
    probeCache.value = result;
    return result;
  }
}

const makeUnverifiedResult = ({ base, raw, reason, verification }) => ({
  ...base,
  raw: raw ?? base?.raw,
  risk: "UNVERIFIED",
  flags: unique([reason || VERIFICATION_REQUIRED_MESSAGE, ...(base?.flags || [])]),
  confidence: verification?.coverage ?? 0,
  verification,
  intelligence: buildUnverifiedIntelligence(reason)
});

const readCache = key => {
  const cached = urlCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at > URL_CACHE_TTL_MS) {
    urlCache.delete(key);
    return null;
  }
  return cached.value;
};

const writeCache = (key, value) => {
  urlCache.set(key, { at: Date.now(), value });
  return value;
};

async function collectSearchEvidence(domain) {
  const settled = await Promise.all(
    SEARCH_PROVIDERS.map(async provider => {
      const query = provider.query(domain);
      const href = provider.url(query);
      try {
        const text = await fetchText(buildReaderUrl(href));
        const lower = text.toLowerCase();
        if (isReaderBlocked(lower)) {
          return makeVerificationSource({
            id: provider.id,
            label: provider.label,
            ok: false,
            href,
            query,
            kind: "search",
            detail: "Search collection was blocked by the reader proxy before Circadian could verify the results."
          });
        }
        const noResults = NO_RESULT_PATTERNS.some(pattern => lower.includes(pattern));
        const negativeHits = SEARCH_NEGATIVE_TERMS.filter(term => lower.includes(term));
        const positiveHits = SEARCH_POSITIVE_TERMS.filter(term => lower.includes(term));
        const domainMentions = countMentions(lower, domain);
        return makeVerificationSource({
          id: provider.id,
          label: provider.label,
          ok: true,
          href,
          query,
          kind: "search",
          detail: noResults
            ? "Search completed but did not surface readable results."
            : `Search completed with ${domainMentions} readable domain mention(s).`,
          excerpt: pickExcerpt(text, domain, [...negativeHits, ...positiveHits]),
          negativeHits,
          positiveHits,
          noResults,
          domainMentions
        });
      } catch (error) {
        return makeVerificationSource({
          id: provider.id,
          label: provider.label,
          ok: false,
          href,
          query,
          kind: "search",
          detail: `Search collection failed: ${error.message}`
        });
      }
    })
  );
  return settled;
}

async function collectPageEvidence(parsedUrl) {
  const pageHref = buildReaderUrl(parsedUrl.href);

  try {
    const text = await fetchText(pageHref);
    const lower = text.toLowerCase();

    if (isReaderBlocked(lower)) {
      return {
        ok: false,
        detail: "The reader proxy refused to inspect the destination content, so Circadian could not complete live page scrutiny.",
        excerpt: "",
        href: pageHref,
        signals: [],
        parkedSignals: [],
        warningSignals: [],
        redirectSignals: [],
        trackingSignals: [],
        targetUrls: [],
        httpTargets: [],
        relatedHttpTargets: [],
        suspiciousTargetHosts: [],
        httpDowngrade: false,
        clean: false
      };
    }

    const parkedSignals = collectRuleHits(text, PAGE_PARKED_RULES);
    const warningSignals = collectRuleHits(text, PAGE_WARNING_RULES);
    const redirectSignals = collectRuleHits(text, PAGE_REDIRECT_RULES);
    const trackingSignals = collectRuleHits(text, PAGE_TRACKING_RULES);
    const extractedTargets = extractUrlsFromText(text)
      .map(target => normalizeUrl(target))
      .filter(Boolean);
    const httpTargets = unique(extractedTargets.filter(target => target.protocol === "http:").map(target => target.href));
    const relatedHttpTargets = unique(
      extractedTargets
        .filter(
          target =>
            target.protocol === "http:" &&
            isSameHostnameFamily(target.hostname.toLowerCase(), parsedUrl.hostname.toLowerCase())
        )
        .map(target => target.href)
    );
    const suspiciousTargetHosts = unique(
      extractedTargets
        .map(target => target.hostname.toLowerCase())
        .filter(hostname => SUSPICIOUS_REDIRECT_HOST_RE.test(hostname))
    );
    const httpDowngrade = parsedUrl.protocol === "https:" && relatedHttpTargets.length > 0;
    const signals = unique([
      ...parkedSignals,
      ...warningSignals,
      ...redirectSignals,
      ...trackingSignals,
      httpDowngrade ? "HTTPS page attempts to downgrade visitors to HTTP" : "",
      suspiciousTargetHosts.length ? `Suspicious redirect host referenced: ${suspiciousTargetHosts.join(", ")}` : ""
    ]);

    return {
      ok: true,
      detail: [
        "Live page content inspected.",
        signals.length
          ? `Signals found: ${signals.join("; ")}.`
          : "No deceptive landing-page patterns were detected in the readable content.",
        relatedHttpTargets.length ? `Observed HTTP destination(s): ${relatedHttpTargets.join(" · ")}.` : ""
      ]
        .filter(Boolean)
        .join(" "),
      excerpt: pickExcerpt(text, parsedUrl.hostname, [
        "redirect",
        "http://",
        "fingerprint",
        "iframe",
        "tr_uuid",
        "parked",
        "sale",
        "click here to enter"
      ]),
      href: pageHref,
      signals,
      parkedSignals,
      warningSignals,
      redirectSignals,
      trackingSignals,
      targetUrls: unique(extractedTargets.map(target => target.href)),
      httpTargets,
      relatedHttpTargets,
      suspiciousTargetHosts,
      httpDowngrade,
      clean: signals.length === 0
    };
  } catch (error) {
    return {
      ok: false,
      detail: `Live page inspection failed: ${error.message}`,
      excerpt: "",
      href: pageHref,
      signals: [],
      parkedSignals: [],
      warningSignals: [],
      redirectSignals: [],
      trackingSignals: [],
      targetUrls: [],
      httpTargets: [],
      relatedHttpTargets: [],
      suspiciousTargetHosts: [],
      httpDowngrade: false,
      clean: false
    };
  }
}

async function collectDnsEvidence(domain) {
  try {
    const result = await fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const addresses = (result.Answer || [])
      .filter(answer => answer?.data)
      .map(answer => answer.data);
    return {
      ok: result.Status === 0 && addresses.length > 0,
      addresses,
      rawStatus: result.Status,
      detail:
        result.Status === 0 && addresses.length > 0
          ? `Live DNS resolved ${addresses.length} address${addresses.length === 1 ? "" : "es"}.`
          : `DNS status ${result.Status} returned no usable A records.`
    };
  } catch (error) {
    return {
      ok: false,
      addresses: [],
      rawStatus: null,
      detail: `Live DNS lookup failed: ${error.message}`
    };
  }
}

const buildUrlIntelligence = ({ risk, base, verification, allowlisted, negativeHits, page }) => {
  if (risk === "UNVERIFIED") {
    return buildUnverifiedIntelligence(verification?.summary);
  }
  if (
    page?.parkedSignals?.length ||
    page?.warningSignals?.length ||
    page?.httpDowngrade ||
    page?.suspiciousTargetHosts?.length ||
    (page?.redirectSignals?.length && page?.trackingSignals?.length)
  ) {
    return {
      tactic: risk === "DANGER" ? "Deceptive Redirector" : "Suspicious Landing Page",
      intent: risk === "DANGER" ? "Traffic Hijack / Credential Theft" : "Review Before Interaction",
      recommendation:
        risk === "DANGER"
          ? "Do not interact with this site or submit any information. Block and isolate it until ownership and redirect behavior are independently verified."
          : "Treat this destination as untrusted until an analyst validates the landing page and its redirect behavior.",
      technicalDetail:
        verification?.summary ||
        "Live page inspection found redirect, iframe, parking, or HTTP-downgrade behavior that prevented a safe verdict."
    };
  }
  if (negativeHits.length) {
    return {
      tactic: "Open-Web Reputation Warning",
      intent: "Potential Fraud / Phishing",
      recommendation: "Treat the destination as hostile until an analyst can validate ownership and intent.",
      technicalDetail: `Circadian found live reputation signals tied to this domain: ${negativeHits.join(", ")}.`
    };
  }
  if (risk === "SAFE") {
    return {
      tactic: allowlisted ? "Trusted Domain Corroborated" : "Live Legitimacy Confirmed",
      intent: "Legitimate Resource",
      recommendation: allowlisted
        ? "The domain matched a trusted allowlist entry and live evidence did not surface open-web abuse warnings."
        : "Live verification succeeded and Circadian did not find meaningful negative reputation signals for this destination.",
      technicalDetail: verification?.summary || base?.intelligence?.technicalDetail || "Live search and DNS evidence corroborated the destination."
    };
  }
  if (risk === "SUSPICIOUS") {
    return {
      tactic: "Cautious Verification",
      intent: "Review Before Access",
      recommendation: "Open the source links below, review the search evidence, and only proceed if you can independently verify ownership.",
      technicalDetail:
        verification?.summary || "Circadian reached live sources, but the corroboration was not strong enough to call the site safe."
    };
  }
  return base?.intelligence || {
    tactic: "Live Risk Confirmation",
    intent: "Potential Phishing / Malware",
    recommendation: "Block or isolate the destination until the incident is reviewed.",
    technicalDetail: verification?.summary || "Live evidence and local heuristics both point to a high-risk destination."
  };
};

export async function analyzeUrlWithInternet(raw, customDomains = [], customKeywords = []) {
  const parsed = normalizeUrl(raw);
  const base = analyzeURL(raw, customDomains, customKeywords);

  if (!parsed) {
    return {
      ...base,
      raw,
      risk: "DANGER",
      confidence: 95,
      verification: {
        mode: "internet",
        checkedAt: new Date().toISOString(),
        online: false,
        minimumSourcesMet: true,
        coverage: 100,
        summary: "Circadian could not normalize that value into a valid live URL, so it cannot be safe.",
        sources: []
      },
      intelligence: {
        tactic: "Invalid URL",
        intent: "Malformed / Unsafe Input",
        recommendation: "Reject the input or correct the URL before attempting to visit it.",
        technicalDetail: "The submitted value could not be parsed as a valid URL."
      }
    };
  }

  const cacheKey = `${URL_CACHE_VERSION}:${parsed.href.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const probe = await probeInternetAccess();
  const allowlisted = getAllowlistMatch(parsed.hostname.toLowerCase());

  if (!probe.online) {
    return writeCache(
      cacheKey,
      makeUnverifiedResult({
        base,
        raw,
        reason: VERIFICATION_REQUIRED_MESSAGE,
        verification: {
          mode: "internet",
          checkedAt: probe.checkedAt,
          online: false,
          minimumSourcesMet: false,
          coverage: 0,
          summary: VERIFICATION_REQUIRED_MESSAGE,
          sources: [probe.source],
          search: { sources: [], matches: 0, negativeHits: [] },
          dns: { ok: false, addresses: [], detail: "Skipped because the device is offline." }
        }
      })
    );
  }

  const [dns, searchSources, page] = await Promise.all([
    collectDnsEvidence(parsed.hostname.toLowerCase()),
    collectSearchEvidence(parsed.hostname.toLowerCase()),
    collectPageEvidence(parsed)
  ]);

  const registrableDomain = hasLegitimateRegisteredDomain(parsed.hostname.toLowerCase());
  const httpOnly = parsed.protocol === "http:";
  const successfulSearches = searchSources.filter(source => source.ok);
  const searchMatches = successfulSearches.filter(source => !source.noResults && source.domainMentions >= 2).length;
  const readableSearches = successfulSearches.filter(source => !source.noResults && source.domainMentions >= 2);
  const negativeHits = unique(successfulSearches.flatMap(source => source.negativeHits));
  const positiveSearchHits = unique(successfulSearches.flatMap(source => source.positiveHits));
  const explicitDnsFailure = dns.rawStatus !== null && !dns.ok;
  const strongPageConcern =
    page.httpDowngrade ||
    page.warningSignals.length > 0 ||
    page.parkedSignals.length > 0 ||
    page.suspiciousTargetHosts.length > 0 ||
    (page.redirectSignals.length > 0 && page.trackingSignals.length > 0);
  const pageConcern = page.ok && (strongPageConcern || page.redirectSignals.length > 0 || page.trackingSignals.length > 0);
  const canIssueFinalVerdict =
    !registrableDomain ||
    explicitDnsFailure ||
    pageConcern ||
    (dns.ok && successfulSearches.length >= 2 && page.ok) ||
    (negativeHits.length > 0 && successfulSearches.length >= 1);
  const dnsSource = makeVerificationSource({
    id: "google-dns",
    label: "Google DNS",
    ok: dns.ok,
    href: `https://dns.google/resolve?name=${encodeURIComponent(parsed.hostname.toLowerCase())}&type=A`,
    kind: "dns",
    detail: dns.detail,
    excerpt: dns.addresses.join(", ")
  });
  const pageSource = makeVerificationSource({
    id: "live-page",
    label: "Live page inspection",
    ok: page.ok,
    href: page.href,
    kind: "page",
    detail: page.detail,
    excerpt: page.excerpt
  });

  const sources = [probe.source, dnsSource, pageSource, ...searchSources];
  const successfulSources = sources.filter(source => source.ok);
  const minimumSourcesMet = canIssueFinalVerdict;
  const coverage = clamp(Math.round((successfulSources.length / sources.length) * 100));
  let score = clamp(base.score);
  if (httpOnly) score = Math.max(score, 35);
  if (!registrableDomain) score = Math.max(score, 85);
  if (dns.rawStatus === 3) score = Math.max(score, httpOnly || negativeHits.length ? 82 : 62);
  else if (explicitDnsFailure) score = Math.max(score, httpOnly || negativeHits.length ? 74 : 58);
  if (negativeHits.length) score = clamp(Math.max(score, 48) + Math.min(negativeHits.length * 12, 24));
  if (dns.ok && successfulSearches.length >= 2 && searchMatches === 0) score = Math.max(score, 34);
  if (page.redirectSignals.length) score = clamp(Math.max(score, 44) + Math.min(page.redirectSignals.length * 5, 10));
  if (page.trackingSignals.length) score = clamp(Math.max(score, 50) + Math.min(page.trackingSignals.length * 5, 10));
  if (page.warningSignals.length) score = clamp(Math.max(score, 72) + Math.min(page.warningSignals.length * 6, 12));
  if (page.parkedSignals.length) score = clamp(Math.max(score, 72) + Math.min(page.parkedSignals.length * 6, 12));
  if (page.httpDowngrade) score = Math.max(score, page.redirectSignals.length || page.trackingSignals.length ? 86 : 58);
  if (page.suspiciousTargetHosts.length) score = clamp(Math.max(score, 78) + Math.min(page.suspiciousTargetHosts.length * 5, 10));
  if (!page.ok && dns.ok && successfulSearches.length >= 2 && negativeHits.length === 0) score = Math.max(score, 26);
  if (allowlisted && dns.ok && searchMatches >= 2 && negativeHits.length === 0 && !httpOnly && page.ok && page.clean) score = Math.min(score, 18);

  let risk = mapScoreToRisk(score);

  if (!registrableDomain) {
    risk = "DANGER";
  } else if (!minimumSourcesMet && !(httpOnly || explicitDnsFailure || negativeHits.length || base.score >= 55 || pageConcern)) {
    const verification = {
      mode: "internet",
      checkedAt: new Date().toISOString(),
      online: true,
      minimumSourcesMet: false,
      coverage,
      summary: buildVerificationSummary({
        minimumSourcesMet: false,
        searchMatches,
        negativeHits,
        allowlisted,
        dnsResolved: dns.ok,
        page
      }),
      sources,
      dns,
      page,
      search: {
        sources: searchSources,
        matches: readableSearches.length,
        negativeHits,
        positiveHits: positiveSearchHits
      }
    };
    return writeCache(cacheKey, makeUnverifiedResult({ base, raw, reason: verification.summary, verification }));
  }

  if (risk === "SAFE" && !(dns.ok && searchMatches >= 2 && negativeHits.length === 0 && registrableDomain && !httpOnly && page.ok && page.clean)) {
    score = Math.max(score, 28);
    risk = "SUSPICIOUS";
  }

  const flags = unique([
    ...base.flags,
    !registrableDomain ? "Hostname does not appear to contain a legitimate registered domain" : "",
    httpOnly ? "HTTP-only sites can never be marked safe" : "",
    dns.rawStatus === 3 ? "Domain did not resolve in live DNS (possible unregistered or non-existent domain)" : "",
    dns.ok ? "Live DNS resolution confirmed before verdict" : "Live DNS resolution could not be confirmed",
    page.ok ? "Live destination content inspected before verdict" : "Live destination content could not be inspected",
    ...page.warningSignals.map(signal => `Live page signal: ${signal}`),
    ...page.parkedSignals.map(signal => `Live page signal: ${signal}`),
    ...page.redirectSignals.map(signal => `Live page signal: ${signal}`),
    ...page.trackingSignals.map(signal => `Live page signal: ${signal}`),
    page.httpDowngrade ? "Live page attempted to downgrade users from HTTPS to HTTP" : "",
    page.relatedHttpTargets.length ? `Observed HTTP destination(s): ${page.relatedHttpTargets.join(" · ")}` : "",
    page.suspiciousTargetHosts.length
      ? `Live page referenced suspicious redirect host(s): ${page.suspiciousTargetHosts.join(", ")}`
      : "",
    readableSearches.length
      ? `${readableSearches.length} live search source(s) returned readable evidence`
      : "Search sources did not provide readable evidence",
    ...negativeHits.map(term => `Open-web reputation hit: ${term}`),
    risk === "SUSPICIOUS" && score < 55
      ? "Circadian denied a safe verdict because live evidence did not strongly establish legitimacy"
      : ""
  ]);

  const verification = {
    mode: "internet",
    checkedAt: new Date().toISOString(),
    online: true,
    minimumSourcesMet,
    coverage,
    summary: buildVerifiedSummary({ risk, httpOnly, registrableDomain, dns, searchMatches, negativeHits, page }),
    sources,
    dns,
    page,
    search: {
      sources: searchSources,
      matches: readableSearches.length,
      negativeHits,
      positiveHits: positiveSearchHits
    }
  };

  const result = {
    ...base,
    raw,
    score,
    risk,
    confidence: clamp(Math.round(30 + score * 0.45 + coverage * 0.3)),
    flags,
    verification,
    intelligence: buildUrlIntelligence({ risk, base, verification, allowlisted, negativeHits, page })
  };

  return writeCache(cacheKey, result);
}

export async function analyzeManyUrlsWithInternet(urls, customDomains = [], customKeywords = []) {
  return Promise.all(urls.map(url => analyzeUrlWithInternet(url, customDomains, customKeywords)));
}

export async function analyzeEmailWithInternet(payload, customDomains = [], customKeywords = []) {
  const base = analyzeEmail(payload, customDomains, customKeywords);
  const probe = await probeInternetAccess();

  if (!probe.online) {
    return makeUnverifiedResult({
      base,
      raw: `${base.from || ""}\n${base.subject || ""}\n${base.body || ""}`.trim(),
      reason: VERIFICATION_REQUIRED_MESSAGE,
      verification: {
        mode: "email",
        checkedAt: probe.checkedAt,
        online: false,
        minimumSourcesMet: false,
        coverage: 0,
        summary: VERIFICATION_REQUIRED_MESSAGE,
        sources: [probe.source]
      }
    });
  }

  if (!base.scannedLinks?.length) {
    return {
      ...base,
      confidence: clamp(Math.round(36 + base.score * 0.5)),
      verification: {
        mode: "email",
        checkedAt: probe.checkedAt,
        online: true,
        minimumSourcesMet: true,
        coverage: 100,
        summary: "Internet connectivity was confirmed before analysis. No embedded URLs were present for website verification.",
        sources: [probe.source]
      }
    };
  }

  const verifiedLinks = await Promise.all(
    base.scannedLinks.map(async link => {
      const live = await analyzeUrlWithInternet(link.url, customDomains, customKeywords);
      return {
        ...link,
        ...live,
        url: link.url,
        direct: link.direct,
        deob: link.deob,
        flags: unique([...(live.flags || []), ...(link.flags || [])])
      };
    })
  );

  const worstLinkRisk = verifiedLinks.reduce(
    (acc, link) => (RISK_ORDER[link.risk] > RISK_ORDER[acc] ? link.risk : acc),
    "SAFE"
  );
  const allLinksVerified = verifiedLinks.every(link => link.risk !== "UNVERIFIED");
  const maxLinkScore = Math.max(0, ...verifiedLinks.map(link => link.score || 0));
  let score = Math.max(base.score || 0, maxLinkScore);
  if (base.risk === "DANGER") score = Math.max(score, 70);
  if (base.risk === "SUSPICIOUS") score = Math.max(score, 38);
  if (worstLinkRisk === "DANGER") score = Math.max(score, 72);
  if (worstLinkRisk === "SUSPICIOUS") score = Math.max(score, 42);
  if (!allLinksVerified) {
    return makeUnverifiedResult({
      base: { ...base, scannedLinks: verifiedLinks, score },
      reason: "One or more embedded URLs could not be verified on the internet, so the email verdict stays unverified.",
      verification: {
        mode: "email",
        checkedAt: new Date().toISOString(),
        online: true,
        minimumSourcesMet: false,
        coverage: clamp(
          Math.round(
            verifiedLinks.reduce((sum, link) => sum + (link.verification?.coverage || 0), 0) / verifiedLinks.length
          )
        ),
        summary: "At least one embedded URL failed live verification, so Circadian withheld a final verdict.",
        sources: [
          probe.source,
          ...verifiedLinks.flatMap(link => link.verification?.sources || []).slice(0, 12)
        ]
      }
    });
  }

  score = clamp(score);
  const risk = mapScoreToRisk(score);
  const verificationCoverage = clamp(
    Math.round(
      verifiedLinks.reduce((sum, link) => sum + (link.verification?.coverage || 0), 0) / verifiedLinks.length
    )
  );
  const verification = {
    mode: "email",
    checkedAt: new Date().toISOString(),
    online: true,
    minimumSourcesMet: true,
    coverage: verificationCoverage,
    summary: `${verifiedLinks.length} embedded URL${verifiedLinks.length === 1 ? "" : "s"} were live-verified before Circadian issued this email verdict.`,
    sources: [
      probe.source,
      ...verifiedLinks.flatMap(link => link.verification?.sources || []).slice(0, 12)
    ]
  };

  return {
    ...base,
    scannedLinks: verifiedLinks,
    score,
    risk,
    confidence: clamp(Math.round(34 + score * 0.45 + verificationCoverage * 0.25)),
    verification,
    intelligence:
      risk === "UNVERIFIED"
        ? buildUnverifiedIntelligence(verification.summary)
        : base.intelligence
  };
}

export async function gateLocalVerdict(buildResult, label = "scan") {
  const probe = await probeInternetAccess();
  if (!probe.online) {
    return {
      score: 0,
      risk: "UNVERIFIED",
      flags: [VERIFICATION_REQUIRED_MESSAGE],
      confidence: 0,
      verification: {
        mode: "connectivity",
        checkedAt: probe.checkedAt,
        online: false,
        minimumSourcesMet: false,
        coverage: 0,
        summary: VERIFICATION_REQUIRED_MESSAGE,
        sources: [probe.source]
      },
      intelligence: buildUnverifiedIntelligence(`${label} requires internet connectivity before Circadian will issue a final verdict.`)
    };
  }

  const result = buildResult();
  return {
    ...result,
    confidence: clamp(result.confidence ?? Math.round(30 + (result.score || 0) * 0.55)),
    verification: {
      mode: "connectivity",
      checkedAt: probe.checkedAt,
      online: true,
      minimumSourcesMet: true,
      coverage: 100,
      summary: `Internet connectivity was confirmed before this ${label}.`,
      sources: [probe.source]
    }
  };
}

export { VERIFICATION_REQUIRED_MESSAGE };
