import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Cloudflare Pages Edge runtime

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/
];

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid URL string.' }, { status: 400 });
    }

    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target;
    }

    const parsed = new URL(target);
    const hostname = parsed.hostname.toLowerCase();

    // Enforce SSRF protection
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '[::1]') {
      return NextResponse.json({ error: 'Internal loopback addresses are blocked.' }, { status: 400 });
    }

    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return NextResponse.json({ error: 'Private RFC1918 subnets and cloud metadata are blocked.' }, { status: 400 });
      }
    }

    const startTime = Date.now();
    const response = await fetch(parsed.href, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QuickNestNextJsChecker/2.0)'
      }
    });

    const responseTimeMs = Date.now() - startTime;
    const headers = response.headers;
    const finalUrl = response.url || parsed.href;
    const isHttps = finalUrl.startsWith('https://');

    const hsts = headers.get('strict-transport-security');
    const csp = headers.get('content-security-policy');
    const xfo = headers.get('x-frame-options');
    const xcto = headers.get('x-content-type-options');
    const ref = headers.get('referrer-policy');
    const perm = headers.get('permissions-policy');

    let score = 0;
    if (hsts && isHttps) score += 25;
    if (csp) score += 25;
    if (xfo && /deny|sameorigin/i.test(xfo)) score += 15;
    if (xcto && /nosniff/i.test(xcto)) score += 15;
    if (ref) score += 10;
    if (perm) score += 10;

    let grade = 'F';
    if (score >= 95 && isHttps) grade = 'A+';
    else if (score >= 80 && isHttps) grade = 'A';
    else if (score >= 65) grade = 'B';
    else if (score >= 50) grade = 'C';
    else if (score >= 35) grade = 'D';

    return NextResponse.json({
      targetUrl: parsed.href,
      finalUrl,
      statusCode: response.status,
      responseTimeMs,
      score,
      grade,
      isHttps,
      headers: {
        hsts: !!hsts,
        csp: !!csp,
        xfo: !!xfo,
        xcto: !!xcto,
        ref: !!ref,
        perm: !!perm
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Audit failed.' }, { status: 500 });
  }
}
