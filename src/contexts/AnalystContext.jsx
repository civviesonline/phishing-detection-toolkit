import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "circadian-history";
const PINS_KEY = "circadian-pins";
const CASES_KEY = "circadian-cases";
const LEGACY_STORAGE_KEY = "phishguard-history";
const LEGACY_PINS_KEY = "phishguard-pins";
const LEGACY_CASES_KEY = "phishguard-cases";
const DEFAULT_PINS = ["attack-feed", "incident-card", "caseboard"];
const RISK_ORDER = { SAFE: 0, SUSPICIOUS: 1, DANGER: 2 };
const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 };
const DEFAULT_CASE_STATS = { active: 0, new: 0, investigating: 0, contained: 0, closed: 0 };

const AnalystCtx = createContext({
  history: [],
  cases: [],
  pinned: DEFAULT_PINS,
  addEntry: () => {},
  promoteToCase: () => {},
  updateCase: () => {},
  togglePin: () => {},
  recommendations: [],
  caseStats: DEFAULT_CASE_STATS,
  findCaseForEntry: () => null
});

const readStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const readStorageWithLegacy = (key, legacyKey, fallback) => {
  const current = readStorage(key, null);
  if (current !== null) return current;
  return readStorage(legacyKey, fallback);
};

const trimValue = value => String(value || "").trim();

const getCaseSubject = entry =>
  trimValue(
    entry?.domain ||
      entry?.filename ||
      entry?.summary ||
      entry?.detail?.from ||
      entry?.detail?.raw ||
      "Analyst signal"
  );

const buildCaseSignature = entry => `${entry?.type || "scan"}:${getCaseSubject(entry).toLowerCase()}`;

const getPriority = entry => {
  const score = entry?.score ?? 0;
  if (entry?.risk === "DANGER") return score >= 85 ? "P1" : "P2";
  if (entry?.risk === "SUSPICIOUS") return "P3";
  return "P4";
};

const strongerRisk = (left, right) => (RISK_ORDER[right] > RISK_ORDER[left] ? right : left);

const higherPriority = (left, right) => (PRIORITY_ORDER[right] < PRIORITY_ORDER[left] ? right : left);

const makeCaseTitle = entry => {
  const subject = getCaseSubject(entry);
  const safeSubject = subject.length > 58 ? `${subject.slice(0, 58)}…` : subject;
  return `${(entry?.type || "scan").toUpperCase()} · ${safeSubject}`;
};

const makeCaseRecord = (entry, mode = "manual") => {
  const now = Date.now();
  return {
    id: `case-${now}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    lastSignalAt: now,
    title: makeCaseTitle(entry),
    type: entry?.type || "scan",
    risk: entry?.risk || "SAFE",
    score: entry?.score ?? 0,
    domain: entry?.domain || entry?.filename || "",
    summary: trimValue(entry?.summary || entry?.domain || entry?.filename || entry?.detail?.from || "Signal captured"),
    status: "new",
    owner: mode === "auto" ? "SOC Queue" : "Unassigned",
    priority: getPriority(entry),
    notes: mode === "auto" ? "Auto-opened from a DANGER scan." : "Promoted by analyst.",
    signature: buildCaseSignature(entry),
    sourceEntryIds: entry?.id ? [entry.id] : [],
    signalCount: 1
  };
};

const upsertCase = (cases, entry, mode = "manual") => {
  const signature = buildCaseSignature(entry);
  const existing = cases.find(
    item => item.status !== "closed" && (item.sourceEntryIds?.includes(entry?.id) || item.signature === signature)
  );

  if (!existing) {
    return [makeCaseRecord(entry, mode), ...cases];
  }

  const nextIds = entry?.id
    ? Array.from(new Set([...(existing.sourceEntryIds || []), entry.id]))
    : existing.sourceEntryIds || [];

  return cases.map(item => {
    if (item.id !== existing.id) return item;
    return {
      ...item,
      updatedAt: Date.now(),
      lastSignalAt: Date.now(),
      title: makeCaseTitle(entry),
      risk: strongerRisk(item.risk || "SAFE", entry?.risk || "SAFE"),
      score: Math.max(item.score ?? 0, entry?.score ?? 0),
      domain: entry?.domain || entry?.filename || item.domain || "",
      summary: trimValue(entry?.summary || item.summary || entry?.domain || entry?.filename || "Signal captured"),
      priority: higherPriority(item.priority || "P4", getPriority(entry)),
      sourceEntryIds: nextIds,
      signalCount: nextIds.length || item.signalCount || 1
    };
  });
};

export const AnalystProvider = ({ children }) => {
  const [history, setHistory] = useState(() => readStorageWithLegacy(STORAGE_KEY, LEGACY_STORAGE_KEY, []));
  const [pinned, setPinned] = useState(() => readStorageWithLegacy(PINS_KEY, LEGACY_PINS_KEY, DEFAULT_PINS));
  const [cases, setCases] = useState(() => readStorageWithLegacy(CASES_KEY, LEGACY_CASES_KEY, []));

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PINS_KEY, JSON.stringify(pinned));
      window.localStorage.removeItem(LEGACY_PINS_KEY);
    }
  }, [pinned]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CASES_KEY, JSON.stringify(cases));
      window.localStorage.removeItem(LEGACY_CASES_KEY);
    }
  }, [cases]);

  const addEntry = entry => {
    const record = {
      id: `${Date.now()}-${entry.type}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      ...entry
    };
    setHistory(prev => [record, ...prev].slice(0, 60));
    if (record.risk === "DANGER") {
      setCases(prev => upsertCase(prev, record, "auto"));
    }
  };

  const promoteToCase = entry => {
    if (!entry) return;
    setCases(prev => upsertCase(prev, entry, "manual"));
  };

  const updateCase = (caseId, updates) => {
    setCases(prev =>
      prev.map(item => {
        if (item.id !== caseId) return item;
        const nextPatch = typeof updates === "function" ? updates(item) : updates;
        return {
          ...item,
          ...nextPatch,
          updatedAt: Date.now()
        };
      })
    );
  };

  const togglePin = id => {
    setPinned(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const caseStats = useMemo(
    () =>
      cases.reduce(
        (acc, item) => {
          if (item.status === "closed") {
            acc.closed += 1;
          } else {
            acc.active += 1;
          }
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { ...DEFAULT_CASE_STATS }
      ),
    [cases]
  );

  const findCaseForEntry = entry => {
    if (!entry) return null;
    const signature = buildCaseSignature(entry);
    return (
      cases.find(
        item => item.status !== "closed" && (item.sourceEntryIds?.includes(entry.id) || item.signature === signature)
      ) || null
    );
  };

  const recommendations = useMemo(() => {
    if (!history.length && !cases.length) {
      return ["History is empty. Start scanning to generate adaptive insights."];
    }
    const recs = [];
    if (caseStats.new > 0) {
      recs.push(`${caseStats.new} case${caseStats.new === 1 ? "" : "s"} waiting triage—assign an owner in the analyst caseboard.`);
    }
    if (caseStats.active > 3) {
      recs.push("Open case volume is rising—contain low-effort wins first so the queue stays manageable.");
    }
    const dangerRatio = history.filter(item => item.risk === "DANGER").length / history.length;
    if (dangerRatio > 0.4) {
      recs.push("Dangerous hits are frequent—run a ‘Simulation Lab’ drill and review blocked domains.");
    }
    if (history.some(item => item.domain?.endsWith(".xyz") || item.summary?.toLowerCase()?.includes("typo"))) {
      recs.push("You keep hunting low-rated TLDs—revisit the typosquatting training module.");
    }
    const focus = [...new Set(history.slice(0, 6).map(item => item.type))];
    if (focus.includes("qr") && !focus.includes("email")) {
      recs.push("QR scans dominate recent history—consider bulk URL analysis to balance coverage.");
    }
    if (!recs.length) {
      recs.push("Keep an eye on the live feed—new indicators are streaming through the SOC surface.");
    }
    return recs.slice(0, 3);
  }, [history, cases, caseStats]);

  return (
    <AnalystCtx.Provider
      value={{
        history,
        cases,
        pinned,
        addEntry,
        promoteToCase,
        updateCase,
        togglePin,
        recommendations,
        caseStats,
        findCaseForEntry
      }}
    >
      {children}
    </AnalystCtx.Provider>
  );
};

export const useAnalyst = () => useContext(AnalystCtx);
