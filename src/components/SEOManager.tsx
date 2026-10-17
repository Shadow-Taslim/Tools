import { useEffect } from 'react';
import { ActiveTool } from '../types.ts';

interface SEOManagerProps {
  activeTool: ActiveTool;
  previewCode?: string;
}

interface MetaData {
  title: string;
  description: string;
  path: string;
  keywords?: string;
}

const TOOL_META_CONFIG: Record<ActiveTool, (previewCode?: string) => MetaData> = {
  home: () => ({
    title: 'QuickNest - Free 3D Privacy Utilities & Developer Tools',
    description: 'QuickNest: High-speed, zero-retention online utilities featuring disposable temporary email, safe URL shortener with link inspection, QR code generator, password builder, and text tools.',
    path: '/',
    keywords: 'privacy tools, disposable email, temp mail, url shortener, qr code generator, password generator, text case converter, word counter'
  }),
  'temp-mail': () => ({
    title: 'Temp Mail - Free Disposable 10-Minute Temporary Email | QuickNest',
    description: 'Generate anonymous, disposable 10-minute temporary email inboxes with real-time inbound delivery. Protect your personal inbox from spam with zero data retention.',
    path: '/temp-mail',
    keywords: 'temp mail, disposable email, 10 minute mail, temporary inbox, anonymous email, throwaway email'
  }),
  'url-shortener': () => ({
    title: 'Secure URL Shortener - Malware & Phishing Protected Links | QuickNest',
    description: 'Shorten long URLs with automated malware detection, phishing heuristics, click analytics, and optional destination preview inspection screens.',
    path: '/url-shortener',
    keywords: 'url shortener, link shortener, safe link, phishing protection, malware scanner, secure url redirect'
  }),
  'security-checker': () => ({
    title: 'Website Health & Security Checker - Headers & SSL Audit | QuickNest',
    description: 'Inspect website HTTP security headers (HSTS, CSP, X-Frame-Options), SSL/TLS certificates, and response latency with Next.js & Cloudflare remediation.',
    path: '/security-checker',
    keywords: 'security checker, http headers audit, hsts check, csp analyzer, website health, nextjs security, cloudflare security'
  }),
  'qr-code': () => ({
    title: 'QR Code Generator - Custom URL, WiFi, vCard & Text Codes | QuickNest',
    description: 'Generate high-density, custom QR codes for websites, WiFi networks, contact cards, emails, and plain text. Download crisp high-resolution PNGs instantly.',
    path: '/qr-code',
    keywords: 'qr code generator, wifi qr code, vcard qr code, free qr creator, high resolution qr code, custom qr'
  }),
  'password-generator': () => ({
    title: 'Password Generator - Cryptographic High-Entropy Passwords | QuickNest',
    description: 'Generate cryptographically secure passwords and memorable Diceware passphrases locally in your browser using the Web Cryptography API. Zero network exposure.',
    path: '/password-generator',
    keywords: 'password generator, passphrase generator, diceware, random password, secure password creator, entropy calculation'
  }),
  'word-counter': () => ({
    title: 'Word Counter - Real-Time Text Statistics & Reading Time | QuickNest',
    description: 'Count words, characters, sentences, paragraphs, and estimated reading time in real time. Inspect detailed character density and keyword metrics.',
    path: '/word-counter',
    keywords: 'word counter, character counter, text statistics, reading time calculator, text analyzer'
  }),
  'text-case': () => ({
    title: 'Text Case Converter - UPPERCASE, lowercase, camelCase & More | QuickNest',
    description: 'Convert text instantly between UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE with one-click export.',
    path: '/text-case',
    keywords: 'text case converter, uppercase converter, camelcase converter, snake_case, pascalcase, kebab-case'
  }),
  preview: (code?: string) => ({
    title: code
      ? `Inspect Link "${code}" - Safe Destination Preview | QuickNest`
      : 'Link Preview & Threat Inspection - Safe Redirection | QuickNest',
    description: 'Inspect shortened destination URLs, HTTP headers, safety status, and potential phishing alerts before navigating to unknown websites.',
    path: code ? `/preview/${code}` : '/preview',
    keywords: 'link preview, url checker, phishing inspection, malware check, safe redirect inspection'
  }),
  architecture: () => ({
    title: 'System Architecture & Engineering Specifications | QuickNest',
    description: 'Explore QuickNest\'s production architecture: PostgreSQL schemas, Redis cache-aside redirect layers, and zero-retention temporary email infrastructure.',
    path: '/architecture',
    keywords: 'software architecture, postgresql schema, redis caching, cloud run, full stack system design'
  }),
  privacy: () => ({
    title: 'Privacy Policy - Zero-Account & Zero-Retention Guarantee | QuickNest',
    description: 'Read the QuickNest privacy commitment: complete anonymity, no user registration, no telemetry tracking, and automated deletion of temporary data.',
    path: '/privacy',
    keywords: 'privacy policy, zero knowledge, zero retention, no tracking, data minimization'
  }),
  terms: () => ({
    title: 'Terms of Service - Acceptable Use & Fair Access | QuickNest',
    description: 'Review terms and conditions for utilizing QuickNest\'s free online utilities, anti-abuse policies, and acceptable use guidelines.',
    path: '/terms',
    keywords: 'terms of service, acceptable use policy, online utilities terms'
  }),
  contact: () => ({
    title: 'Contact Us & Abuse Reporting Center | QuickNest',
    description: 'Report malicious short links, submit feedback, or contact the QuickNest security operations team for swift review and takedown.',
    path: '/contact',
    keywords: 'contact, abuse report, report malicious url, security takedown'
  })
};

export default function SEOManager({ activeTool, previewCode }: SEOManagerProps) {
  useEffect(() => {
    const metaGetter = TOOL_META_CONFIG[activeTool] || TOOL_META_CONFIG.home;
    const meta = metaGetter(previewCode);

    // 1. Update Document Title
    document.title = meta.title;

    // Helper to update or create a meta tag
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create a link tag (e.g. canonical)
    const setLinkTag = (rel: string, href: string) => {
      let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://quicknest.org';
    const canonicalUrl = `${origin}${meta.path}`;

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', meta.description);
    if (meta.keywords) {
      setMetaTag('name', 'keywords', meta.keywords);
    }

    // 3. OpenGraph Social Cards
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'QuickNest');

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:card', 'summary_large_image');

    // 5. Canonical Link
    setLinkTag('canonical', canonicalUrl);
  }, [activeTool, previewCode]);

  return null;
}
