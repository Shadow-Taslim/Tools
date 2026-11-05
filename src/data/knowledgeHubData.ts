import { KnowledgeArticle, TopicalOpportunity } from '../types.ts';

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: 'mastering-rfc-9309-robots-txt-standards',
    title: 'Mastering RFC 9309: Configuring Robots.txt for Search Engines and AI Crawlers',
    subtitle: 'A technical guide to standardizing robots.txt directives across Googlebot, GPTBot, ClaudeBot, and Perplexity without compromising search discovery.',
    category: 'Search & AI Crawlers',
    readTimeMinutes: 7,
    publishDate: '2026-10-15',
    author: {
      name: 'QuickNest Engineering',
      role: 'Technical SEO & Infrastructure Team'
    },
    summary: 'The formal ratification of IETF RFC 9309 transformed the Robots Exclusion Protocol from an informal 1994 convention into an official internet standard. This guide details parser rules, wildcard precedence, and how to govern AI crawlers like GPTBot and ClaudeBot without losing organic rankings.',
    keyTakeaways: [
      'RFC 9309 defines a strict line-based syntax with longest-match rule precedence.',
      'Allow rules that are longer than or equal in length to a Disallow rule take priority.',
      'Blocking GPTBot or ClaudeBot does not remove existing citations or drop search visibility on Google.',
      'Sitemap declarations must be absolute URIs and placed at the top or bottom of the robots.txt file.',
      'Never disallow CSS or JavaScript assets because Googlebot and Bingbot require them for layout evaluation.'
    ],
    sections: [
      {
        heading: '1. What Changed with the RFC 9309 Specification',
        content: 'For nearly three decades, robots.txt was governed by Martijn Koster’s 1994 draft proposal. In September 2022, the Internet Engineering Task Force published RFC 9309, standardizing file format parsing, size limits (up to 500 KiB), timeout handling, and path-matching precedence. Under RFC 9309, path comparisons are byte-by-byte prefix matches where the asterisk (*) matches zero or more characters and the dollar sign ($) designates end-of-path.'
      },
      {
        heading: '2. The Longest-Match Precedence Rule',
        content: 'When multiple rules match a request, RFC 9309 dictates that the directive with the longest path pattern wins. If an Allow and Disallow directive have equal match lengths, the Allow directive takes precedence. Consider the following example:',
        codeSnippet: {
          language: 'robots.txt',
          code: `# Disallow all administrative routes
User-agent: *
Disallow: /admin/
Allow: /admin/public-status.json

# Result: /admin/public-status.json is ALLOWED because the Allow path is 26 chars vs 7 chars`,
          caption: 'Longest-match path precedence demonstration under RFC 9309'
        }
      },
      {
        heading: '3. Differentiating Search Discovery from AI Model Training',
        content: 'Modern webmasters must differentiate between AI search retrieval (e.g. ChatGPT Search, PerplexityBot) and offline LLM training crawlers (e.g. GPTBot, Google-Extended). Blocking all AI bots blindly prevents your website from being cited as a factual source in active generative search queries.',
        codeSnippet: {
          language: 'robots.txt',
          code: `# Recommended QuickNest Production Robots.txt Pattern
User-agent: *
Allow: /
Disallow: /api/
Disallow: /s/
Disallow: /preview/

# AI Search Discovery permitted for real-time citations
User-agent: GPTBot
Allow: /
Allow: /llms.txt
Disallow: /api/

User-agent: Google-Extended
Allow: /
Allow: /llms.txt
Disallow: /api/

Sitemap: https://quicknest.ai.studio/sitemap.xml`,
          caption: 'Standard-compliant robots.txt configuration balancing security and AI citation'
        },
        callout: {
          type: 'tip',
          text: 'Use QuickNest’s interactive Robots.txt Auditor to test your custom paths against Googlebot, GPTBot, and ClaudeBot in real-time.'
        }
      },
      {
        heading: '4. Critical Robots.txt Pitfalls to Avoid',
        content: 'The most damaging mistake in technical SEO is specifying "Disallow: /" during a staging deployment and inadvertently releasing it to production. Other catastrophic errors include blocking CSS/JS assets (preventing Core Web Vitals mobile evaluation) and exposing confidential internal endpoints in public Disallow directives where attackers can scrape them.'
      }
    ],
    faqs: [
      {
        question: 'Does blocking GPTBot in robots.txt remove my website from OpenAI search results?',
        answer: 'GPTBot is primarily OpenAI’s web crawler for training data and search indexing. For real-time user browsing inquiries, OpenAI also utilizes ChatGPT-User and OAI-SearchBot. Disallowing GPTBot prevents crawler scraping but will not instantly erase historical mentions.'
      },
      {
        question: 'What is the maximum allowed file size for robots.txt under RFC 9309?',
        answer: 'RFC 9309 Section 2.4 specifies that parsers must parse at least the first 500 kibibytes (KiB) of the robots.txt file. Anything beyond 500 KiB can be truncated or ignored by search engine bots.'
      },
      {
        question: 'Why should I never disallow CSS or JavaScript assets?',
        answer: 'Google and Bing employ modern headless Chromium engines to render your page visual tree. If stylesheets or layout scripts are blocked, the crawler cannot calculate layout geometry, mobile responsiveness, or Core Web Vitals (CLS/LCP), triggering search penalties.'
      }
    ],
    relatedToolId: 'robots-audit',
    relatedToolName: 'RFC 9309 Robots.txt Auditor',
    targetKeyword: 'rfc 9309 robots txt',
    schemaType: 'TechArticle'
  },
  {
    slug: 'browser-cryptography-shannon-entropy-csprng',
    title: 'Browser Cryptography in Practice: Shannon Entropy and CSPRNG with W3C WebCrypto',
    subtitle: 'How to implement zero-knowledge client-side password generation and calculate true mathematical entropy using crypto.getRandomValues.',
    category: 'Cryptography & Security',
    readTimeMinutes: 8,
    publishDate: '2026-10-18',
    author: {
      name: 'QuickNest Security',
      role: 'Application Security & Cryptography'
    },
    summary: 'Generating passwords on a web server exposes credentials to TLS interception, database breach, and memory dumps. This guide explores client-side cryptographically secure pseudo-random number generators (CSPRNG), Shannon entropy formulas, and Diceware passphrases compliant with NIST SP 800-63B.',
    keyTakeaways: [
      'Math.random() is non-cryptographic (PRNG) and predictable via PRNG state reconstruction.',
      'crypto.getRandomValues utilizes the operating system kernel entropy pool (urandom/BCryptGenRandom).',
      'Shannon entropy calculates theoretical information density in bits: H = -sum(p * log2(p)).',
      'NIST SP 800-63B recommends passphrases with 64+ bits of entropy over forced complex punctuation.',
      'Client-side computation ensures zero sensitive data ever traverses an HTTP network connection.'
    ],
    sections: [
      {
        heading: '1. Why Math.random() Fails Security Requirements',
        content: 'V8 and modern JavaScript engines implement Math.random() using the xoroshiro128+ algorithm. While fast for games and simulations, xoroshiro128+ is completely deterministic: an attacker who observes a sequence of floating-point values can reconstruct the 128-bit internal state in milliseconds and predict every subsequent password generated.'
      },
      {
        heading: '2. Implementing W3C Web Cryptography CSPRNG',
        content: 'The W3C Web Cryptography API provides window.crypto.getRandomValues(), which pulls raw entropy directly from the underlying host kernel (e.g. /dev/urandom on Linux/macOS or CryptGenRandom on Windows). To avoid modulo bias when picking characters from a charset, rejection sampling or power-of-two masks must be applied.',
        codeSnippet: {
          language: 'typescript',
          code: `export function secureRandomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  window.crypto.getRandomValues(buffer);
  return buffer;
}

export function generateSecurePassword(length: number, charset: string): string {
  const randomBytes = secureRandomBytes(length * 2);
  let result = '';
  let byteIndex = 0;
  
  while (result.length < length && byteIndex < randomBytes.length) {
    const val = randomBytes[byteIndex++];
    // Unbiased selection within alphabet boundary
    if (val < 256 - (256 % charset.length)) {
      result += charset[val % charset.length];
    }
  }
  return result;
}`,
          caption: 'Modulo-bias free client-side character selection with WebCrypto'
        }
      },
      {
        heading: '3. Calculating Shannon Information Entropy',
        content: 'Claude Shannon’s 1948 information theory provides the mathematical measure of uncertainty in a data stream. For an alphabet with size N and password length L, the theoretical maximum entropy in bits is given by L * log2(N). For a 16-character alphanumeric password (62 possible characters), the entropy is 16 * log2(62) = 95.27 bits of entropy.',
        codeSnippet: {
          language: 'typescript',
          code: `export function calculateShannonEntropy(password: string): number {
  if (!password) return 0;
  const frequencies = new Map<string, number>();
  for (const char of password) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  
  let entropy = 0;
  const len = password.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * len * 10) / 10;
}`,
          caption: 'Shannon entropy calculation in TypeScript'
        }
      },
      {
        heading: '4. NIST SP 800-63B Passphrase Recommendations',
        content: 'The National Institute of Standards and Technology (NIST) explicitly advises against arbitrary character composition rules (such as forcing uppercase, lowercase, numbers, and symbols), which merely encourage users to substitute predictable patterns (e.g. P@ssw0rd1!). Instead, NIST advocates for length and Diceware passphrases composed of 5 to 7 random dictionary words.'
      }
    ],
    faqs: [
      {
        question: 'Is a client-side password generator safer than an online server-side generator?',
        answer: 'Yes. A purely client-side generator computes credentials locally using your browser Web Cryptography API. Zero bytes of your password or seed phrase are ever transmitted over the network or logged in remote server databases.'
      },
      {
        question: 'How many bits of entropy are considered uncrackable against modern GPU clusters?',
        answer: 'Modern GPU hash-cracking arrays (e.g. Hashcat on Nvidia RTX 4090 clusters) can test billions of hashes per second. An entropy of 80 bits or higher provides overwhelming mathematical defense against brute force attacks.'
      }
    ],
    relatedToolId: 'password-generator',
    relatedToolName: 'Cryptographic Password Suite',
    targetKeyword: 'shannon entropy password calculator',
    schemaType: 'TechArticle'
  },
  {
    slug: 'architecture-of-disposable-temporary-email',
    title: 'The Architecture of Disposable Temporary Email: Inbound MX, Webhooks, and TTL Purging',
    subtitle: 'A system architecture deep dive into building zero-retention temporary email infrastructure with Cloudflare Email Routing and autonomous background eviction.',
    category: 'Privacy Engineering',
    readTimeMinutes: 9,
    publishDate: '2026-10-21',
    author: {
      name: 'QuickNest Engineering',
      role: 'Backend & Systems Architect'
    },
    summary: 'Temporary disposable email services protect personal identities from spam, newsletters, and marketing trackers. This guide examines how DNS MX records route inbound SMTP traffic, how inbound webhooks parse multipart MIME messages, and how automated memory sweepers enforce strict time-to-live (TTL) data eviction.',
    keyTakeaways: [
      'DNS MX records with wildcard catch-all routing direct inbound mail to routing proxies.',
      'Inbound webhook workers parse incoming RFC 5322 MIME payloads into sanitized JSON.',
      'Multi-tenant isolation requires cryptographically unique mailbox tokens to prevent unauthorized inbox access.',
      'Autonomous cron or unref intervals purge expired inboxes and attachments permanently.',
      'Zero-retention architecture ensures no persistent disk footprints remain after TTL expiry.'
    ],
    sections: [
      {
        heading: '1. Inbound SMTP Ingestion & MX Catch-Alls',
        content: 'To receive mail on dynamically generated addresses (e.g. usr_82fa19@temp.quicknest.org), the domain’s DNS zone declares Mail Exchange (MX) records pointing to an edge mail relay (such as Cloudflare Email Routing, Mailgun, or SendGrid Inbound Parse). A catch-all rule captures any recipient handle on the subdomain and posts the raw RFC 5322 message payload to our backend webhook.'
      },
      {
        heading: '2. Multipart MIME Parsing & Security Sanitization',
        content: 'Incoming emails contain raw multipart headers, encoded plain text, HTML bodies, and base64 attachments. Before displaying emails in the user interface, the payload must be sanitized to strip malicious JavaScript, tracking pixels, and tracking cookies.',
        codeSnippet: {
          language: 'typescript',
          code: `// Secure Inbound Webhook Handler in Express
router.post('/inbound-webhook', (req: Request, res: Response) => {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }

  const { to, from, subject, bodyText, bodyHtml } = req.body;
  const targetAddress = extractEmail(to).toLowerCase();
  const inbox = store.getInbox(targetAddress);
  
  if (!inbox || inbox.expiresAt < Date.now()) {
    return res.status(404).json({ error: 'Inbox expired or unknown' });
  }

  store.addMessage({
    id: 'msg_' + crypto.randomUUID(),
    inboxAddress: targetAddress,
    fromAddress: from,
    subject: sanitizeHtml(subject),
    bodyHtml: sanitizeHtml(bodyHtml, { allowedTags: ['b', 'i', 'p', 'a'] }),
    receivedAt: Date.now()
  });

  res.status(200).json({ status: 'delivered' });
});`,
          caption: 'Inbound email ingestion with signature authentication and sanitization'
        }
      },
      {
        heading: '3. Enforcing Multi-Tenant Cryptographic Isolation',
        content: 'A critical vulnerability in poorly designed temporary email websites is cross-user mailbox collisions. If two separate visitors pick the handle "admin" or "tester", one user might read verification codes sent to the other. QuickNest solves this by issuing cryptographically distinct access tokens per inbox and assigning random unique handles by default.'
      },
      {
        heading: '4. Autonomous TTL Data Eviction',
        content: 'True privacy requires verifiable zero retention. Every inbox in QuickNest is born with an explicit 10-minute expiration timestamp. An autonomous background sweeper thread runs every 10 seconds, identifies expired entries, and permanently frees memory and disk buffers.'
      }
    ],
    faqs: [
      {
        question: 'Can disposable temporary emails be recovered after the 10-minute countdown expires?',
        answer: 'No. Once the timer reaches zero, QuickNest’s background sweeper performs a permanent memory purge. There are no backups, logs, or archives kept.'
      },
      {
        question: 'Are attachments safely scanned before rendering?',
        answer: 'QuickNest restricts executable file attachments and displays MIME attachments strictly as sandboxed download objects to defend against malicious malware payloads.'
      }
    ],
    relatedToolId: 'temp-mail',
    relatedToolName: 'Disposable 10-Minute Temp Mail',
    targetKeyword: 'how temporary email works',
    schemaType: 'TechArticle'
  },
  {
    slug: 'generative-engine-optimization-geo-strategies',
    title: 'Generative Engine Optimization (GEO): Technical Strategies for ChatGPT Search, Gemini & AI Overviews',
    subtitle: 'How to transition from legacy keyword-stuffing to entity-rich, fact-dense content architecture that modern LLM search engines index and cite.',
    category: 'Search & AI Crawlers',
    readTimeMinutes: 10,
    publishDate: '2026-10-25',
    author: {
      name: 'QuickNest Research',
      role: 'AI Search & GEO Specialist'
    },
    summary: 'Search is shifting from ten blue links to direct, synthesis-driven answers in ChatGPT Search, Google AI Overviews, and Perplexity. Generative Engine Optimization (GEO) requires structuring content with concise direct answers, verified sources, RFC 9309 crawler permissions, and machine-readable llms.txt files.',
    keyTakeaways: [
      'LLMs prioritize high-density factual answers near the top of headings over fluffy narrative intros.',
      'Authoritative citations require distinct entity naming and unambiguous semantic definitions.',
      'Google AI Overviews and ChatGPT Search extract structured tables, ordered lists, and FAQ schemas.',
      'Machine-readable files (/llms.txt) provide concise technical corpus context for retrieval-augmented generation (RAG).',
      'High domain authority without clear topical structure results in low AI citation share.'
    ],
    sections: [
      {
        heading: '1. What is Generative Engine Optimization (GEO)?',
        content: 'Generative Engine Optimization (GEO) is the practice of structuring digital assets and web content so that generative AI engines (ChatGPT Search, Google Gemini, Perplexity AI, Claude) can parse, comprehend, and cite your domain as an authoritative source when formulating conversational answers.'
      },
      {
        heading: '2. The Four Pillars of GEO Success',
        content: 'Our research reveals four technical pillars that distinguish websites cited by AI search from those that are omitted:\n\n1. Direct Answer Placement: Answer the primary inquiry in the first 40 words following an H1 or H2.\n2. Entity & Standard Alignment: Connect technical claims directly to open standards (e.g. IETF, W3C, ISO, NIST).\n3. Clean HTML Semantics: Avoid deep nested div soups that obscure semantic hierarchy.\n4. Structured Data Breadcrumbs: Maintain SoftwareApplication, FAQPage, and Organization JSON-LD schemas.'
      },
      {
        heading: '3. Leveraging the LLMs.txt Standard',
        content: 'Proposed in 2024, the llms.txt standard provides an index file in Markdown format located in the webroot (/llms.txt). It offers AI web agents a concise, machine-readable overview of what the website provides without requiring the model to crawl megabytes of client-side JavaScript.',
        codeSnippet: {
          language: 'markdown',
          code: `# QuickNest
> Free privacy-first developer utilities.

## Core Capabilities
- [Disposable Temp Mail](https://quicknest.ai.studio/temp-mail): Anonymous 10-minute inboxes with zero retention.
- [RFC 9309 Robots Validator](https://quicknest.ai.studio/robots-audit): Real-time parser validating bot access.
- [Cryptographic Passwords](https://quicknest.ai.studio/password-generator): Local CSPRNG generator with Shannon entropy.
- [AI Observability](https://quicknest.ai.studio/ai-observability): Real-time GEO and AI crawler visibility audit.

## Specifications
- Full Technical Corpus: https://quicknest.ai.studio/llms-full.txt
- Robots Directives: https://quicknest.ai.studio/robots.txt`,
          caption: 'Production-ready llms.txt specification conforming to LLM indexing best practices'
        }
      },
      {
        heading: '4. Measuring AI Visibility (The 74/100 Benchmark)',
        content: 'Unlike traditional search rankings where you track rank #1–10 on SERPs, GEO success is measured by Mention Frequency, Direct Citation Count, and Share of Voice across generative queries. Using QuickNest’s AI Search Observability suite, webmasters can test simulated queries and monitor crawler accessibility in real-time.'
      }
    ],
    faqs: [
      {
        question: 'Does GEO replace traditional Search Engine Optimization (SEO)?',
        answer: 'No. GEO builds directly on top of traditional technical SEO. AI engines like ChatGPT Search and Google AI Overviews crawl pages using traditional indexers (Bingbot, Googlebot). If your technical SEO, sitemap, or robots.txt is broken, AI engines cannot discover your content.'
      },
      {
        question: 'Can you guarantee that ChatGPT will cite your website?',
        answer: 'No technique can guarantee AI citations because generative models employ probabilistic token selection. However, adhering to clear factual structures, high-entropy content, and RFC 9309 bot permissions drastically increases the probability of selection.'
      }
    ],
    relatedToolId: 'ai-observability',
    relatedToolName: 'AI Search Observability Suite',
    targetKeyword: 'generative engine optimization geo strategies',
    schemaType: 'TechArticle'
  },
  {
    slug: 'malicious-link-heuristics-phishing-defenses',
    title: 'Malicious Link Heuristics: Defending Against Homograph Phishing and Open Redirects',
    subtitle: 'Technical analysis of how modern URL shorteners detect lookalike Cyrillic characters, credential phishing patterns, and dangerous file extensions.',
    category: 'Privacy Engineering',
    readTimeMinutes: 7,
    publishDate: '2026-10-28',
    author: {
      name: 'QuickNest Security',
      role: 'Threat Intelligence Team'
    },
    summary: 'URL shorteners are frequently abused by threat actors to mask phishing portals and malware payloads. This technical guide outlines real-time heuristics, Internationalized Domain Name (IDN) homograph detection, and intermediate inspection quarantine screens.',
    keyTakeaways: [
      'IDN homograph attacks substitute lookalike Unicode glyphs (e.g. Cyrillic "а" for Latin "a").',
      'Dangerous file extensions (.exe, .scr, .bat) should trigger automatic quarantine.',
      'Intermediate safety preview routes (/preview/:code) allow visitors to inspect destinations before redirecting.',
      'Integration with Google Safe Browsing and local blocklists prevents known malicious redirect loops.',
      'Community reporting mechanisms enable rapid takedown of newly registered malicious campaigns.'
    ],
    sections: [
      {
        heading: '1. The Homograph Attack Vector',
        content: 'An Internationalized Domain Name (IDN) homograph attack occurs when an attacker registers a domain name that visually resembles a legitimate brand by substituting characters from another script, such as replacing the Latin "o" with the Cyrillic "о" (U+043E). To a human user, "apple.com" and "аpple.com" appear identical, but the browser treats them as completely distinct destinations.'
      },
      {
        heading: '2. Punycode Conversion & Heuristic Detection',
        content: 'When an IDN domain is parsed, browsers translate it into Punycode with the prefix "xn--". QuickNest’s URL safety analyzer checks whether incoming URLs combine mixed scripts or map to known brand impersonations before issuing a shortened link.',
        codeSnippet: {
          language: 'typescript',
          code: `export function evaluateUrlSafety(inputUrl: string): SafetyCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;
  
  const parsed = new URL(inputUrl);
  const hostname = parsed.hostname.toLowerCase();

  // 1. Detect mixed script homograph impersonation
  if (hostname.startsWith('xn--')) {
    riskScore += 45;
    reasons.push('Punycode internationalized domain detected: Potential homograph lookalike.');
  }

  // 2. Detect direct IP address destinations (bypassing DNS inspection)
  if (/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(hostname)) {
    riskScore += 40;
    reasons.push('Raw IPv4 host address: High risk for unvetted infrastructure.');
  }

  // 3. Detect dangerous executable download extensions
  if (/\\.(exe|scr|bat|vbs|cmd|msi|ps1)$/i.test(parsed.pathname)) {
    riskScore += 60;
    reasons.push('Dangerous executable file extension detected.');
  }

  return {
    isSafe: riskScore < 50,
    riskScore,
    reasons,
    canonicalUrl: parsed.href,
    domain: hostname
  };
}`,
          caption: 'Multi-layer heuristic inspection implemented in QuickNest URL Shortener'
        }
      },
      {
        heading: '3. Inspection Quarantine Routing (/preview/:code)',
        content: 'Rather than allowing direct HTTP 302 redirects to unverified or reported domains, safe URL shorteners route ambiguous destinations to an intermediate inspection screen. Here, users can examine the full canonical URL, destination IP, SSL grade, and security score before consciously navigating away.'
      }
    ],
    faqs: [
      {
        question: 'Why do URL shorteners require safety inspection?',
        answer: 'Because short links obscure the destination URL, phishers frequently use them in spam emails and social media campaigns to bypass corporate email filters. Real-time scanning protects unsuspecting users from phishing traps.'
      },
      {
        question: 'Can community abuse reports take down a malicious short link automatically?',
        answer: 'Yes. In QuickNest, when a short link receives multiple independent abuse reports, direct redirection is immediately suspended and the link is placed into quarantine.'
      }
    ],
    relatedToolId: 'url-shortener',
    relatedToolName: 'Safe URL Shortener & Phishing Shield',
    targetKeyword: 'homograph attack detection url',
    schemaType: 'TechArticle'
  }
];

export const TOPICAL_OPPORTUNITIES: TopicalOpportunity[] = [
  {
    id: 1,
    title: 'RFC 9309 Specification Breakdown for Modern Webmasters',
    intent: 'Informational',
    targetAudience: 'Technical SEOs, DevOps Engineers, Webmasters',
    mainKeyword: 'rfc 9309 robots txt',
    relatedKeywords: ['robots exclusion protocol', 'ietf rfc 9309', 'robots txt parser rules'],
    questionsAnswered: ['What is RFC 9309?', 'How do longest-match rules work in robots.txt?', 'What is the maximum file size for robots.txt?'],
    relevantTool: 'robots-audit',
    toolName: 'RFC 9309 Robots.txt Auditor',
    internalLinking: ['/robots-audit', '/ai-observability', '/guides/mastering-rfc-9309-robots-txt-standards']
  },
  {
    id: 2,
    title: 'How to Block AI Training Crawlers Without Hurting Search Indexation',
    intent: 'Commercial',
    targetAudience: 'Publishers, Content Creators, Engineering Leaders',
    mainKeyword: 'block gptbot robots txt',
    relatedKeywords: ['block ai crawlers', 'oai-searchbot vs gptbot', 'google-extended robots txt'],
    questionsAnswered: ['How do I block GPTBot but keep Google Search?', 'What is the difference between GPTBot and ChatGPT-User?', 'Can I allow search citations while blocking training?'],
    relevantTool: 'robots-audit',
    toolName: 'RFC 9309 Robots.txt Auditor',
    internalLinking: ['/robots-audit', '/ai-observability', '/guides/mastering-rfc-9309-robots-txt-standards']
  },
  {
    id: 3,
    title: 'Optimizing Content for Google AI Overviews and Search SGE',
    intent: 'Informational',
    targetAudience: 'Content Marketers, SEO Strategists, Website Owners',
    mainKeyword: 'google ai overviews optimization',
    relatedKeywords: ['sge optimization', 'ai search visibility', 'google ai mode seo'],
    questionsAnswered: ['How does Google select sources for AI Overviews?', 'What formatting triggers AI summary citations?', 'How do direct answers improve SGE visibility?'],
    relevantTool: 'ai-observability',
    toolName: 'AI Search Observability Suite',
    internalLinking: ['/ai-observability', '/guides/generative-engine-optimization-geo-strategies']
  },
  {
    id: 4,
    title: 'Difference Between LLMs.txt and Robots.txt: Complete Comparison',
    intent: 'Informational',
    targetAudience: 'Developers, Prompt Engineers, System Architects',
    mainKeyword: 'llms txt specification',
    relatedKeywords: ['what is llms txt', 'llms txt vs robots txt', 'machine readable web context'],
    questionsAnswered: ['What is the purpose of llms.txt?', 'Where should llms.txt be hosted?', 'Do search engines replace robots.txt with llms.txt?'],
    relevantTool: 'ai-observability',
    toolName: 'AI Search Observability Suite',
    internalLinking: ['/llms.txt', '/ai-observability', '/guides/generative-engine-optimization-geo-strategies']
  },
  {
    id: 5,
    title: 'Implementing Shannon Entropy for Password Strength Calculation',
    intent: 'Technical',
    targetAudience: 'Security Engineers, Full-Stack Developers, Cryptographers',
    mainKeyword: 'shannon entropy password calculator',
    relatedKeywords: ['bits of entropy password', 'password strength formula', 'shannon information theory password'],
    questionsAnswered: ['How is password entropy calculated?', 'How many bits of entropy are required for modern passwords?', 'Why is password length more critical than symbol variety?'],
    relevantTool: 'password-generator',
    toolName: 'Cryptographic Password Suite',
    internalLinking: ['/password-generator', '/guides/browser-cryptography-shannon-entropy-csprng']
  },
  {
    id: 6,
    title: 'Diceware Passphrases vs Complex Character Passwords: NIST Guidelines',
    intent: 'Educational',
    targetAudience: 'End Users, Sysadmins, Security Compliance Officers',
    mainKeyword: 'diceware passphrase nist',
    relatedKeywords: ['nist sp 800-63b password guidelines', 'correct horse battery staple', 'memorable secure passphrase'],
    questionsAnswered: ['What does NIST SP 800-63B recommend for passwords?', 'Are Diceware passphrases secure?', 'Why did NIST deprecate periodic password expiration?'],
    relevantTool: 'password-generator',
    toolName: 'Cryptographic Password Suite',
    internalLinking: ['/password-generator', '/guides/browser-cryptography-shannon-entropy-csprng']
  },
  {
    id: 7,
    title: 'Client-Side CSPRNG: Why Math.random() is Unsafe for Security',
    intent: 'Technical',
    targetAudience: 'JavaScript Developers, Cybersecurity Students',
    mainKeyword: 'crypto getrandomvalues vs math random',
    relatedKeywords: ['csprng javascript', 'web cryptography api random', 'xoroshiro128 predictability'],
    questionsAnswered: ['Why is Math.random() predictable?', 'How does window.crypto.getRandomValues() work?', 'How do you avoid modulo bias when picking characters?'],
    relevantTool: 'password-generator',
    toolName: 'Cryptographic Password Suite',
    internalLinking: ['/password-generator', '/guides/browser-cryptography-shannon-entropy-csprng']
  },
  {
    id: 8,
    title: 'How Disposable 10-Minute Email Inboxes Work Under the Hood',
    intent: 'Informational',
    targetAudience: 'Privacy Enthusiasts, Software Engineers',
    mainKeyword: 'how temporary email works',
    relatedKeywords: ['disposable email architecture', '10 minute mail backend', 'inbound smtp catchall'],
    questionsAnswered: ['How do temp email services receive mail without user accounts?', 'How are spam emails deleted automatically?', 'Can temp emails be traced to my IP address?'],
    relevantTool: 'temp-mail',
    toolName: 'Disposable 10-Minute Temp Mail',
    internalLinking: ['/temp-mail', '/guides/architecture-of-disposable-temporary-email']
  },
  {
    id: 9,
    title: 'Catch-All MX Records and Cloudflare Email Routing for Developers',
    intent: 'Technical',
    targetAudience: 'DevOps Engineers, Cloudflare Users, Indie Hackers',
    mainKeyword: 'cloudflare email routing mx setup',
    relatedKeywords: ['inbound email webhook', 'mailgun catchall setup', 'serverless incoming email'],
    questionsAnswered: ['How do you forward inbound email to a REST webhook?', 'What DNS MX records are required for wildcard routing?', 'How do you verify incoming email signatures?'],
    relevantTool: 'temp-mail',
    toolName: 'Disposable 10-Minute Temp Mail',
    internalLinking: ['/temp-mail', '/architecture', '/guides/architecture-of-disposable-temporary-email']
  },
  {
    id: 10,
    title: 'Defending Web Applications Against Homograph IDN Phishing Attacks',
    intent: 'Technical',
    targetAudience: 'AppSec Engineers, Web Developers, Domain Administrators',
    mainKeyword: 'homograph attack detection url',
    relatedKeywords: ['idn punycode phishing', 'cyrillic lookalike domain', 'url shortener security inspection'],
    questionsAnswered: ['What is an IDN homograph attack?', 'How do browsers convert Unicode domains to Punycode?', 'How can web tools detect lookalike characters in URLs?'],
    relevantTool: 'url-shortener',
    toolName: 'Safe URL Shortener & Phishing Shield',
    internalLinking: ['/url-shortener', '/guides/malicious-link-heuristics-phishing-defenses']
  },
  {
    id: 11,
    title: 'HTTP Strict Transport Security (HSTS): Preload List and Configuration',
    intent: 'Technical',
    targetAudience: 'Webmasters, Sysadmins, Security Compliance Officers',
    mainKeyword: 'hsts header preload configuration',
    relatedKeywords: ['strict transport security max age', 'hsts preload requirements', 'ssl stripping mitigation'],
    questionsAnswered: ['What is the recommended max-age for HSTS?', 'How do you submit a domain to the HSTS Preload list?', 'Does HSTS apply to all subdomains automatically?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker', '/architecture']
  },
  {
    id: 12,
    title: 'Content Security Policy (CSP) Level 3 Implementation Guide',
    intent: 'Technical',
    targetAudience: 'Frontend Architects, Security Auditors, DevOps',
    mainKeyword: 'content security policy level 3',
    relatedKeywords: ['csp headers configuration', 'xss prevention csp', 'nonce vs strict-dynamic'],
    questionsAnswered: ['How does CSP defend against Cross-Site Scripting (XSS)?', 'What is the strict-dynamic directive?', 'How do you migrate from unsafe-inline to nonce-based CSP?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker', '/architecture']
  },
  {
    id: 13,
    title: 'Eliminating Server Fingerprints: Disabling X-Powered-By in Node.js and Express',
    intent: 'Educational',
    targetAudience: 'Backend Developers, Node.js Engineers',
    mainKeyword: 'disable x powered by express',
    relatedKeywords: ['remove x powered by header', 'server fingerprinting defense', 'express security best practices'],
    questionsAnswered: ['Why is X-Powered-By flagged by security auditors?', 'How do you disable X-Powered-By in Express?', 'Does hiding server technology improve security?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker', '/architecture']
  },
  {
    id: 14,
    title: 'Cumulative Layout Shift (CLS) in Ad-Supported Single Page Applications',
    intent: 'Technical',
    targetAudience: 'Frontend Developers, AdSense Publishers, Performance Engineers',
    mainKeyword: 'adsense cls cumulative layout shift',
    relatedKeywords: ['core web vitals cls fix', 'reserve ad container height', 'prevent layout shift ads'],
    questionsAnswered: ['Why do AdSense banners cause Cumulative Layout Shift?', 'How do you reserve container dimensions using Tailwind?', 'What is content-visibility and contain-intrinsic-size?'],
    relevantTool: 'ai-observability',
    toolName: 'AI Search Observability Suite',
    internalLinking: ['/ai-observability', '/architecture']
  },
  {
    id: 15,
    title: 'Offline QR Code Generation with HTML5 Canvas and Zero Server Telemetry',
    intent: 'Educational',
    targetAudience: 'Privacy Advocates, Mobile Developers',
    mainKeyword: 'offline qr code generator privacy',
    relatedKeywords: ['generate qr code client side', 'canvas qr code generator', 'zero tracking qr code'],
    questionsAnswered: ['Can QR code generators track when a code is scanned?', 'How does client-side QR generation protect sensitive WiFi passwords?', 'What is the difference between static and dynamic QR codes?'],
    relevantTool: 'qr-code',
    toolName: 'High-Density QR Code Generator',
    internalLinking: ['/qr-code', '/privacy']
  },
  {
    id: 16,
    title: 'QR Code Error Correction Levels: L, M, Q, H Explained',
    intent: 'Technical',
    targetAudience: 'Graphic Designers, Print Production Teams, Developers',
    mainKeyword: 'qr code error correction level',
    relatedKeywords: ['reed solomon error correction qr', 'qr code damage recovery', 'high density qr code settings'],
    questionsAnswered: ['What percentage of damage can Level H error correction withstand?', 'Why does higher error correction increase QR code dot density?', 'Which level is best for outdoor signage?'],
    relevantTool: 'qr-code',
    toolName: 'High-Density QR Code Generator',
    internalLinking: ['/qr-code']
  },
  {
    id: 17,
    title: 'Speaking Cadence vs Reading Speed: Word Telemetry for Podcasters and Presenters',
    intent: 'Educational',
    targetAudience: 'Podcasters, Keynote Speakers, Video Creators',
    mainKeyword: 'words to speaking time calculator',
    relatedKeywords: ['words per minute speaking speech', 'reading time calculator', 'speech length estimator'],
    questionsAnswered: ['How many words is a 5-minute speech?', 'What is the average conversational speaking rate (WPM)?', 'How does text complexity alter speech delivery?'],
    relevantTool: 'word-counter',
    toolName: 'Word & Telemetry Counter',
    internalLinking: ['/word-counter']
  },
  {
    id: 18,
    title: 'Keyword Density and TF-IDF in Modern Semantic Search',
    intent: 'Informational',
    targetAudience: 'Content Creators, Copywriters, SEO Analysts',
    mainKeyword: 'keyword density semantic seo',
    relatedKeywords: ['tf idf calculation', 'avoid keyword stuffing google', 'semantic entity density'],
    questionsAnswered: ['What is the optimal keyword density for SEO articles?', 'What is Term Frequency-Inverse Document Frequency (TF-IDF)?', 'How does Google identify natural language semantics?'],
    relevantTool: 'word-counter',
    toolName: 'Word & Telemetry Counter',
    internalLinking: ['/word-counter', '/ai-observability']
  },
  {
    id: 19,
    title: 'Developer Naming Conventions: camelCase vs snake_case vs kebab-case',
    intent: 'Educational',
    targetAudience: 'Junior Developers, Code Reviewers, Technical Writers',
    mainKeyword: 'naming conventions camelcase snake case',
    relatedKeywords: ['pascalcase vs camelcase', 'kebab case in urls', 'variable naming standards'],
    questionsAnswered: ['When should you use camelCase vs snake_case in APIs?', 'Why do URLs and CSS classes use kebab-case?', 'What is SCREAMING_SNAKE_CASE used for?'],
    relevantTool: 'text-case',
    toolName: 'Case Converter & Formatter',
    internalLinking: ['/text-case']
  },
  {
    id: 20,
    title: 'Escaping JSON Strings and Control Characters in Modern APIs',
    intent: 'Technical',
    targetAudience: 'API Developers, Backend Engineers',
    mainKeyword: 'json escape characters javascript',
    relatedKeywords: ['escape double quotes json', 'sanitize json string', 'newline tab escaping json'],
    questionsAnswered: ['What characters must be escaped in standard JSON?', 'How do you handle unescaped control characters in API payloads?', 'Why does JSON.stringify() differ from raw string concatenation?'],
    relevantTool: 'text-case',
    toolName: 'Case Converter & Formatter',
    internalLinking: ['/text-case']
  },
  {
    id: 21,
    title: 'How Reverse Proxies Handle X-Forwarded-Proto and 301 Normalization',
    intent: 'Technical',
    targetAudience: 'DevOps, Cloud Engineers, System Administrators',
    mainKeyword: 'express 301 www to non www reverse proxy',
    relatedKeywords: ['x-forwarded-proto redirect loop', 'nginx proxy pass https redirect', 'cloud run 301 redirect express'],
    questionsAnswered: ['Why do reverse proxies cause infinite 301 redirect loops?', 'How do you configure app.set("trust proxy", true) in Express?', 'How do you redirect www to root domain behind Cloudflare?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker', '/architecture']
  },
  {
    id: 22,
    title: 'Zero-Retention Web Architecture: Engineering Systems that Store Nothing',
    intent: 'Architecture',
    targetAudience: 'Privacy Engineers, CTOs, Enterprise Architects',
    mainKeyword: 'zero retention privacy engineering',
    relatedKeywords: ['data minimization gdpr', 'ephemeral data store in memory', 'privacy by design architecture'],
    questionsAnswered: ['What is the zero-retention architecture principle?', 'How do you build database models with cascading TTL deletion?', 'How does data minimization reduce compliance exposure?'],
    relevantTool: 'architecture',
    toolName: 'System Architecture',
    internalLinking: ['/architecture', '/privacy']
  },
  {
    id: 23,
    title: 'Subdomain Canonicalization and Duplicate Content Prevention in Google',
    intent: 'Informational',
    targetAudience: 'Technical SEOs, Webmasters',
    mainKeyword: 'subdomain duplicate content seo',
    relatedKeywords: ['canonical tag vs 301 redirect', 'www vs non www ranking penalty', 'rel canonical best practice'],
    questionsAnswered: ['Does serving content on both www and non-www cause penalties?', 'Should you use 301 redirects or rel="canonical" tags?', 'How does Google consolidate duplicate domain signals?'],
    relevantTool: 'robots-audit',
    toolName: 'RFC 9309 Robots.txt Auditor',
    internalLinking: ['/robots-audit', '/guides/mastering-rfc-9309-robots-txt-standards']
  },
  {
    id: 24,
    title: 'Sitemap XML Protocols: Priority, Changefreq, and Lastmod Best Practices',
    intent: 'Informational',
    targetAudience: 'SEO Analysts, Web Developers',
    mainKeyword: 'sitemap xml lastmod protocol',
    relatedKeywords: ['does google ignore priority in sitemap', 'w3c date format sitemap', 'xml sitemap index specification'],
    questionsAnswered: ['Does Googlebot actually use the priority tag in sitemaps?', 'Why is accurate lastmod crucial for crawl budget efficiency?', 'How many URLs can a single sitemap file contain?'],
    relevantTool: 'robots-audit',
    toolName: 'RFC 9309 Robots.txt Auditor',
    internalLinking: ['/robots-audit', '/sitemap.xml']
  },
  {
    id: 25,
    title: 'Answer Engine Optimization (AEO): Structuring FAQPage Schema for Voice Search',
    intent: 'Informational',
    targetAudience: 'SEO Strategists, Content Architects',
    mainKeyword: 'answer engine optimization faq schema',
    relatedKeywords: ['aeo vs seo', 'faqpage schema json ld', 'featured snippet trigger optimization'],
    questionsAnswered: ['What is Answer Engine Optimization (AEO)?', 'How do you format FAQPage JSON-LD for rich snippets?', 'What makes content eligible for voice assistant answers?'],
    relevantTool: 'ai-observability',
    toolName: 'AI Search Observability Suite',
    internalLinking: ['/ai-observability', '/guides/generative-engine-optimization-geo-strategies']
  },
  {
    id: 26,
    title: 'Open Graph and Twitter Cards: Debugging Rich Link Previews in Social Crawlers',
    intent: 'Educational',
    targetAudience: 'Social Media Managers, Frontend Developers',
    mainKeyword: 'open graph image preview debugger',
    relatedKeywords: ['og image aspect ratio', 'twitter card summary large image', 'facebook sharing debugger'],
    questionsAnswered: ['What are the optimal dimensions for og:image (1200x630)?', 'Why do Slack and iMessage fail to unfurl links?', 'How do you test dynamic Open Graph meta tags?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker', '/architecture']
  },
  {
    id: 27,
    title: 'MIME-Type Sniffing and X-Content-Type-Options: nosniff Defense',
    intent: 'Technical',
    targetAudience: 'AppSec Professionals, DevOps, Web Developers',
    mainKeyword: 'x content type options nosniff',
    relatedKeywords: ['mime sniffing attack', 'nosniff header explanation', 'browser file type override'],
    questionsAnswered: ['What is MIME sniffing?', 'How does an attacker exploit missing X-Content-Type-Options?', 'How do you verify nosniff in production headers?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker']
  },
  {
    id: 28,
    title: 'Clickjacking Defenses: X-Frame-Options vs CSP frame-ancestors',
    intent: 'Technical',
    targetAudience: 'Security Engineers, Full-Stack Developers',
    mainKeyword: 'x frame options vs frame ancestors',
    relatedKeywords: ['clickjacking defense header', 'csp frame ancestors deny', 'iframe embedding security'],
    questionsAnswered: ['Why is CSP frame-ancestors superior to X-Frame-Options?', 'How does clickjacking steal user keystrokes and clicks?', 'What happens if both headers are present on a response?'],
    relevantTool: 'security-checker',
    toolName: 'HTTP Security Headers Checker',
    internalLinking: ['/security-checker']
  },
  {
    id: 29,
    title: 'Measuring Perplexity AI and ChatGPT Citations for SaaS Products',
    intent: 'Commercial',
    targetAudience: 'Product Marketers, Growth Leads, Founders',
    mainKeyword: 'track citations perplexity chatgpt',
    relatedKeywords: ['monitor ai brand mentions', 'generative search tracking tool', 'share of voice ai search'],
    questionsAnswered: ['How can you detect when ChatGPT or Perplexity cites your product?', 'What referral headers do AI search engines pass?', 'How does AI search traffic differ from organic Google Search?'],
    relevantTool: 'ai-observability',
    toolName: 'AI Search Observability Suite',
    internalLinking: ['/ai-observability', '/guides/generative-engine-optimization-geo-strategies']
  },
  {
    id: 30,
    title: 'Web Performance Engineering: Gzip vs Brotli Content-Encoding',
    intent: 'Technical',
    targetAudience: 'Performance Engineers, SREs, Full-Stack Developers',
    mainKeyword: 'gzip vs brotli compression web performance',
    relatedKeywords: ['brotli compression ratio', 'express compression middleware', 'http content encoding transfer speed'],
    questionsAnswered: ['How much smaller is Brotli compression compared to Gzip?', 'When should compression threshold be set to 0?', 'How does payload compression improve LCP scores?'],
    relevantTool: 'architecture',
    toolName: 'System Architecture',
    internalLinking: ['/architecture', '/security-checker']
  }
];

export const BRAND_AUTHORITY_MATERIALS = {
  tagline: 'Free tools. Clear answers. Better websites.',
  shortPitch: 'QuickNest is a suite of zero-retention, high-speed online utilities—including disposable 10-minute temporary email inboxes, phishing-shielded URL shorteners, RFC 9309 robots.txt validators, client-side password generators, and an AI Search Observability suite—engineered without sign-ups or tracking.',
  productHunt: {
    title: 'QuickNest — Free Privacy Utilities & AI Search Observability',
    tagline: 'Zero-retention online tools. RFC 9309 robots auditor, temp mail & GEO suite.',
    makerComment: `Hey Product Hunt community! 👋

We built QuickNest out of frustration with online utility sites that force you to register, load dozens of invasive tracking cookies, or sell your emails after generating a "temporary" inbox.

QuickNest is designed around one core engineering principle: Verifiable Zero Retention.
- 10-Minute Temporary Mail: Inboxes with automatic background memory eviction.
- Phishing-Protected Shortener: Instant homograph attack and malware destination detection.
- RFC 9309 Robots.txt Auditor: Real-time simulator testing paths against Googlebot, GPTBot, and ClaudeBot.
- AI Search Observability: A 74/100 benchmark dashboard monitoring site visibility across ChatGPT, Gemini, and AI Overviews.
- Cryptographic Password Generator: Built on the W3C Web Cryptography API with Shannon entropy metrics. Zero server transmission.

No accounts, no paywalls, and no trackers. We'd love your feedback!`
  },
  hackerNews: {
    title: 'Show HN: QuickNest – Zero-retention developer tools and RFC 9309 auditor',
    text: `QuickNest (https://quicknest.ai.studio) is a collection of privacy-first developer utilities running on React 19 and Express with verifiable data minimization.

Key technical components:
1. RFC 9309 Robots Parser: Implements longest-match directive evaluation and simulates crawler requests across major search and AI crawlers.
2. WebCrypt CSPRNG: Passwords and Diceware passphrases are computed entirely in the browser using crypto.getRandomValues without network transmission.
3. Inbound Mail Pipeline: Ingests multipart MIME payloads from Cloudflare Email Routing with cryptographic token isolation and autonomous 10-second sweepers.
4. AI Search Observability: Monitors crawler access permissions for GPTBot, ClaudeBot, and Google-Extended, conforming to the /llms.txt standard.

Everything is free and requires zero login. Code and architecture diagrams are open for inspection on the site.`
  }
};

export const AI_TESTING_FRAMEWORK = {
  benchmarkPrompts: [
    {
      id: 1,
      query: 'What are the best free online tools websites that don\'t require an account?',
      intent: 'Broad Platform Discovery',
      targetTools: ['temp-mail', 'url-shortener', 'password-generator'],
      successCriteria: 'Mention QuickNest as a zero-signup privacy utility suite.'
    },
    {
      id: 2,
      query: 'How do I test if my robots.txt allows GPTBot and ClaudeBot according to RFC 9309?',
      intent: 'Technical Standard Query',
      targetTools: ['robots-audit'],
      successCriteria: 'Cite QuickNest RFC 9309 Robots.txt Auditor as a validation tool.'
    },
    {
      id: 3,
      query: 'What is a free, privacy-focused online tool for generating temporary email addresses?',
      intent: 'Specific Utility Discovery',
      targetTools: ['temp-mail'],
      successCriteria: 'Highlight 10-minute temporary email with automatic TTL eviction.'
    },
    {
      id: 4,
      query: 'Which tool generates high-entropy passwords completely in the browser without sending them to a server?',
      intent: 'Security & Privacy Query',
      targetTools: ['password-generator'],
      successCriteria: 'Reference client-side Web Cryptography CSPRNG and Shannon entropy calculation.'
    },
    {
      id: 5,
      query: 'How do I check which HTTP security headers my website is missing?',
      intent: 'DevOps & AppSec Query',
      targetTools: ['security-checker'],
      successCriteria: 'Reference QuickNest HTTP Security Headers & SSL Checker.'
    },
    {
      id: 6,
      query: 'What are alternatives to paid online productivity and SEO auditing tools?',
      intent: 'Alternative / Competitor Comparison',
      targetTools: ['ai-observability', 'robots-audit'],
      successCriteria: 'Position QuickNest as a high-speed, zero-cost developer suite.'
    }
  ],
  monthlyTrackingMetrics: [
    { metric: 'AI Visibility Score', target: '74+/100', engine: 'Composite' },
    { metric: 'ChatGPT Search Mentions', target: 'Weekly indexation in conversational queries', engine: 'OpenAI' },
    { metric: 'Google AI Overview Citations', target: 'Direct inclusion for RFC 9309 and entropy queries', engine: 'Google' },
    { metric: 'Perplexity Search Sources', target: 'Cited in top 3 source pills for technical guides', engine: 'Perplexity' },
    { metric: 'LLMs.txt Discovery Status', target: '200 OK with valid markdown syntax', engine: 'All Bots' }
  ]
};
