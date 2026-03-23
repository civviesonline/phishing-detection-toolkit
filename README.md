# Circadian by PhishGuard

Circadian by PhishGuard is a browser-based 24-hour phishing analysis and training cockpit built with React and Vite. It bundles interactive scanners, analyst-focused insights, and training drills into a single front-end experience.

## Current Modules

### Detection
- URL Scanner: heuristic scoring for suspicious TLDs, spoofing patterns, typosquatting, shorteners, and keywords
- Email Analyzer: body parsing, keyword/urgency detection, URL scanning, and redirect deobfuscation
- QR Scanner: camera or image upload decoding with URL analysis
- Attachment Scorer: filename heuristics for double extensions and risky types
- Homoglyph Detector: Unicode lookalike detection for IDN spoofing
- Bulk Scanner: batch URL scoring

### Training
- Awareness Quiz
- Scenario Drills

### Insights
- Live Attack Feed (simulated)
- Incident Correlation timeline
- Analyst Dashboard (session history, pins, recommendations)
- CLI Log Bridge (copy log line and JSON export)

### Admin
- Blocklist Manager for custom blocklist and allowlist entries

## How Scoring Works
All scanners generate a 0–100 threat score and map it to a risk band:
- SAFE: 0–24
- SUSPICIOUS: 25–54
- DANGER: 55–100

Each scan returns a score, risk label, and a list of indicators. The URL and Email modules also surface deeper context panels and recommendations based on the detected signals.

## Data and Privacy Notes
- Runs entirely in the browser; no backend required.
- DNS/Geo panels and breach checks are simulated using local datasets (no live external lookups).
- Site preview uses third-party screenshot services.
- QR scanning loads `html5-qrcode` from a CDN at runtime.

## Quick Start
```bash
git clone https://github.com/yourusername/phishguard.git
cd phishguard
npm install
npm run dev
```
App runs at `http://127.0.0.1:5173`.

## Scripts
```bash
npm run dev     # start dev server
npm run build   # production build
npm run preview # preview production build
```

## Deployment
Vercel settings that match the current app:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: repository root

## Project Structure
```
src/
  App.jsx
  components/
    scanners/
    training/
    insights/
    shared/
  contexts/
  data/
  utils/
```

## CLI Helper
`./launch-phishguard.sh` can start the dev server and open the app. It also supports:
```bash
./launch-phishguard.sh --scan-log phishguard-cli-log.json
```

## Contributing
- Fork the repo
- Create a feature branch
- Open a PR with a clear description and screenshots where relevant
