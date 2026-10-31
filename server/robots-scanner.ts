/**
 * Robots.txt Parser, Security & SEO Auditor, and RFC 9309 Path Simulator
 */

import { evaluateUrlSafety } from './malware-checker.ts';

export interface RobotsRule {
  type: 'allow' | 'disallow';
  pattern: string;
  line: number;
}

export interface UserAgentGroup {
  agents: string[];
  rules: RobotsRule[];
  crawlDelay?: number;
}

export interface AuditIssue {
  severity: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  description: string;
  recommendation: string;
  affectedLine?: number;
}

export interface RobotsAuditResult {
  rawContent: string;
  sourceUrl?: string;
  totalLines: number;
  groupsCount: number;
  sitemaps: string[];
  issues: AuditIssue[];
  healthScore: number; // 0 - 100
  isSiteBlocked: boolean;
  hasSitemap: boolean;
  blocksAssets: boolean;
  privatePathsExposed: string[];
  aiBotsManaged: boolean;
}

export interface PathTestResult {
  path: string;
  userAgent: string;
  allowed: boolean;
  matchedRule: string | null;
  matchedLine: number | null;
  reason: string;
}

export function parseRobotsTxt(content: string) {
  const lines = content.split(/\r?\n/);
  const groups: UserAgentGroup[] = [];
  const sitemaps: string[] = [];
  let currentAgents: string[] = [];
  let currentRules: RobotsRule[] = [];
  let currentDelay: number | undefined = undefined;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNumber = idx + 1;
    // Strip comments
    let line = lines[idx];
    const hashIndex = line.indexOf('#');
    if (hashIndex !== -1) {
      line = line.substring(0, hashIndex);
    }
    line = line.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.substring(0, colonIdx).trim().toLowerCase();
    const value = line.substring(colonIdx + 1).trim();

    if (directive === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }

    if (directive === 'user-agent') {
      if (currentRules.length > 0) {
        // Save previous group
        if (currentAgents.length > 0) {
          groups.push({
            agents: [...currentAgents],
            rules: [...currentRules],
            crawlDelay: currentDelay
          });
        }
        currentAgents = [];
        currentRules = [];
        currentDelay = undefined;
      }
      if (value) {
        currentAgents.push(value.toLowerCase());
      }
    } else if (directive === 'disallow') {
      currentRules.push({
        type: 'disallow',
        pattern: value,
        line: lineNumber
      });
    } else if (directive === 'allow') {
      currentRules.push({
        type: 'allow',
        pattern: value,
        line: lineNumber
      });
    } else if (directive === 'crawl-delay') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) currentDelay = parsed;
    }
  }

  // Push final group
  if (currentAgents.length > 0) {
    groups.push({
      agents: currentAgents,
      rules: currentRules,
      crawlDelay: currentDelay
    });
  }

  return { groups, sitemaps, rawLines: lines };
}

export function auditRobotsContent(content: string, sourceUrl?: string): RobotsAuditResult {
  const { groups, sitemaps, rawLines } = parseRobotsTxt(content);
  const issues: AuditIssue[] = [];

  let isSiteBlocked = false;
  let blocksAssets = false;
  const privatePathsExposed: string[] = [];
  let aiBotsManaged = false;

  // 1. Check for empty or missing content
  if (!content.trim()) {
    issues.push({
      severity: 'critical',
      title: 'Empty robots.txt File',
      description: 'Your robots.txt file is completely blank. Search engine crawlers interpret an empty file as full access with no restrictions, but you have no sitemap or privacy protections.',
      recommendation: 'Declare standard crawler directives (e.g., Allow: /) and disallow internal/private API routes.'
    });
  }

  // 2. Check universal wildcard group (*)
  const wildcardGroup = groups.find(g => g.agents.includes('*'));
  if (!wildcardGroup && groups.length > 0) {
    issues.push({
      severity: 'warning',
      title: 'No Universal "User-agent: *" Directive Found',
      description: 'No default fallback rule exists for standard web crawlers. Only specifically named bots will have rules applied.',
      recommendation: 'Add a "User-agent: *" block to define fallback indexing permissions for all search engines.'
    });
  }

  // 3. Check for catastrophic "Disallow: /" (Site-wide blockage)
  if (wildcardGroup) {
    const catchAllDisallow = wildcardGroup.rules.find(r => r.type === 'disallow' && (r.pattern === '/' || r.pattern === '/*'));
    const hasAllows = wildcardGroup.rules.some(r => r.type === 'allow');

    if (catchAllDisallow && !hasAllows) {
      isSiteBlocked = true;
      issues.push({
        severity: 'critical',
        title: 'Catastrophic Block: All Pages Blocked from Search Engines',
        description: `Line ${catchAllDisallow.line} contains "Disallow: ${catchAllDisallow.pattern}" with no Allow exceptions. Google, Bing, and other search engines are prohibited from indexing your entire website.`,
        recommendation: 'Remove "Disallow: /" or specify particular directory paths instead of the entire root.',
        affectedLine: catchAllDisallow.line
      });
    }
  }

  // 4. Check for blocking CSS/JS/Asset files (Google Mobile-Friendly Violation)
  for (const group of groups) {
    for (const rule of group.rules) {
      if (rule.type === 'disallow') {
        const pat = rule.pattern.toLowerCase();
        if (pat.includes('.css') || pat.includes('.js') || pat.includes('/_next/static') || pat.includes('/assets/')) {
          blocksAssets = true;
          issues.push({
            severity: 'critical',
            title: `Asset Blocking Directive: "${rule.pattern}"`,
            description: `Line ${rule.line} disallows stylesheets or script assets. Google Webmaster Guidelines strictly penalize sites that block CSS/JS because Googlebot cannot properly render your page for mobile responsiveness.`,
            recommendation: `Allow search engines full access to CSS, JS, and image assets so pages can render accurately.`,
            affectedLine: rule.line
          });
        }
      }
    }
  }

  // 5. Check for exposed sensitive admin/private paths
  const sensitiveKeywords = [
    'admin', 'wp-admin', 'backend', 'cpanel', 'phpmyadmin', 
    'internal', 'staging', 'secret', 'confidential', '.env', 'backup'
  ];

  for (const group of groups) {
    for (const rule of group.rules) {
      if (rule.type === 'disallow') {
        const pat = rule.pattern.toLowerCase();
        for (const word of sensitiveKeywords) {
          if (pat.includes(`/${word}`) || pat.includes(`_${word}`)) {
            privatePathsExposed.push(rule.pattern);
            issues.push({
              severity: 'warning',
              title: `Sensitive Path Exposed in Public File: "${rule.pattern}"`,
              description: `robots.txt is a publicly readable file! Listing "${rule.pattern}" at line ${rule.line} acts as an open roadmap for attackers, revealing your internal architecture.`,
              recommendation: `Never rely on robots.txt for security. Protect private administrative routes with server-side authentication, HTTP 401/403 challenges, or 'noindex' meta tags instead.`,
              affectedLine: rule.line
            });
            break;
          }
        }
      }
    }
  }

  // 6. Check for Sitemap declaration
  const hasSitemap = sitemaps.length > 0;
  if (!hasSitemap) {
    issues.push({
      severity: 'warning',
      title: 'Missing Sitemap Directive',
      description: 'Search engine crawlers rely on the Sitemap: directive in robots.txt to discover canonical URLs and track last-modified dates efficiently.',
      recommendation: 'Add "Sitemap: https://yourdomain.com/sitemap.xml" at the bottom of your robots.txt file.'
    });
  } else {
    for (const sm of sitemaps) {
      if (!sm.startsWith('http://') && !sm.startsWith('https://')) {
        issues.push({
          severity: 'warning',
          title: `Relative or Invalid Sitemap URL: "${sm}"`,
          description: 'Sitemaps must be specified as absolute URLs including protocol (e.g. https://domain.com/sitemap.xml).',
          recommendation: `Update "${sm}" to an absolute HTTPS URL.`
        });
      } else {
        issues.push({
          severity: 'good',
          title: `Valid Sitemap Declared`,
          description: `Search engines can locate your sitemap index at: ${sm}`,
          recommendation: 'Ensure your sitemap is regularly updated whenever new pages are published.'
        });
      }
    }
  }

  // 7. Check AI Scrapers (GPTBot, CCBot, ClaudeBot)
  const aiBotNames = ['gptbot', 'ccbot', 'claudebot', 'google-extended', 'anthropic-ai', 'bytespider'];
  const configuredAiBots = groups.filter(g => g.agents.some(a => aiBotNames.includes(a)));
  if (configuredAiBots.length > 0) {
    aiBotsManaged = true;
    issues.push({
      severity: 'good',
      title: 'Explicit AI Crawler Policies Defined',
      description: `Targeted rules are in place for AI crawlers (${configuredAiBots.map(g => g.agents.join(', ')).join('; ')}).`,
      recommendation: 'Maintain specific policies for AI training bots according to your organization\'s content licensing.'
    });
  } else {
    issues.push({
      severity: 'info',
      title: 'No Explicit AI Crawler Directives',
      description: 'No dedicated rules exist for AI scraping bots like GPTBot or CCBot. They will fall back to your general "User-agent: *" rules.',
      recommendation: 'If you wish to allow search engines (Googlebot, Bingbot) while restricting automated AI model training, add a dedicated block for GPTBot, CCBot, or ClaudeBot.'
    });
  }

  // Calculate health score (0 - 100)
  let healthScore = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') healthScore -= 35;
    else if (issue.severity === 'warning') healthScore -= 12;
    else if (issue.severity === 'info') healthScore -= 2;
  }
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    rawContent: content,
    sourceUrl,
    totalLines: rawLines.length,
    groupsCount: groups.length,
    sitemaps,
    issues,
    healthScore,
    isSiteBlocked,
    hasSitemap,
    blocksAssets,
    privatePathsExposed: Array.from(new Set(privatePathsExposed)),
    aiBotsManaged
  };
}

/**
 * Tests whether a specific path is allowed or disallowed for a given User-Agent
 * following RFC 9309 rules (most specific User-Agent match, longest matching rule pattern)
 */
export function testPathAgainstRobots(content: string, userAgent: string, testPath: string): PathTestResult {
  const { groups } = parseRobotsTxt(content);
  const normalizedAgent = userAgent.trim().toLowerCase() || '*';
  const normalizedPath = testPath.startsWith('/') ? testPath : `/${testPath}`;

  // 1. Find matching group: exact agent match first, then fallback to wildcard '*'
  let matchingGroup: UserAgentGroup | undefined = groups.find(g => 
    g.agents.some(a => a === normalizedAgent || (normalizedAgent.includes(a) && a !== '*'))
  );

  if (!matchingGroup) {
    matchingGroup = groups.find(g => g.agents.includes('*'));
  }

  if (!matchingGroup || matchingGroup.rules.length === 0) {
    return {
      path: normalizedPath,
      userAgent: normalizedAgent,
      allowed: true,
      matchedRule: null,
      matchedLine: null,
      reason: 'No matching user-agent or disallow rules found; access is allowed by default.'
    };
  }

  // 2. Evaluate rules in the matching group
  // According to RFC 9309:
  // "The most specific (longest) pattern matching the path determines the result."
  // If equal length, Allow takes precedence over Disallow.
  let bestMatch: { rule: RobotsRule; matchLength: number } | null = null;

  for (const rule of matchingGroup.rules) {
    if (!rule.pattern) {
      // Empty disallow "Disallow:" means allow all
      if (rule.type === 'disallow' && normalizedPath.length > 0) {
        // Acts like allow
      }
      continue;
    }

    const isMatch = checkPatternMatch(normalizedPath, rule.pattern);
    if (isMatch) {
      const matchLen = rule.pattern.length;
      if (!bestMatch || matchLen > bestMatch.matchLength) {
        bestMatch = { rule, matchLength: matchLen };
      } else if (matchLen === bestMatch.matchLength && rule.type === 'allow' && bestMatch.rule.type === 'disallow') {
        // Allow takes precedence on tie
        bestMatch = { rule, matchLength: matchLen };
      }
    }
  }

  if (!bestMatch) {
    return {
      path: normalizedPath,
      userAgent: normalizedAgent,
      allowed: true,
      matchedRule: null,
      matchedLine: null,
      reason: 'Path did not match any disallow patterns; allowed by default.'
    };
  }

  const isAllowed = bestMatch.rule.type === 'allow';
  return {
    path: normalizedPath,
    userAgent: normalizedAgent,
    allowed: isAllowed,
    matchedRule: `${bestMatch.rule.type.toUpperCase()}: ${bestMatch.rule.pattern}`,
    matchedLine: bestMatch.rule.line,
    reason: isAllowed
      ? `Explicitly allowed by rule on line ${bestMatch.rule.line} (${bestMatch.rule.pattern})`
      : `Disallowed by rule on line ${bestMatch.rule.line} (${bestMatch.rule.pattern})`
  };
}

function checkPatternMatch(path: string, pattern: string): boolean {
  // Convert robots.txt pattern to regex:
  // '*' matches any sequence
  // '$' at the end matches end of path
  let regexStr = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      regexStr += '.*';
    } else if (c === '$' && i === pattern.length - 1) {
      regexStr += '$';
    } else if (['.', '?', '+', '^', '[', ']', '(', ')', '{', '}', '|', '\\', '/'].includes(c)) {
      regexStr += '\\' + c;
    } else {
      regexStr += c;
    }
  }

  if (!pattern.endsWith('$')) {
    // Prefix match
    regexStr += '.*';
  }

  try {
    const reg = new RegExp(regexStr);
    return reg.test(path);
  } catch {
    return path.startsWith(pattern);
  }
}

/**
 * Fetches robots.txt from a remote target with SSRF safety check
 */
export async function fetchRemoteRobotsTxt(targetUrl: string): Promise<string> {
  const safety = evaluateUrlSafety(targetUrl);
  if (!safety.isSafe) {
    throw new Error(`Target URL blocked by security policy: ${safety.reasons.join(', ')}`);
  }

  let formattedUrl = targetUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const parsed = new URL(formattedUrl);
  const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QuickNest-Robots-Auditor/1.0 (+https://quicknest.org/robots-audit)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} when fetching ${robotsUrl}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}
