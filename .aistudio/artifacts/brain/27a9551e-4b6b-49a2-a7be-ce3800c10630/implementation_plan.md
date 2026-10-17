# Implementation Plan: Next.js App Router + TypeScript Architecture for QuickNest

This plan defines the step-by-step transition of QuickNest into a full-stack **Next.js (App Router)** and **TypeScript** architecture, introducing the new **Website Health & Security Checker** tool, reusable Tailwind CSS components, Cloudflare free-tier deployment compatibility, and preservation of all existing QuickNest tools.

---

## 1. Architecture & Design Principles

* **Framework**: Next.js 15+ (App Router) with React Server Components (`RSC`) for backend execution and Client Components (`"use client"`) for interactive UI.
* **Language & Types**: Strict TypeScript (`tsconfig.json` with strict type checking and path aliases `@/*`).
* **Styling**: Tailwind CSS v4 with custom dark-mode glassmorphism (`slate-950` backgrounds, `cyan-400` accents, `border-slate-800`).
* **Deployment Target**: Cloudflare Pages / Workers (Edge runtime compatible, zero cold starts, free tier with unlimited requests).
* **Initial Flagship Feature**: **Website Health & Security Checker** (`/checker` route):
  * Real-time HTTP/HTTPS latency and response code metrics.
  * Security header audit (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
  * SSL/TLS certificate validity & protocol detection.
  * Safe Browsing / Phishing risk heuristic evaluation (leveraging QuickNest's existing anti-abuse engine).
  * Instant security grade calculation (A+ through F) with actionable remediation steps.

---

## 2. Directory & Code Structure

```text
quicknest-nextjs/
├── app/
│   ├── layout.tsx                 # Root layout with SEO metadata, fonts, Navbar & Footer
│   ├── page.tsx                   # Landing page showcasing all privacy & developer tools
│   ├── checker/
│   │   ├── page.tsx               # Website Health & Security Checker (Server + Client UI)
│   │   └── client.tsx             # Interactive audit runner, gauge meters, and grade breakdown
│   ├── email/
│   │   └── page.tsx               # Disposable 10-Minute Email tool (adapted for Next.js)
│   ├── shortener/
│   │   ├── page.tsx               # Secure URL Shortener tool
│   │   └── [code]/page.tsx        # Dynamic route for destination inspection / preview
│   ├── qrcode/
│   │   └── page.tsx               # QR Code Generator tool
│   ├── password/
│   │   └── page.tsx               # Cryptographic Password Suite tool
│   ├── text/
│   │   ├── case/page.tsx          # Case Converter & Formatter
│   │   └── counter/page.tsx       # Word & Character Counter
│   ├── api/
│   │   ├── checker/route.ts       # Edge-ready API route analyzing headers, DNS & TLS
│   │   ├── email/route.ts         # Inboxes and SSE streaming endpoints
│   │   └── shorten/route.ts       # Link creation and quarantine checks
│   ├── s/[code]/route.ts          # High-speed 302 short link redirector
│   └── globals.css                # Tailwind CSS imports and custom utility styles
├── components/
│   ├── ui/                        # Reusable atomic UI components
│   │   ├── button.tsx             # Standard, gradient, and ghost button variants
│   │   ├── card.tsx               # Dark glassmorphic container cards
│   │   ├── input.tsx              # Accessible inputs with focus rings & prefix icons
│   │   ├── badge.tsx              # Unboxed metadata and security grade indicators
│   │   └── modal.tsx              # Portal-based modal dialogs
│   ├── layout/
│   │   ├── navbar.tsx             # Responsive header navigation
│   │   └── footer.tsx             # Footer with system links and open architecture specs
│   ├── visual/
│   │   └── spatial-canvas.tsx     # Client-side 3D WebGL background (lazy-loaded)
│   └── checker/
│       ├── security-score.tsx     # Circular SVG score gauge (A+ to F)
│       ├── header-audit-list.tsx  # Detailed inspection card for all 6 security headers
│       └── latency-indicator.tsx  # Server TTFB and connection timing bars
├── lib/
│   ├── checker/
│   │   ├── scanner.ts             # Header inspection and scoring algorithm
│   │   └── rules.ts               # OWASP and security header benchmarks
│   ├── store.ts                   # Hybrid persistence layer (MongoDB + edge memory)
│   └── malware.ts                 # Ported SSRF and phishing detection heuristics
├── public/                        # Static assets, icons, and favicon
├── next.config.ts                 # Next.js config with edge/Cloudflare export options
├── tailwind.config.ts             # Tailwind design tokens and theme extensions
├── tsconfig.json                  # Next.js strict TypeScript configuration
└── package.json                   # Dependencies: next, react, lucide-react, tailwindcss
```

---

## 3. Implementation Steps

### Step 1: Dependencies & Configuration
* Configure `package.json` with `next`, `react`, `react-dom`, `lucide-react`, `tailwindcss`, and `@cloudflare/next-on-pages` (optional dev dependency for local Cloudflare preview).
* Set up `next.config.ts`:
  ```typescript
  import type { NextConfig } from 'next';
  const nextConfig: NextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ['mongoose'], // For MongoDB compatibility
  };
  export default nextConfig;
  ```

### Step 2: Reusable UI Component Library (`components/ui/`)
* Build modular, accessible components adhering to anti-slop guidelines:
  * **`Button`**: Keyboard accessible, loading spinners, touch target $\ge 40\text{px}$.
  * **`Card`**: 1px subtle slate borders, dark glass backdrop, zero card-in-card nesting.
  * **`Input`**: Clear contrast placeholder, active cyan ring, prefix icon support.
  * **`Badge`**: Unboxed semantic text with status indicators (`font-mono`, tabular figures).

### Step 3: Initial Feature — Website Health & Security Checker
1. **Server Route (`app/api/checker/route.ts`)**:
   * Accepts `{ url: string }`.
   * Enforces SSRF protection: validates against private IP ranges (`10.0.0.0/8`, `127.0.0.1`, `192.168.0.0/16`).
   * Fetches target URL with precise timing measurement (DNS, TCP, TTFB).
   * Parses response headers:
     * `Strict-Transport-Security` (max-age $\ge$ 31536000, `includeSubDomains`, `preload`).
     * `Content-Security-Policy` (evaluates default-src, script-src, object-src).
     * `X-Frame-Options` (`DENY` or `SAMEORIGIN`).
     * `X-Content-Type-Options` (`nosniff`).
     * `Referrer-Policy` (`strict-origin-when-cross-origin`).
     * `Permissions-Policy` (camera, microphone, geolocation restrictions).
   * Computes an overall weighted security score (0–100) and letter grade (A+, A, B, C, D, F).
2. **Client Page & Dashboard (`app/checker/page.tsx` & `client.tsx`)**:
   * Search input with popular one-click presets (e.g. `google.com`, `github.com`, `cloudflare.com`).
   * Circular SVG grade gauge displaying overall posture.
   * Interactive breakdown list showing **Passed**, **Warnings**, and **Failed** security checks with copyable Nginx, Apache, and Cloudflare configuration snippets to fix missing headers.

### Step 4: Porting Existing QuickNest Features
* **Disposable Email** (`app/email/` & `app/api/email/`):
  * Migrate SSE streaming endpoint to Next.js `ReadableStream` response.
  * Maintain 10-minute countdown with the previously implemented retry-only-on-expiration UX rule.
* **URL Shortener** (`app/shortener/` & `app/s/[code]/`):
  * High-speed Next.js redirect route with threat heuristic evaluation.
* **Password Suite & QR Code Generator** (`app/password/`, `app/qrcode/`):
  * Client components utilizing Web Crypto API and client-side canvas/SVG rendering.

### Step 5: Cloudflare Free-Tier Deployment Options
* **Option A: Cloudflare Pages with Next.js Edge Runtime**:
  * Run `npx @cloudflare/next-on-pages` to build Edge-compatible serverless functions.
  * Compatible with Cloudflare Pages free tier (unlimited requests, 500 builds/month).
* **Option B: Node.js Container / Standalone Server**:
  * Set `output: 'standalone'` in `next.config.ts` for deployment on Cloud Run or container hosts.

---

## 4. Verification & Testing Plan

1. **Type & Compilation Validation**:
   * `next build` / `tsc --noEmit` validation ensuring zero type mismatches.
2. **Checker Feature Verification**:
   * Test with domains that have A+ configurations (e.g. `github.com`) and domains missing security headers to verify grade accuracy.
   * Verify SSRF protection correctly blocks loopback (`127.0.0.1`) and RFC1918 subnets.
3. **Responsive UI & Accessibility Audit**:
   * Verify contrast ratios, keyboard navigation (Tab/Enter), and mobile responsiveness across 320px–1440px viewports.
