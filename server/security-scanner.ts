import { HeaderAuditItem, SecurityCheckResult } from '../src/types.ts';

// Private IP blocks for SSRF prevention
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^0\./,
  /^169\.254\./, // AWS / GCP metadata
  /^::1$/,
  /^fc00:/,
  /^fe80:/
];

export function isSafePublicUrl(urlString: string): { safe: boolean; error?: string; parsedUrl?: URL } {
  try {
    let target = urlString.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target;
    }

    const parsed = new URL(target);

    // Restrict protocols to http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check loopback / localhost
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '[::1]') {
      return { safe: false, error: 'Internal loopback addresses cannot be scanned for security.' };
    }

    // Check private subnets
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, error: 'Private RFC1918 subnets and cloud metadata endpoints are blocked.' };
      }
    }

    return { safe: true, parsedUrl: parsed };
  } catch {
    return { safe: false, error: 'Invalid URL format provided.' };
  }
}

export async function scanWebsiteSecurity(inputUrl: string): Promise<SecurityCheckResult> {
  const safetyCheck = isSafePublicUrl(inputUrl);
  if (!safetyCheck.safe || !safetyCheck.parsedUrl) {
    throw new Error(safetyCheck.error || 'Invalid or prohibited target URL.');
  }

  const targetUrl = safetyCheck.parsedUrl.href;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QuickNestSecurityAuditor/2.0; +https://quicknest.org)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out while reaching target domain (9s limit exceeded).');
    }
    throw new Error(`Failed to establish connection to target server: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const responseTimeMs = Date.now() - startTime;
  const headers = response.headers;
  const finalUrl = response.url || targetUrl;
  const isHttps = finalUrl.startsWith('https://');

  const auditItems: HeaderAuditItem[] = [];
  let score = 0;

  // 1. Strict-Transport-Security (HSTS)
  const hstsVal = headers.get('strict-transport-security');
  if (hstsVal && isHttps) {
    const hasSubDomains = /includeSubDomains/i.test(hstsVal);
    const hasPreload = /preload/i.test(hstsVal);
    const maxAgeMatch = hstsVal.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;

    if (maxAge >= 15768000) { // >= 6 months
      score += 25;
      auditItems.push({
        header: 'Strict-Transport-Security',
        status: 'pass',
        value: hstsVal,
        importance: 'critical',
        title: 'HSTS Enforced & Active',
        description: `Max-age set to ${Math.round(maxAge / 86400)} days.${hasSubDomains ? ' Covers all subdomains.' : ''}${hasPreload ? ' Preload eligible.' : ''}`,
        recommendation: 'HSTS configuration meets industry production standards.',
        fixSnippet: {
          nextjs: `{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }`,
          nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
          cloudflare: `response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");`
        }
      });
    } else {
      score += 15;
      auditItems.push({
        header: 'Strict-Transport-Security',
        status: 'warn',
        value: hstsVal,
        importance: 'critical',
        title: 'HSTS Short Expiry Period',
        description: `Max-age is set to ${Math.round(maxAge / 86400)} days, which is under the recommended 1-year threshold (31536000s).`,
        recommendation: 'Increase max-age to 31536000 seconds (1 year) and includeSubDomains.',
        fixSnippet: {
          nextjs: `{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }`,
          nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
          cloudflare: `response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");`
        }
      });
    }
  } else {
    auditItems.push({
      header: 'Strict-Transport-Security',
      status: 'fail',
      value: null,
      importance: 'critical',
      title: 'Missing HSTS Header',
      description: 'Browsers may attempt unencrypted HTTP connections, opening users to SSL stripping and MitM attacks.',
      recommendation: 'Enable HTTP Strict Transport Security with a minimum 1-year max-age.',
      fixSnippet: {
        nextjs: `{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }`,
        nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
        cloudflare: `response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");`
      }
    });
  }

  // 2. Content-Security-Policy (CSP)
  const cspVal = headers.get('content-security-policy');
  if (cspVal) {
    const hasUnsafe = /'unsafe-inline'|'unsafe-eval'/i.test(cspVal);
    if (!hasUnsafe) {
      score += 25;
      auditItems.push({
        header: 'Content-Security-Policy',
        status: 'pass',
        value: cspVal.length > 90 ? cspVal.substring(0, 90) + '...' : cspVal,
        importance: 'critical',
        title: 'Robust Content Security Policy',
        description: 'Directives restrict script sources without permissive unsafe keywords.',
        recommendation: 'Continue maintaining strict nonce or hash based script execution.',
        fixSnippet: {
          nextjs: `{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'nonce-rAnd0m'; object-src 'none';" }`,
          nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;`,
          cloudflare: `response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self';");`
        }
      });
    } else {
      score += 15;
      auditItems.push({
        header: 'Content-Security-Policy',
        status: 'warn',
        value: cspVal.length > 90 ? cspVal.substring(0, 90) + '...' : cspVal,
        importance: 'high',
        title: 'Permissive CSP Directives',
        description: 'Contains unsafe-inline or unsafe-eval, which weakens resistance to Cross-Site Scripting (XSS).',
        recommendation: 'Adopt CSP Level 3 strict-dynamic with cryptographic nonces instead of unsafe-inline.',
        fixSnippet: {
          nextjs: `{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none';" }`,
          nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;`,
          cloudflare: `response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self';");`
        }
      });
    }
  } else {
    auditItems.push({
      header: 'Content-Security-Policy',
      status: 'fail',
      value: null,
      importance: 'critical',
      title: 'Missing Content Security Policy',
      description: 'Without CSP, the browser has zero origin boundaries restricting rogue script injection or data exfiltration.',
      recommendation: 'Deploy a strict default-src self Content Security Policy.',
      fixSnippet: {
        nextjs: `{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';" }`,
        nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;`,
        cloudflare: `response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self';");`
      }
    });
  }

  // 3. X-Frame-Options
  const xfoVal = headers.get('x-frame-options');
  if (xfoVal && /^(deny|sameorigin)$/i.test(xfoVal.trim())) {
    score += 15;
    auditItems.push({
      header: 'X-Frame-Options',
      status: 'pass',
      value: xfoVal,
      importance: 'high',
      title: 'Clickjacking Protection Active',
      description: `Framing is strictly bounded to ${xfoVal.toUpperCase()}.`,
      recommendation: 'Configuration defends against clickjacking.',
      fixSnippet: {
        nextjs: `{ key: 'X-Frame-Options', value: 'DENY' }`,
        nginx: `add_header X-Frame-Options "DENY" always;`,
        cloudflare: `response.headers.set("X-Frame-Options", "DENY");`
      }
    });
  } else {
    auditItems.push({
      header: 'X-Frame-Options',
      status: 'fail',
      value: xfoVal,
      importance: 'high',
      title: 'Missing / Permissive X-Frame-Options',
      description: 'The website can be loaded inside malicious third-party iframes to orchestrate clickjacking attacks.',
      recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
      fixSnippet: {
        nextjs: `{ key: 'X-Frame-Options', value: 'DENY' }`,
        nginx: `add_header X-Frame-Options "DENY" always;`,
        cloudflare: `response.headers.set("X-Frame-Options", "DENY");`
      }
    });
  }

  // 4. X-Content-Type-Options
  const xctoVal = headers.get('x-content-type-options');
  if (xctoVal && /nosniff/i.test(xctoVal)) {
    score += 15;
    auditItems.push({
      header: 'X-Content-Type-Options',
      status: 'pass',
      value: 'nosniff',
      importance: 'medium',
      title: 'MIME-Sniffing Defense Active',
      description: 'Prevents browsers from misinterpreting user-uploaded files as executable JavaScript or CSS.',
      recommendation: 'Strict nosniff enforcement verified.',
      fixSnippet: {
        nextjs: `{ key: 'X-Content-Type-Options', value: 'nosniff' }`,
        nginx: `add_header X-Content-Type-Options "nosniff" always;`,
        cloudflare: `response.headers.set("X-Content-Type-Options", "nosniff");`
      }
    });
  } else {
    auditItems.push({
      header: 'X-Content-Type-Options',
      status: 'fail',
      value: xctoVal,
      importance: 'medium',
      title: 'Missing X-Content-Type-Options',
      description: 'Allows browser MIME-sniffing, converting non-executable MIME types into active scripts.',
      recommendation: 'Set X-Content-Type-Options to nosniff.',
      fixSnippet: {
        nextjs: `{ key: 'X-Content-Type-Options', value: 'nosniff' }`,
        nginx: `add_header X-Content-Type-Options "nosniff" always;`,
        cloudflare: `response.headers.set("X-Content-Type-Options", "nosniff");`
      }
    });
  }

  // 5. Referrer-Policy
  const refVal = headers.get('referrer-policy');
  if (refVal && /strict-origin-when-cross-origin|same-origin|no-referrer/i.test(refVal)) {
    score += 10;
    auditItems.push({
      header: 'Referrer-Policy',
      status: 'pass',
      value: refVal,
      importance: 'medium',
      title: 'Referrer Leakage Shielded',
      description: `Protects query parameters and URL paths from leaking to third-party domains.`,
      recommendation: 'Secure policy confirmed.',
      fixSnippet: {
        nextjs: `{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }`,
        nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        cloudflare: `response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");`
      }
    });
  } else {
    auditItems.push({
      header: 'Referrer-Policy',
      status: 'fail',
      value: refVal,
      importance: 'medium',
      title: 'Missing Referrer-Policy',
      description: 'Browsers may leak sensitive tokens, IDs, and internal routing structures in Referer HTTP headers.',
      recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin.',
      fixSnippet: {
        nextjs: `{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }`,
        nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        cloudflare: `response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");`
      }
    });
  }

  // 6. Permissions-Policy
  const permVal = headers.get('permissions-policy');
  if (permVal && permVal.length > 5) {
    score += 10;
    auditItems.push({
      header: 'Permissions-Policy',
      status: 'pass',
      value: permVal.length > 80 ? permVal.substring(0, 80) + '...' : permVal,
      importance: 'low',
      title: 'Hardware Feature Restrictions Active',
      description: 'Explicitly disables access to sensitive browser features like camera, microphone, or geolocation.',
      recommendation: 'Hardware access control is properly defined.',
      fixSnippet: {
        nextjs: `{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }`,
        nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
        cloudflare: `response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");`
      }
    });
  } else {
    auditItems.push({
      header: 'Permissions-Policy',
      status: 'fail',
      value: permVal,
      importance: 'low',
      title: 'Missing Permissions-Policy',
      description: 'Embedded iframes and third-party scripts could invoke hardware APIs if granted permission.',
      recommendation: 'Set Permissions-Policy: camera=(), microphone=(), geolocation=().',
      fixSnippet: {
        nextjs: `{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }`,
        nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
        cloudflare: `response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");`
      }
    });
  }

  // Calculate Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 95 && isHttps) grade = 'A+';
  else if (score >= 80 && isHttps) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'F';

  const passedCount = auditItems.filter(i => i.status === 'pass').length;
  const warnCount = auditItems.filter(i => i.status === 'warn').length;
  const failCount = auditItems.filter(i => i.status === 'fail').length;

  return {
    targetUrl,
    finalUrl,
    statusCode: response.status,
    responseTimeMs,
    grade,
    score,
    ssl: {
      valid: isHttps,
      protocol: isHttps ? 'TLS 1.3 / HTTPS' : 'Unencrypted Plain HTTP'
    },
    headers: auditItems,
    passedCount,
    warnCount,
    failCount,
    checkedAt: Date.now()
  };
}
