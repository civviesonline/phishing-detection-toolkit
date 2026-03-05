PhishGuard SOC Edition

https://img.shields.io/badge/version-1.0.0-blue
https://img.shields.io/badge/React-18.x-61dafb

PhishGuard is a browser-based phishing detection toolkit for security analysts. It combines automated threat scanning with interactive training modules.
✨ Features
Detection Tools

    URL Scanner – Analyzes URLs for suspicious TLDs, brand spoofing, typosquatting, and URL shorteners

    Email Analyzer – Scans email bodies for phishing keywords, urgency language, and suspicious links

    Header Analyzer – Validates SPF, DKIM, DMARC and detects header anomalies

    QR Scanner – Decodes QR codes and analyzes embedded URLs

    Attachment Scorer – Detects malicious filenames (double extensions, executables)

    Homoglyph Detector – Identifies Unicode lookalike attacks

    Bulk Scanner – Processes multiple URLs at once

Training

    Awareness Quiz – 200+ questions on phishing tactics

    Scenario Drills – Timed triage exercises with real-world examples

Customization

    Blocklist Manager – Add custom domains and keywords

🚀 Quick Start
bash

git clone https://github.com/yourusername/phishguard.git
cd phishguard
npm install
npm start

App runs at http://localhost:3000
🛡️ How It Works
Risk Level	Score	Action
SAFE	0-24	No indicators
SUSPICIOUS	25-54	Verify carefully
DANGER	55-100	Do not proceed

Each scan returns:

    Threat score (0-100)

    Color-coded traffic light

    List of specific indicators

    Detailed explanations

🔍 Detection Highlights

    Domains: IP addresses, suspicious TLDs, excessive subdomains, domain age

    Brand Spoofing: Leet substitution, typosquatting, brand impersonation

    Email Auth: SPF/DKIM/DMARC validation, Reply-To mismatches

    Attachments: Executables, macro-enabled files, double extensions

    Infrastructure: GeoIP, DNS records, breach database lookup

🏗️ Tech Stack

    React 18

    Context API

    Web Audio API

    Canvas API

    Levenshtein distance algorithm

    Homoglyph detection

📁 Structure
text

src/
├── App.js
├── components/
│   ├── scanners/     # Detection panels
│   ├── training/      # Quiz & drills
│   └── shared/        # UI components
├── utils/             # Analysis logic
└── data/              # Constants & breach data

⚡ Test Examples
bash

# SAFE
https://google.com
https://github.com/login

# DANGER
http://secure-paypal-verify.xyz/login
https://amaz0n-account-billing-update.click

🔐 Security

    100% client-side – No data sent to external servers

    No tracking or telemetry

    Optional thumbnail previews (can be disabled)

🤝 Contribute

    Fork repo

    Create branch (git checkout -b feature/name)

    Commit changes

    Push and open PR

📄 License

MIT © PhishGuard
