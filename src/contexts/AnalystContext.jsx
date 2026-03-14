import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "phishguard-history";
const PINS_KEY = "phishguard-pins";
const DEFAULT_PINS = ["attack-feed", "incident-card"];

const AnalystCtx = createContext({
  history: [],
  pinned: DEFAULT_PINS,
  addEntry: () => {},
  togglePin: () => {},
  recommendations: []
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

export const AnalystProvider = ({ children }) => {
  const [history, setHistory] = useState(() => readStorage(STORAGE_KEY, []));
  const [pinned, setPinned] = useState(() => readStorage(PINS_KEY, DEFAULT_PINS));

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PINS_KEY, JSON.stringify(pinned));
    }
  }, [pinned]);

  const addEntry = entry => {
    const record = {
      id: `${Date.now()}-${entry.type}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      ...entry
    };
    setHistory(prev => [record, ...prev].slice(0, 60));
  };

  const togglePin = id => {
    setPinned(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const recommendations = useMemo(() => {
    if (!history.length) {
      return ["History is empty. Start scanning to generate adaptive insights."];
    }
    const recs = [];
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
  }, [history]);

  return (
    <AnalystCtx.Provider value={{ history, pinned, addEntry, togglePin, recommendations }}>
      {children}
    </AnalystCtx.Provider>
  );
};

export const useAnalyst = () => useContext(AnalystCtx);
