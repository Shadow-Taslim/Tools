# QuickNest — Next.js + TypeScript Full-Stack App Router

Full-stack Next.js 15+ implementation with React Server Components (`RSC`), Tailwind CSS reusable components, Cloudflare Pages/Workers free-tier deployment, and the **Website Health & Security Checker**.

---

## 🚀 Features

* **Next.js 15 App Router**: Server components for zero-bundle rendering and edge-ready API routes (`runtime = 'edge'`).
* **Website Health & Security Checker (`/checker`)**:
  * Real-time HTTP header auditing (`HSTS`, `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
  * Response latency (TTFB) and SSL/TLS validation.
  * OWASP score and letter grade (A+ through F).
  * SSRF-safe architecture blocking loopback and RFC1918 subnets.
* **Reusable Tailwind CSS Components**:
  * `Button` (`components/ui/button.tsx`) with state loaders and variant styling.
  * `Card` (`components/ui/card.tsx`) with dark-mode glassmorphism.
* **Cloudflare Free-Tier Deployment**:
  * Unlimited requests with `@cloudflare/next-on-pages` and `wrangler.jsonc`.

---

## 🛠️ Local Development

1. Navigate to the Next.js app directory:
   ```bash
   cd nextjs-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Cloudflare Pages Free-Tier Deployment

1. Build the application for Cloudflare Pages:
   ```bash
   npm run pages:build
   ```
2. Deploy to Cloudflare Pages:
   ```bash
   npm run pages:deploy
   ```
   *(Or connect your GitHub repository directly in the Cloudflare Dashboard under **Workers & Pages > Create application > Pages > Connect to Git** with build command `npx @cloudflare/next-on-pages` and output directory `.vercel/output/static`).*
