# QuickNest — 3D Privacy Utilities & Developer Tools

QuickNest is a high-speed, zero-retention online utilities suite featuring disposable temporary email, a malware-protected URL shortener with threat inspection, custom QR code generation, cryptographic password builder, text formatting tools, and real-time 3D spatial computing.

Built with **React**, **TypeScript**, **Tailwind CSS**, **Three.js**, and an **Express** backend.

---

## 🚀 Key Features

### 1. Disposable 10-Minute Temporary Email (`/temp-mail`)
* **Instant Delivery via SSE**: Real-time Server-Sent Events (`/api/email/inbox/:address/stream`) deliver inbound messages in `<15ms`.
* **Zero Cross-User Leakage**: Cryptographically generated collision-free addresses (`crypto.randomBytes`) and per-inbox secret tokens (`tok_...`) ensure strict user isolation.
* **Attachment Support**: Displays and inspects attached files (PDFs, JSON, spreadsheets, documents) with size metadata.
* **Zero Data Retention**: Messages and inboxes automatically sweep and permanently erase upon TTL expiration (10-minute default with +10m extension capability).
* **Production Inbound Webhook**: Ready for Cloudflare Email Routing, SendGrid Inbound Parse, Mailgun, or Postmark forwarding (`POST /api/email/inbound-webhook`).

### 2. Secure URL Shortener & Threat Inspector (`/url-shortener`, `/preview/:code`)
* **Automated Threat Heuristics**: Evaluates URLs against phishing patterns, credential harvesting keywords, and private loopback/RFC1918 subnets (preventing SSRF).
* **Destination Preview Screen**: Inspect original URLs, headers, domain trust, and safety scores before visiting untrusted links.
* **Exact Redirection Target**: Preserves all query parameters, anchors, and path structures verbatim upon redirection.
* **Community Abuse Reporting**: Automatic quarantine threshold (3 flags) disables suspect links pending review.

### 3. High-Density QR Code Generator (`/qr-code`)
* **Multi-Format Support**: Generate codes for URLs, plain text, WiFi access credentials (`WIFI:S:...;P:...;;`), vCards, and `mailto:` links.
* **Unicode & Emoji Compatible**: Full UTF-8 byte stream support for multi-byte emoji and international accents.
* **Export Options**: Instant high-resolution PNG download and one-click clipboard copying.

### 4. Cryptographic Password Suite (`/password-generator`)
* **Browser-Local CSPRNG**: Cryptographically secure pseudo-random generation using the native Web Cryptography API (`window.crypto.getRandomValues`). Zero network transmission.
* **Guaranteed Character Pools**: Guarantees inclusion of uppercase, lowercase, numeric, and symbol characters when selected.
* **Diceware Passphrase Mode**: Generates memorable, high-entropy multi-word passphrases.
* **Granular Controls**: Length slider (4 to 128 characters), ambiguous character exclusion (`1, l, I, 0, O`), specific character exclusions, and deduplicated batch generation (up to 50 passwords).

### 5. Text Case Converter (`/text-case`)
* **10 Simultaneous Formats**: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and dot.case.
* **Unicode Preservation**: Intelligent regex retains punctuation, repeated whitespace, blank lines, accents (`café` → `CAFÉ`), and emoji.

### 6. Real-Time Word & Character Counter (`/word-counter`)
* **Synchronous Live Analysis**: Instant re-calculation on every keystroke, clipboard paste, or deletion.
* **Precise Unicode Counting**: Counts graphemes/code points, non-whitespace characters, letters, digits, sentences, and lines.
* **Cadence & Content Metrics**: Estimated reading time (200 wpm), speaking time (130 wpm), and stopword-filtered keyword frequency analysis.

### 7. Interactive 3D Spatial Canvas
* **Reactive Shaders & Geometry**: Real-time Three.js spatial background with mouse/gyroscope parallax, wireframe rotation, and tool-specific color transitions.

### 8. Dynamic SEO & Schema.org Structured Data
* **Dynamic Head Management (`SEOManager`)**: Updates document titles, meta descriptions, OpenGraph tags, and canonical links per tool.
* **Rich JSON-LD (`SchemaMarkup`)**: Mounts `WebApplication` and `FAQPage` structured data for search engine rich snippets.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (Functional Components, Custom Hooks) |
| **Language** | TypeScript (Strict type checking) |
| **Styling** | Tailwind CSS with custom glassmorphism and theme palettes |
| **3D Rendering** | Three.js (WebGL shaders, procedural geometries) |
| **Icons** | Lucide React |
| **Backend Server** | Node.js with Express |
| **Real-time Engine** | Server-Sent Events (SSE) + Node `EventEmitter` |
| **Data Storage** | In-memory cache-aside store with 10s background TTL sweeper |
| **Build & Bundler** | Vite 6 |

---

## 📦 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/example/quicknest.git
cd quicknest
npm install
```

### Running the Development Server
Starts the full-stack Express server with Vite middleware on port 3000:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

### Running Tests
Execute the unit and multi-user isolation test suite:
```bash
npm test
```

Execute the comprehensive 6-module automated verification suite:
```bash
npx tsx tests/comprehensive_test.ts
```

### Production Build
Build the client bundle and start the production server:
```bash
npm run build
npm start
```

---

## 🔌 API Reference

### Temporary Email
* `GET /api/email/domains` — Retrieve supported disposable domains.
* `POST /api/email/inbox` — Generate a new temporary inbox (`{ customHandle?, domain? }`).
* `GET /api/email/inbox/:address` — Retrieve inbox status, TTL countdown, and message count.
* `GET /api/email/inbox/:address/messages` — Retrieve all messages for an inbox ($O(1)$ indexed).
* `GET /api/email/inbox/:address/stream` — Real-time Server-Sent Events stream for instant mail notifications.
* `POST /api/email/inbox/:address/extend` — Extend inbox expiration timer (+10 mins).
* `DELETE /api/email/inbox/:address` — Permanently wipe inbox and all associated messages.
* `POST /api/email/test-send` — Dispatch test email (supports `verification`, `attachment`, `newsletter`, or custom templates).
* `POST /api/email/inbound-webhook` — Production inbound webhook receiver for email providers.

### URL Shortener
* `POST /api/shorten/shorten` — Shorten URL with automated safety checks (`{ url, customCode?, directRedirect? }`).
* `GET /api/shorten/preview/:code` — Inspect safety metrics, headers, and destination before visiting.
* `GET /s/:code` — Public redirection endpoint (HTTP 302 or preview if flagged).
* `POST /api/shorten/report` — Submit a community safety abuse report.

### System
* `GET /api/stats` — Operational metrics (active inboxes, messages delivered, active links, uptime).

---

## 🛡️ Privacy & Security Commitments

1. **Zero User Tracking**: No user accounts, registration, cookies, telemetry, or tracking scripts.
2. **Local Cryptography**: Password generation takes place entirely client-side via WebCrypto CSPRNG; keys never cross the wire.
3. **Automated Ephemeral Lifecycle**: Inactive inboxes, temporary messages, and expired links are wiped from memory continuously by background sweepers.
4. **SSRF & Phishing Protection**: RFC1918 internal IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`) and known suspicious domains are rejected before short link creation.

---

## 📄 License

MIT License. Free for personal and commercial use.
