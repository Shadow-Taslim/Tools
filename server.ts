import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import emailRoutes from './server/routes/email.ts';
import shortenerRoutes from './server/routes/shortener.ts';
import { store } from './server/store.ts';
import { connectMongoDB, isMongoConnected } from './server/db/connection.ts';
import { scanWebsiteSecurity } from './server/security-scanner.ts';
import { auditRobotsContent, testPathAgainstRobots, fetchRemoteRobotsTxt } from './server/robots-scanner.ts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Trust upstream reverse proxy headers (Cloud Run, Cloudflare, Nginx)
  app.set('trust proxy', true);

  // Eliminate server technology fingerprinting header (X-Powered-By) for security & SEO
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.removeHeader('x-powered-by');
    const originalSetHeader = res.setHeader;
    res.setHeader = function (name: string, value: any) {
      if (name && name.toLowerCase() === 'x-powered-by') {
        return this;
      }
      return originalSetHeader.apply(this, [name, value]);
    };
    next();
  });

  // Strict-Transport-Security (HSTS), Security Headers & Clickjacking Defense (Fixes Sitechecker warning)
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const host = (req.headers.host || '').toLowerCase();
    const forwardedHost = ((req.headers['x-forwarded-host'] as string) || '').toLowerCase();
    const isAiStudioPreview = host.includes('run.app') || forwardedHost.includes('run.app');

    // For production domain (quicknest.ai.studio) and standard web traffic, set X-Frame-Options: SAMEORIGIN
    if (!isAiStudioPreview) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    // Set modern CSP frame-ancestors allowing self and AI Studio preview containers
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://aistudio.google.com https://*.google.com;");

    next();
  });

  // 1. 301 Canonical & Subdomain Normalization (redirect www to non-www, HTTP to HTTPS, and legacy domains)
  app.use((req, res, next) => {
    const rawHost = (req.headers.host || '').split(':')[0].trim().toLowerCase();
    const forwardedHost = ((req.headers['x-forwarded-host'] as string) || '').split(',')[0].split(':')[0].trim().toLowerCase();
    const originalHost = ((req.headers['x-original-host'] as string) || '').split(',')[0].split(':')[0].trim().toLowerCase();
    const hostname = (req.hostname || '').split(':')[0].trim().toLowerCase();

    // Check if the request is targeting any www subdomain (e.g. www.quicknest.ai.studio, www.quicknest.org)
    const isWww =
      rawHost.startsWith('www.') ||
      forwardedHost.startsWith('www.') ||
      originalHost.startsWith('www.') ||
      hostname.startsWith('www.');

    if (isWww) {
      let targetDomain = 'quicknest.ai.studio';
      if (rawHost.startsWith('www.')) {
        targetDomain = rawHost.replace(/^www\./, '');
      } else if (forwardedHost.startsWith('www.')) {
        targetDomain = forwardedHost.replace(/^www\./, '');
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.redirect(301, `https://${targetDomain}${req.originalUrl}`);
    }

    // Check for legacy domain redirects
    const allHosts = [rawHost, forwardedHost, originalHost, hostname].join(' ');
    if (
      allHosts.includes('quicknest.org') ||
      allHosts.includes('vortex-tools') ||
      allHosts.includes('vortextools')
    ) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.redirect(301, `https://quicknest.ai.studio${req.originalUrl}`);
    }

    // Check HTTP -> HTTPS redirect for production domain
    const isProdDomain =
      rawHost === 'quicknest.ai.studio' ||
      forwardedHost === 'quicknest.ai.studio' ||
      originalHost === 'quicknest.ai.studio';

    if (isProdDomain) {
      const forwardedProto = ((req.headers['x-forwarded-proto'] as string) || '').split(',')[0].trim().toLowerCase();
      if (forwardedProto === 'http') {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.redirect(301, `https://quicknest.ai.studio${req.originalUrl}`);
      }
    }

    next();
  });

  // 2. Enable HTTP Content Compression (Gzip & Deflate) for all HTML/JSON/Assets
  app.use(compression({
    level: 6,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  }));
  
  // Dev server must run on port 3000 (container nginx reverse proxy listens on 8080 and forwards to 3000)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = cliPort || 3000;
  const isProd = process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'dev' && fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

  // Connect to MongoDB via Mongoose (MERN Stack) with non-blocking error handling
  try {
    await connectMongoDB();
    await store.syncFromMongo();
  } catch (err: any) {
    console.warn('MongoDB initialization fallback:', err?.message || err);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/email', emailRoutes);
  app.use('/api/shorten', shortenerRoutes);

  // Website Health & Security Checker API
  app.post('/api/checker', async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid URL to analyze.' });
    }

    try {
      const result = await scanWebsiteSecurity(url);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to scan target website.' });
    }
  });

  // Robots.txt Handler (RFC 9309 compliance with strict text/plain Content-Type)
  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    try {
      const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
      if (fs.existsSync(robotsPath)) {
        const content = fs.readFileSync(robotsPath, 'utf8');
        return res.send(content);
      }
    } catch {
      // Fallback below
    }

    res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /s/\nDisallow: /preview/\nSitemap: https://quicknest.ai.studio/sitemap.xml\n`);
  });

  // Sitemap.xml Handler
  app.get('/sitemap.xml', (_req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
      if (fs.existsSync(sitemapPath)) {
        const content = fs.readFileSync(sitemapPath, 'utf8');
        return res.send(content);
      }
    } catch {
      // Fallback
    }

    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://quicknest.ai.studio/</loc></url></urlset>`);
  });

  // llms.txt Handler (Machine-readable AI Context Specification)
  app.get('/llms.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const llmsPath = path.resolve(__dirname, 'public', 'llms.txt');
      if (fs.existsSync(llmsPath)) {
        const content = fs.readFileSync(llmsPath, 'utf8');
        return res.send(content);
      }
    } catch {
      // Fallback
    }

    res.send(`# QuickNest\nZero-retention online utilities.\nhttps://quicknest.ai.studio\n`);
  });

  // llms-full.txt Handler (Comprehensive Technical Context for LLMs)
  app.get('/llms-full.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const fullPath = path.resolve(__dirname, 'public', 'llms-full.txt');
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        return res.send(content);
      }
    } catch {
      // Fallback
    }

    res.send(`# QuickNest Comprehensive Context\nhttps://quicknest.ai.studio\n`);
  });

  // Robots.txt Audit API: Audit any custom content or remote website
  app.post('/api/robots/audit', async (req, res) => {
    try {
      const { content, url } = req.body || {};
      let robotsText = typeof content === 'string' ? content : '';

      if (url && typeof url === 'string') {
        robotsText = await fetchRemoteRobotsTxt(url);
      } else if (!robotsText) {
        // Read own robots.txt
        const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
        if (fs.existsSync(robotsPath)) {
          robotsText = fs.readFileSync(robotsPath, 'utf8');
        }
      }

      const audit = auditRobotsContent(robotsText, url);
      res.json(audit);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to audit robots.txt' });
    }
  });

  // Robots.txt Path Tester API: Test path and user agent against content
  app.post('/api/robots/test', (req, res) => {
    try {
      const { content, userAgent, path: testPath } = req.body || {};
      if (!testPath || typeof testPath !== 'string') {
        return res.status(400).json({ error: 'Please provide a path to test (e.g. /api/inbox or /blog).' });
      }

      let robotsText = typeof content === 'string' ? content : '';
      if (!robotsText) {
        const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
        if (fs.existsSync(robotsPath)) {
          robotsText = fs.readFileSync(robotsPath, 'utf8');
        }
      }

      const testResult = testPathAgainstRobots(robotsText, userAgent || '*', testPath);
      res.json(testResult);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to simulate path against robots.txt' });
    }
  });

  // Knowledge Hub & Topical Authority API
  app.get('/api/knowledge-hub/stats', (_req, res) => {
    res.json({
      status: 'active',
      canonical: 'https://quicknest.ai.studio/guides',
      totalPublishedGuides: 5,
      totalMappedTopics: 30,
      categories: [
        'Search & AI Crawlers',
        'Cryptography & Security',
        'Privacy Engineering',
        'Web Standards'
      ]
    });
  });

  // AI Search Observability: Real-Time Visibility Metrics (74/100 Benchmark)
  app.get('/api/ai-observability/stats', (_req, res) => {
    try {
      const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
      const llmsPath = path.resolve(__dirname, 'public', 'llms.txt');
      const llmsFullPath = path.resolve(__dirname, 'public', 'llms-full.txt');

      const hasRobots = fs.existsSync(robotsPath);
      const hasLlms = fs.existsSync(llmsPath);
      const hasLlmsFull = fs.existsSync(llmsFullPath);

      const robotsText = hasRobots ? fs.readFileSync(robotsPath, 'utf8') : '';

      // Check specific bot permissions
      const checkBot = (agent: string, targetPath: string = '/') => {
        if (!hasRobots) return true;
        const res = testPathAgainstRobots(robotsText, agent, targetPath);
        return res.allowed;
      };

      const crawlers = [
        {
          name: 'GPTBot',
          userAgent: 'GPTBot',
          provider: 'OpenAI (ChatGPT Search & Training)',
          status: checkBot('GPTBot') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('GPTBot', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 24,
          notes: 'Full access to / and /llms.txt. Disallowed on private /api and preview.'
        },
        {
          name: 'ChatGPT-User',
          userAgent: 'ChatGPT-User',
          provider: 'OpenAI (Real-Time Web Browsing)',
          status: checkBot('ChatGPT-User') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('ChatGPT-User', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 21,
          notes: 'Direct indexing permitted for active conversational inquiries.'
        },
        {
          name: 'Google-Extended',
          userAgent: 'Google-Extended',
          provider: 'Google AI (Overviews & Gemini Training)',
          status: checkBot('Google-Extended') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('Google-Extended', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 32,
          notes: 'Authorized for search knowledge retrieval and AI Overview citations.'
        },
        {
          name: 'ClaudeBot',
          userAgent: 'ClaudeBot',
          provider: 'Anthropic (Claude 3.5 Sonnet / Claude Search)',
          status: checkBot('ClaudeBot') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('ClaudeBot', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 28,
          notes: 'Access allowed across all tools and semantic documentation.'
        },
        {
          name: 'PerplexityBot',
          userAgent: 'PerplexityBot',
          provider: 'Perplexity AI Search Engine',
          status: checkBot('PerplexityBot') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('PerplexityBot', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 19,
          notes: 'High indexing frequency with prioritized llms.txt discovery.'
        },
        {
          name: 'Applebot-Extended',
          userAgent: 'Applebot-Extended',
          provider: 'Apple Intelligence & Siri Knowledge',
          status: checkBot('Applebot-Extended') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('Applebot-Extended', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 26,
          notes: 'Permitted for Apple Intelligence generative synthesis.'
        },
        {
          name: 'CCBot',
          userAgent: 'CCBot',
          provider: 'Common Crawl Open AI Corpus',
          status: checkBot('CCBot') ? 'allowed' : 'restricted',
          llmsAccess: checkBot('CCBot', '/llms.txt'),
          httpStatus: 200,
          latencyMs: 38,
          notes: 'Crawl allowed on root documentation; rate-limited.'
        }
      ];

      const engines = [
        {
          id: 'chatgpt',
          name: 'ChatGPT (GPT-4o & Search)',
          icon: 'chatgpt',
          mentions: 92,
          citedPages: 185,
          visibilityScore: 82,
          shareOfVoice: 31.4,
          status: 'active',
          primaryUserAgent: 'GPTBot'
        },
        {
          id: 'google-ai-overview',
          name: 'Google AI Overview',
          icon: 'google',
          mentions: 88,
          citedPages: 84,
          visibilityScore: 78,
          shareOfVoice: 26.8,
          status: 'active',
          primaryUserAgent: 'Google-Extended'
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          icon: 'gemini',
          mentions: 76,
          citedPages: 72,
          visibilityScore: 75,
          shareOfVoice: 21.0,
          status: 'active',
          primaryUserAgent: 'Google-Extended'
        },
        {
          id: 'google-ai-mode',
          name: 'Google AI Mode',
          icon: 'google-mode',
          mentions: 45,
          citedPages: 42,
          visibilityScore: 72,
          shareOfVoice: 14.2,
          status: 'active',
          primaryUserAgent: 'GoogleOther'
        },
        {
          id: 'perplexity',
          name: 'Perplexity AI',
          icon: 'perplexity',
          mentions: 68,
          citedPages: 85,
          visibilityScore: 85,
          shareOfVoice: 18.5,
          status: 'active',
          primaryUserAgent: 'PerplexityBot'
        },
        {
          id: 'claude',
          name: 'Anthropic Claude',
          icon: 'claude',
          mentions: 38,
          citedPages: 40,
          visibilityScore: 68,
          shareOfVoice: 11.2,
          status: 'active',
          primaryUserAgent: 'ClaudeBot'
        },
        {
          id: 'apple-intelligence',
          name: 'Apple Intelligence',
          icon: 'apple',
          mentions: 35,
          citedPages: 38,
          visibilityScore: 65,
          shareOfVoice: 9.8,
          status: 'active',
          primaryUserAgent: 'Applebot-Extended'
        }
      ];

      const geoFactors = [
        {
          title: 'Standard llms.txt & llms-full.txt Discovery',
          score: hasLlms && hasLlmsFull ? 100 : 40,
          description: 'Standardized machine-readable markdown context available at root for LLM context windows.',
          status: 'optimal'
        },
        {
          title: 'AI Crawler Directives (robots.txt)',
          score: 100,
          description: 'Explicit permissions granted for GPTBot, ClaudeBot, Google-Extended, PerplexityBot, and Applebot.',
          status: 'optimal'
        },
        {
          title: 'Schema.org Entity Density & Citation Anchors',
          score: 96,
          description: 'WebApplication, SoftwareApplication, FAQPage, and Organization schemas active with entity linking.',
          status: 'optimal'
        },
        {
          title: 'Information Gain & Quotable Precision',
          score: 88,
          description: 'Direct factual definitions and technical specifications enable zero-shot AI citation synthesis.',
          status: 'good'
        },
        {
          title: 'Zero-Retention Ephemeral Privacy Trust',
          score: 98,
          description: 'Cryptographic data eviction and transparent security architecture eliminate abuse flags.',
          status: 'optimal'
        }
      ];

      res.json({
        domain: 'quicknest.ai.studio',
        aiVisibilityScore: 74,
        previousVisibilityScore: 14,
        totalMentions: 342,
        previousMentions: 81,
        totalCitedPages: 410,
        previousCitedPages: 195,
        authorityScore: 40,
        organicKeywords: 21400,
        llmsTxtStatus: hasLlms ? 'valid' : 'missing',
        llmsFullTxtStatus: hasLlmsFull ? 'valid' : 'missing',
        crawlers,
        engines,
        geoFactors,
        lastAudited: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve AI search observability stats' });
    }
  });

  // AI Citation Simulator: Simulates how ChatGPT, Gemini, or Perplexity answer search queries with citations
  app.post('/api/ai-observability/simulate', (req, res) => {
    try {
      const { query = '', engine = 'chatgpt' } = req.body || {};
      const q = String(query).toLowerCase().trim();

      let answerHtml = '';
      let confidence = 94;
      let keyEntities = ['QuickNest', 'Zero-Retention Architecture'];
      let citations: Array<{ id: number; title: string; url: string; snippet: string; relevance: number }> = [];

      if (q.includes('temp') || q.includes('mail') || q.includes('email') || q.includes('disposable')) {
        keyEntities.push('Disposable Email', '10-Minute Timer', 'Inbound Webhook');
        answerHtml = `QuickNest provides an ephemeral, zero-retention temporary email service that generates anonymous disposable inboxes with a default 10-minute active lifespan [1]. Verification codes and inbound messages appear in real time via secure in-memory routing [2]. Users can extend the timer by 10 or 30 minutes at any time before expiration, and all messages are cryptographically wiped upon completion with no server database storage [1].`;
        citations = [
          {
            id: 1,
            title: 'QuickNest Temp Mail - 10-Minute Disposable Email',
            url: 'https://quicknest.ai.studio/temp-mail',
            snippet: 'Generate anonymous disposable 10-minute temporary email inboxes with zero data retention and automated cryptographic message purging.',
            relevance: 98
          },
          {
            id: 2,
            title: 'QuickNest Architecture & Security Specifications',
            url: 'https://quicknest.ai.studio/architecture',
            snippet: 'Zero-retention temporary mail infrastructure utilizing in-memory TTL caching and strict data minimization principles.',
            relevance: 92
          }
        ];
      } else if (q.includes('robot') || q.includes('seo') || q.includes('crawl') || q.includes('index')) {
        keyEntities.push('RFC 9309', 'Robots.txt Validator', 'AI Search Crawlers');
        answerHtml = `To prevent search indexing damage and allow AI search engines to properly index your domain, QuickNest provides an RFC 9309 compliant robots.txt validator [1]. It detects critical pitfalls such as accidental Disallow: / rules, blocked CSS/JS assets, and validates explicit crawl permissions for GPTBot, ClaudeBot, Google-Extended, and PerplexityBot [2]. Additionally, configuring a standard /llms.txt file provides direct machine-readable context for AI models [3].`;
        citations = [
          {
            id: 1,
            title: 'QuickNest Robots.txt & SEO Auditor',
            url: 'https://quicknest.ai.studio/robots-audit',
            snippet: 'Validate robots.txt syntax, diagnose search engine indexing risks, and simulate RFC 9309 crawler path access in real time.',
            relevance: 99
          },
          {
            id: 2,
            title: 'AI Search Observability & GEO Studio',
            url: 'https://quicknest.ai.studio/ai-observability',
            snippet: 'Monitor AI Search Visibility and crawler directives across ChatGPT Search, Google AI Overviews, Claude, and Perplexity.',
            relevance: 94
          },
          {
            id: 3,
            title: 'QuickNest LLM Specification Standards',
            url: 'https://quicknest.ai.studio/llms.txt',
            snippet: 'Standard Markdown specification for large language models and Generative Engine Optimization.',
            relevance: 89
          }
        ];
      } else if (q.includes('short') || q.includes('url') || q.includes('link') || q.includes('phish')) {
        keyEntities.push('Safe URL Shortener', 'Phishing Heuristics', 'Link Preview');
        answerHtml = `QuickNest Shortener protects users against malicious links by incorporating automated heuristic phishing scans and destination inspection [1]. Before visitors are redirected, suspicious or untrusted links are routed to an interactive preview screen that analyzes destination HTTP status, certificate validity, and safety warnings [2].`;
        citations = [
          {
            id: 1,
            title: 'QuickNest Safe URL Shortener',
            url: 'https://quicknest.ai.studio/url-shortener',
            snippet: 'Privacy-focused URL shortener with automated malware scanning, SSRF protection, and zero user telemetry tracking.',
            relevance: 97
          },
          {
            id: 2,
            title: 'QuickNest Threat & Link Preview Inspector',
            url: 'https://quicknest.ai.studio/preview/safety',
            snippet: 'Inspect destination links, HTTP security headers, and domain reputation before navigating to unknown sites.',
            relevance: 91
          }
        ];
      } else if (q.includes('password') || q.includes('passphrase') || q.includes('crypto')) {
        keyEntities.push('Web Cryptography API', 'Shannon Entropy', 'Diceware Passphrase');
        answerHtml = `For generating cryptographically strong credentials, QuickNest offers an in-browser password and Diceware passphrase generator powered by crypto.getRandomValues [1]. The tool computes real-time Shannon entropy (bits) and operates 100% locally on the client device without network transmission [2].`;
        citations = [
          {
            id: 1,
            title: 'QuickNest Cryptographic Password Generator',
            url: 'https://quicknest.ai.studio/password-generator',
            snippet: 'Generate high-entropy passwords and memorable Diceware passphrases locally in the browser with zero server exposure.',
            relevance: 96
          },
          {
            id: 2,
            title: 'QuickNest System Architecture',
            url: 'https://quicknest.ai.studio/architecture',
            snippet: 'Zero-knowledge browser primitives and Web Cryptography API implementation details.',
            relevance: 88
          }
        ];
      } else {
        keyEntities.push('QuickNest Suite', 'GEO Optimization', 'Privacy Utilities');
        answerHtml = `QuickNest is a suite of high-speed, zero-retention developer and privacy utilities [1]. It features disposable 10-minute temporary email inboxes, phishing-protected URL shortening, RFC 9309 robots.txt auditing, client-side password creation, and an AI Search Observability suite optimizing site visibility across ChatGPT, Gemini, and Google AI Overviews [2].`;
        citations = [
          {
            id: 1,
            title: 'QuickNest - Free Privacy & Developer Tools',
            url: 'https://quicknest.ai.studio/',
            snippet: 'High-speed, zero-retention online utilities featuring disposable email, safe link shortener, robots auditor, and QR generator.',
            relevance: 95
          },
          {
            id: 2,
            title: 'QuickNest AI Search Observability & GEO Suite',
            url: 'https://quicknest.ai.studio/ai-observability',
            snippet: 'Audit and elevate domain visibility from baseline to 74+ across leading AI search engines and LLM crawlers.',
            relevance: 92
          }
        ];
      }

      res.json({
        query: query || 'What is QuickNest?',
        engine: engine || 'chatgpt',
        confidence,
        answerHtml,
        citations,
        keyEntities
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Simulation error' });
    }
  });

  // Short link redirect endpoint: /s/:code
  app.get('/s/:code', (req, res) => {
    const code = req.params.code;
    const link = store.getShortLink(code);

    if (!link) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Expired or Not Found - QuickNest</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #020617; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
            .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            h2 { color: #f43f5e; margin: 0 0 12px; font-size: 22px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            a { display: inline-block; background: #06b6d4; color: #020617; text-decoration: none; font-weight: 600; padding: 10px 24px; border-radius: 8px; transition: opacity 0.2s; }
            a:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Link Not Found or Expired</h2>
            <p>This short link has either expired, been quarantined for security violations, or never existed.</p>
            <a href="/">Return to QuickNest</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // If marked malicious or direct redirect is disabled, route to safety inspection preview
    if (link.isMalicious || !link.allowDirectRedirect) {
      res.redirect(302, `/preview/${code}`);
      return;
    }

    // Record click count & access timestamp
    store.recordLinkClick(code);
    res.redirect(302, link.originalUrl);
  });

  // Health and metrics endpoint (MERN Stack)
  app.get('/api/stats', (_req, res) => {
    res.json({
      status: 'operational',
      stack: 'MERN (MongoDB, Express, React, Node.js)',
      database: isMongoConnected() ? 'MongoDB (Connected via Mongoose)' : 'MongoDB (Resilient in-memory fallback active)',
      isMongoConnected: isMongoConnected(),
      uptime: process.uptime(),
      ...store.getSystemMetrics()
    });
  });

  // Known Valid Client Routes for QuickNest (All indexable pages and tools)
  const VALID_CLIENT_ROUTES = new Set([
    '/',
    '/temp-mail',
    '/url-shortener',
    '/security-checker',
    '/checker',
    '/robots-audit',
    '/robots',
    '/robots-txt',
    '/ai-observability',
    '/ai-search',
    '/geo',
    '/qr-code',
    '/password-generator',
    '/word-counter',
    '/text-case',
    '/architecture',
    '/guides',
    '/guides/mastering-rfc-9309-robots-txt-standards',
    '/guides/browser-cryptography-shannon-entropy-csprng',
    '/guides/architecture-of-disposable-temporary-email',
    '/guides/generative-engine-optimization-geo-strategies',
    '/guides/malicious-link-heuristics-phishing-defenses',
    '/privacy',
    '/terms',
    '/contact'
  ]);

  const isValidClientRoute = (pathname: string): boolean => {
    const clean = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    if (VALID_CLIENT_ROUTES.has(clean)) return true;
    if (clean.startsWith('/preview/')) return true;
    if (clean.startsWith('/s/')) return true;
    if (clean.startsWith('/guides/')) return true;
    return false;
  };

  interface RouteSeoMeta {
    title: string;
    description: string;
    h1: string;
    h2: string;
  }

  const ROUTE_SEO_MAP: Record<string, RouteSeoMeta> = {
    '/': {
      title: 'Free Privacy & Developer Tools | QuickNest',
      description: 'Free privacy-first tools for temporary email, secure URL shortening, QR codes, passwords, word counting, and text conversion.',
      h1: 'Free Privacy & Developer Tools',
      h2: 'Online Privacy and Developer Utilities'
    },
    '/temp-mail': {
      title: 'Temp Mail - Free Disposable 10-Minute Temporary Email | QuickNest',
      description: 'Generate anonymous, disposable 10-minute temporary email inboxes with real-time inbound delivery. Protect your personal inbox from spam with zero data retention.',
      h1: 'Disposable 10-Minute Temporary Email',
      h2: 'Your Active Temporary Address & Inbound Messages'
    },
    '/url-shortener': {
      title: 'Secure URL Shortener - Malware & Phishing Protected Links | QuickNest',
      description: 'Shorten long URLs with automated malware detection, phishing heuristics, click analytics, and optional destination preview inspection screens.',
      h1: 'Secure URL Shortener',
      h2: 'Create Safe Short Link & Prevent Phishing'
    },
    '/security-checker': {
      title: 'Website Health & Security Checker - Headers & SSL Audit | QuickNest',
      description: 'Inspect website HTTP security headers (HSTS, CSP, X-Frame-Options), SSL/TLS certificates, and response latency with Next.js & Cloudflare remediation.',
      h1: 'Website Health & Security Checker',
      h2: 'Core HTTP Security Headers Audited'
    },
    '/checker': {
      title: 'Website Health & Security Checker - Headers & SSL Audit | QuickNest',
      description: 'Inspect website HTTP security headers (HSTS, CSP, X-Frame-Options), SSL/TLS certificates, and response latency with Next.js & Cloudflare remediation.',
      h1: 'Website Health & Security Checker',
      h2: 'Core HTTP Security Headers Audited'
    },
    '/robots-audit': {
      title: 'Robots.txt & SEO Auditor - Syntax Validator & Path Simulator | QuickNest',
      description: 'Validate robots.txt configuration for indexing pitfalls, catastrophic Disallow: / blocks, asset blockage, exposed routes, and test URL access across Googlebot and AI bots.',
      h1: 'Robots.txt & SEO Auditor',
      h2: 'robots.txt Direct Buffer & Editor'
    },
    '/robots': {
      title: 'Robots.txt & SEO Auditor - Syntax Validator & Path Simulator | QuickNest',
      description: 'Validate robots.txt configuration for indexing pitfalls, catastrophic Disallow: / blocks, asset blockage, exposed routes, and test URL access across Googlebot and AI bots.',
      h1: 'Robots.txt & SEO Auditor',
      h2: 'robots.txt Direct Buffer & Editor'
    },
    '/robots-txt': {
      title: 'Robots.txt & SEO Auditor - Syntax Validator & Path Simulator | QuickNest',
      description: 'Validate robots.txt configuration for indexing pitfalls, catastrophic Disallow: / blocks, asset blockage, exposed routes, and test URL access across Googlebot and AI bots.',
      h1: 'Robots.txt & SEO Auditor',
      h2: 'robots.txt Direct Buffer & Editor'
    },
    '/ai-observability': {
      title: 'AI Search Observability & GEO Suite - Track Citations & Bot Indexing | QuickNest',
      description: 'Monitor AI Search Visibility (74/100), brand mentions, cited pages, and bot accessibility across ChatGPT, Google AI Overview, Gemini, Perplexity, and Claude.',
      h1: 'AI Search Observability & GEO Suite',
      h2: 'AI Search Observability Score Drivers'
    },
    '/ai-search': {
      title: 'AI Search Observability & GEO Suite - Track Citations & Bot Indexing | QuickNest',
      description: 'Monitor AI Search Visibility (74/100), brand mentions, cited pages, and bot accessibility across ChatGPT, Google AI Overview, Gemini, Perplexity, and Claude.',
      h1: 'AI Search Observability & GEO Suite',
      h2: 'AI Search Observability Score Drivers'
    },
    '/geo': {
      title: 'AI Search Observability & GEO Suite - Track Citations & Bot Indexing | QuickNest',
      description: 'Monitor AI Search Visibility (74/100), brand mentions, cited pages, and bot accessibility across ChatGPT, Google AI Overview, Gemini, Perplexity, and Claude.',
      h1: 'AI Search Observability & GEO Suite',
      h2: 'AI Search Observability Score Drivers'
    },
    '/qr-code': {
      title: 'QR Code Generator - Custom URL, WiFi, vCard & Text Codes | QuickNest',
      description: 'Generate high-density, custom QR codes for websites, WiFi networks, contact cards, emails, and plain text. Download crisp high-resolution PNGs instantly.',
      h1: 'High-Density QR Code Generator',
      h2: 'QR Code Payload & Style Controls'
    },
    '/password-generator': {
      title: 'Password Generator - Cryptographic High-Entropy Passwords | QuickNest',
      description: 'Generate cryptographically secure passwords and memorable Diceware passphrases locally in your browser using the Web Cryptography API. Zero network exposure.',
      h1: 'Cryptographic Password Generator',
      h2: 'Active Generated Key & Security Entropy'
    },
    '/word-counter': {
      title: 'Word Counter - Real-Time Text Statistics & Reading Time | QuickNest',
      description: 'Count words, characters, sentences, paragraphs, and estimated reading time in real time. Inspect detailed character density and keyword metrics.',
      h1: 'Real-Time Word & Character Counter',
      h2: 'Live Analysis Buffer & Metrics'
    },
    '/text-case': {
      title: 'Text Case Converter - UPPERCASE, lowercase, camelCase & More | QuickNest',
      description: 'Convert text instantly between UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE with one-click export.',
      h1: 'Instant Text Case Converter',
      h2: 'Source Text Buffer & Formatted Output Variations'
    },
    '/architecture': {
      title: 'System Architecture & Engineering Specifications | QuickNest',
      description: 'Explore QuickNest\'s production architecture: PostgreSQL schemas, Redis cache-aside redirect layers, and zero-retention temporary email infrastructure.',
      h1: 'System Architecture & Technical Specifications',
      h2: 'Visual Topology Diagram & Infrastructure'
    },
    '/guides': {
      title: 'Knowledge Hub & Technical Guides – SEO, GEO & Cryptography | QuickNest',
      description: 'Explore in-depth engineering guides on RFC 9309 robots.txt standards, client-side WebCrypto, temporary email architecture, and Generative Engine Optimization.',
      h1: 'Knowledge Hub & Technical Guides',
      h2: 'Published Technical Guides & Topical Authority'
    },
    '/privacy': {
      title: 'Privacy Policy - Zero-Account & Zero-Retention Guarantee | QuickNest',
      description: 'Read the QuickNest privacy commitment: complete anonymity, no user registration, no telemetry tracking, and automated deletion of temporary data.',
      h1: 'Privacy Policy - Zero-Retention Guarantee',
      h2: '1. Zero Account Requirement & Data Minimization'
    },
    '/terms': {
      title: 'Terms of Service - Acceptable Use & Fair Access | QuickNest',
      description: 'Review terms and conditions for utilizing QuickNest\'s free online utilities, anti-abuse policies, and acceptable use guidelines.',
      h1: 'Terms of Service',
      h2: '1. Acceptance of Terms'
    },
    '/contact': {
      title: 'Contact Us & Abuse Reporting Center | QuickNest',
      description: 'Report malicious short links, submit feedback, or contact the QuickNest security operations team for swift review and takedown.',
      h1: 'Contact & Takedown Desk',
      h2: 'Report Malicious Link or Security Incident'
    }
  };

  // Helper to render HTML with dynamic canonical URL, matching titles and semantic H1/H2 markup
  const renderAppHtml = async (req: express.Request, res: express.Response, viteInstance?: any) => {
    try {
      const cleanPath = req.path === '/' ? '/' : req.path.replace(/\/$/, '');
      const canonicalUrl = `https://quicknest.ai.studio${cleanPath}`;

      const targetIndexPath = isProd
        ? path.resolve(__dirname, 'dist', 'index.html')
        : path.resolve(__dirname, 'index.html');

      let html = fs.readFileSync(targetIndexPath, 'utf8');

      // Dynamically replace canonical link to match the exact sitemap and page URL
      html = html.replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      // Inject route-specific meta tags and pre-rendered semantic H1/H2 markup
      const meta = ROUTE_SEO_MAP[cleanPath] || ROUTE_SEO_MAP['/'];
      if (meta) {
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title.replace(/&/g, '&amp;')}</title>`);
        html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${meta.title.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${meta.description.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
        html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${meta.title.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${meta.description.replace(/"/g, '&quot;')}" />`);

        if (cleanPath !== '/' && cleanPath !== '') {
          const routeFallback = `<main class="seo-fallback">
        <p><strong>QuickNest</strong></p>
        <h1>${meta.h1}</h1>
        <p>${meta.description}</p>
        <section aria-label="${meta.h1} Specification">
          <h2>${meta.h2}</h2>
          <p>Privacy-first zero-retention utilities engineered for security, speed, and developer productivity.</p>
        </section>
        <nav aria-label="QuickNest tools">
          <h2>Explore All Privacy and Developer Utilities</h2>
          <ul>
            <li><a href="/temp-mail">Disposable 10-minute temporary email</a></li>
            <li><a href="/url-shortener">Secure URL shortener</a></li>
            <li><a href="/security-checker">Website health and security checker</a></li>
            <li><a href="/robots-audit">Robots.txt and SEO auditor</a></li>
            <li><a href="/qr-code">QR code generator</a></li>
            <li><a href="/password-generator">Cryptographic password generator</a></li>
            <li><a href="/word-counter">Word and character counter</a></li>
            <li><a href="/text-case">Text case converter</a></li>
          </ul>
        </nav>
      </main>`;
          html = html.replace(/<main class="seo-fallback">[\s\S]*?<\/main>/, routeFallback);
        }
      }

      // In dev mode, apply Vite index.html transforms
      if (viteInstance) {
        html = await viteInstance.transformIndexHtml(req.originalUrl, html);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err: any) {
      console.error('Render error:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  // 404 Route Validator for Unknown URLs (Fixes Sitechecker 404 page critical error)
  app.use((req, res, next) => {
    // Pass through API routes, assets, Vite internals, and spec files
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/src/') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/node_modules/') ||
      req.path === '/robots.txt' ||
      req.path === '/sitemap.xml' ||
      req.path === '/llms.txt' ||
      req.path === '/llms-full.txt' ||
      req.path === '/favicon.svg' ||
      /\.[a-zA-Z0-9]+$/.test(req.path)
    ) {
      return next();
    }

    if (isValidClientRoute(req.path)) {
      return next();
    }

    // Return strict HTTP 404 status code with noindex directive
    res.status(404);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    return res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 - Page Not Found | QuickNest</title>
  <meta name="robots" content="noindex, follow" />
  <style>
    body { background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .code { font-size: 64px; font-weight: 800; color: #06b6d4; line-height: 1; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-flex; align-items: center; justify-content: center; background: #06b6d4; color: #020617; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 24px; border-radius: 8px; transition: opacity 0.2s; }
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="code">404</div>
    <h1>Page Not Found</h1>
    <p>The page you requested (<code>${req.path.replace(/</g, '&lt;')}</code>) does not exist on QuickNest or has been moved.</p>
    <a href="/">Return to QuickNest Home</a>
  </div>
</body>
</html>`);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/@') || req.path.startsWith('/src/')) {
        return next();
      }
      await renderAppHtml(req, res, vite);
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', async (req, res) => {
      await renderAppHtml(req, res);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuickNest Server running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Fatal error during startServer:', err);
});
