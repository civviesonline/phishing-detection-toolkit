const IGNORE_PHRASES = [
  "conversation opened",
  "skip to content",
  "using gmail",
  "inbox",
  "to me",
  "unsubscribe",
  "reply",
  "forward",
  "sent from my iphone",
  "sent from outlook"
];

const compactLine = line => String(line || "").replace(/\s+/g, " ").trim();

export const normalizeMailText = raw =>
  String(raw || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();

export const cleanDetectedText = raw =>
  normalizeMailText(
    String(raw || "")
      .replace(/[|]{3,}/g, " ")
      .replace(/[ ]{2,}/g, " ")
  );

export function parseRawEmail(raw) {
  const source = normalizeMailText(raw);
  if (!source) return null;

  const lines = source.split("\n");
  let i = 0;
  const headers = {};

  for (; i < lines.length; i++) {
    const line = compactLine(lines[i]);
    if (!line) {
      i += 1;
      break;
    }
    const match = line.match(/^([A-Za-z-]{2,20})\s*:\s*(.*)$/);
    if (!match) {
      if (Object.keys(headers).length > 0) break;
      continue;
    }
    headers[match[1].toLowerCase()] = match[2].trim();
  }

  if (headers.from || headers.subject || headers.date || headers.to || headers["reply-to"]) {
    return {
      from: headers.from || "",
      subject: headers.subject || "",
      body: normalizeMailText(lines.slice(i).join("\n"))
    };
  }

  const clean = lines.map(compactLine).filter(Boolean);
  if (!clean.length) return null;

  const emailMatch = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const explicitFrom = clean.find(line => /^from\b/i.test(line));
  const explicitSubject = clean.find(line => /^subject\b/i.test(line));

  const heurFrom = explicitFrom
    ? explicitFrom.replace(/^from\s*:?\s*/i, "").trim()
    : emailMatch
      ? emailMatch[0]
      : "";

  let heurSubject = explicitSubject ? explicitSubject.replace(/^subject\s*:?\s*/i, "").trim() : "";
  let subjectIdx = explicitSubject ? clean.indexOf(explicitSubject) : -1;

  if (!heurSubject) {
    for (let idx = 0; idx < clean.length; idx++) {
      const line = clean[idx];
      const low = line.toLowerCase();
      if (IGNORE_PHRASES.some(phrase => low.includes(phrase))) continue;
      if (line.includes("@")) continue;
      if (/\b(am|pm)\b/i.test(line) && /\d{1,2}:\d{2}/.test(line)) continue;
      if (line.length > 140) continue;
      heurSubject = line;
      subjectIdx = idx;
      break;
    }
  }

  const bodyStart = subjectIdx >= 0 ? subjectIdx + 1 : 0;
  const heurBody = normalizeMailText(clean.slice(bodyStart).join("\n")) || source;

  if (!heurFrom && !heurSubject && !heurBody) return null;

  return {
    from: heurFrom,
    subject: heurSubject,
    body: heurBody
  };
}

export function buildMailFields(raw) {
  const cleaned = cleanDetectedText(raw);
  const parsed = parseRawEmail(cleaned);
  if (parsed) {
    return {
      raw: cleaned,
      from: parsed.from || "",
      subject: parsed.subject || "",
      body: parsed.body || ""
    };
  }
  return {
    raw: cleaned,
    from: "",
    subject: "",
    body: cleaned
  };
}
