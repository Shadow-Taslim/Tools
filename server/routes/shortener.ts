import { Router, Request, Response } from 'express';
import { store } from '../store.ts';
import { evaluateUrlSafety } from '../malware-checker.ts';

const router = Router();

// Create shortened URL (supports both POST /api/shorten and POST /api/shorten/shorten)
router.post(['/', '/shorten'], (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Strict rate limit for link creation: 15 per minute per IP
  if (!store.checkRateLimit(clientIp, 15, 60_000)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute before shortening more links.' });
  }

  const { url, customCode, directRedirect = true, expiresInDays } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid URL to shorten.' });
  }

  // Prepend protocol if omitted
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Safety inspection
  const safety = evaluateUrlSafety(normalizedUrl);
  if (!safety.isSafe) {
    return res.status(400).json({
      error: 'URL blocked due to safety violations.',
      reasons: safety.reasons,
      domain: safety.domain,
      riskScore: safety.riskScore
    });
  }

  // Check if custom code is already taken
  if (customCode) {
    const cleanCode = customCode.trim().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
    if (!cleanCode || cleanCode.length < 3) {
      return res.status(400).json({ error: 'Custom alias must be at least 3 alphanumeric characters.' });
    }
    const existing = store.getShortLink(cleanCode);
    if (existing) {
      return res.status(409).json({ error: 'Custom alias already in use. Please choose another one.' });
    }
  }

  const link = store.createShortLink({
    originalUrl: safety.canonicalUrl,
    customCode,
    domain: safety.domain,
    isMalicious: false,
    maliciousReasons: [],
    allowDirectRedirect: directRedirect,
    expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
  });

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    link,
    shortUrl: `${baseUrl}/s/${link.code}`,
    previewUrl: `${baseUrl}/preview/${link.code}`
  });
});

// Inspect destination before redirecting (Safety preview)
router.get('/preview/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const link = store.getShortLink(code);

  if (!link) {
    return res.status(404).json({ error: 'Short link not found or has expired.' });
  }

  res.json({
    link: {
      code: link.code,
      originalUrl: link.originalUrl,
      title: link.title,
      domain: link.domain,
      isMalicious: link.isMalicious,
      maliciousReasons: link.maliciousReasons,
      clickCount: link.clickCount,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      reportsCount: link.reportsCount
    }
  });
});

// Report abusive or phishing link
router.post('/report', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const { code, reason, details } = req.body || {};

  if (!code || !reason) {
    return res.status(400).json({ error: 'Link code and report reason are required.' });
  }

  const success = store.reportLink(code, reason, details || '', clientIp);
  if (!success) {
    return res.status(404).json({ error: 'Short link does not exist.' });
  }

  res.json({
    success: true,
    message: 'Abuse report submitted. Thank you for keeping the web safe.'
  });
});

// Public stats for a link
router.get('/stats/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const link = store.getShortLink(code);

  if (!link) {
    return res.status(404).json({ error: 'Short link not found or has expired.' });
  }

  res.json({
    code: link.code,
    domain: link.domain,
    clicks: link.clickCount,
    createdAt: link.createdAt,
    lastAccessedAt: link.lastAccessedAt,
    isMalicious: link.isMalicious,
    reportsCount: link.reportsCount
  });
});

export default router;
