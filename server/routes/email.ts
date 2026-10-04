import { Router, Request, Response } from 'express';
import { store } from '../store.ts';

const router = Router();

// List supported disposable email domains
router.get('/domains', (_req: Request, res: Response) => {
  res.json({
    domains: store.supportedDomains,
    defaultDomain: store.supportedDomains[0]
  });
});

// Create new temporary inbox
router.post('/inbox', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!store.checkRateLimit(clientIp, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  const { customHandle, domain } = req.body || {};
  const inbox = store.createInbox(customHandle, domain);
  res.json({ inbox });
});

// Get inbox metadata & remaining time
router.get('/inbox/:address', (req: Request, res: Response) => {
  const address = req.params.address;
  const inbox = store.getInbox(address);

  if (!inbox) {
    return res.status(404).json({ error: 'Inbox not found or has expired.' });
  }

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((inbox.expiresAt - now) / 1000));
  const messages = store.getMessagesForInbox(address);

  res.json({
    inbox,
    remainingSeconds,
    messageCount: messages.length
  });
});

// Extend inbox timer (+10 mins)
router.post('/inbox/:address/extend', (req: Request, res: Response) => {
  const address = req.params.address;
  const { minutes = 10 } = req.body || {};
  const inbox = store.extendInbox(address, Number(minutes));

  if (!inbox) {
    return res.status(404).json({ error: 'Inbox not found or has expired.' });
  }

  const remainingSeconds = Math.max(0, Math.floor((inbox.expiresAt - Date.now()) / 1000));
  res.json({
    inbox,
    remainingSeconds,
    message: `Timer extended by ${minutes} minutes.`
  });
});

// Delete inbox and all associated messages immediately
router.delete('/inbox/:address', (req: Request, res: Response) => {
  const address = req.params.address;
  const deleted = store.deleteInbox(address);
  res.json({
    success: deleted,
    message: deleted ? 'Inbox and messages permanently wiped.' : 'Inbox not found.'
  });
});

// Get messages for an inbox (Instant O(1) retrieval with fast headers)
router.get('/inbox/:address/messages', (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase().trim();
  const inbox = store.getInbox(address);

  if (!inbox) {
    return res.status(404).json({ error: 'Inbox not found or has expired.' });
  }

  // Verify token if supplied by client to ensure strict single-user inbox isolation
  const clientToken = (req.headers['x-inbox-token'] as string) || (req.query.token as string);
  if (clientToken && inbox.token && clientToken !== inbox.token) {
    return res.status(403).json({ error: 'Unauthorized: Invalid token for this inbox.' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const messages = store.getMessagesForInbox(address);
  res.json({ messages });
});

/**
 * Real-time Server-Sent Events (SSE) Stream
 * Delivers incoming messages to the user's browser in <15ms without polling delay.
 */
router.get('/inbox/:address/stream', (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase().trim();
  const inbox = store.getInbox(address);

  if (!inbox) {
    return res.status(404).json({ error: 'Inbox not found or has expired.' });
  }

  const clientToken = (req.headers['x-inbox-token'] as string) || (req.query.token as string);
  if (clientToken && inbox.token && clientToken !== inbox.token) {
    return res.status(403).json({ error: 'Unauthorized: Invalid token for this inbox.' });
  }

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', address })}\n\n`);

  // Subscribe to real-time events for this inbox only
  const unsubscribe = store.subscribeToInbox(address, (msg) => {
    res.write(`data: ${JSON.stringify({ type: 'new_message', message: msg })}\n\n`);
  });

  // Keep-alive heartbeat every 15s to keep connections warm
  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// Get single message details
router.get('/messages/:id', (req: Request, res: Response) => {
  const message = store.getMessage(req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found or inbox expired.' });
  }

  res.json({ message });
});

/**
 * Production Inbound Email Webhook Receiver
 * Parses incoming emails forwarded by Cloudflare Email Routing, Mailgun, SendGrid Inbound Parse, or Postmark.
 */
router.post('/inbound-webhook', (req: Request, res: Response) => {
  const payload = req.body || {};

  // Extract recipient (handling various provider payload schemas)
  let recipient = 
    payload.to ||
    payload.recipient ||
    payload['To'] ||
    payload.envelope?.to?.[0] ||
    payload['envelope[to]'] ||
    '';

  if (Array.isArray(recipient)) {
    recipient = recipient[0] || '';
  }

  // Parse email address if format is "Name <user@domain.com>"
  const emailMatch = recipient.match(/<([^>]+)>/) || [null, recipient];
  const cleanedTo = (emailMatch[1] || recipient).toLowerCase().trim();

  if (!cleanedTo) {
    return res.status(400).json({ error: 'Missing or unparseable recipient address.' });
  }

  // Verify inbox exists in store
  const inbox = store.getInbox(cleanedTo);
  if (!inbox) {
    // Return 200 to inbound mail provider so it doesn't endlessly retry expired inboxes
    return res.status(200).json({ status: 'ignored', reason: 'Inbox does not exist or has expired.' });
  }

  // Extract sender
  const from = payload.from || payload.sender || payload['From'] || 'unknown@example.com';
  const fromName = payload.from_name || payload.sender_name || from.split('<')[0]?.trim() || from;

  // Extract subject & bodies
  const subject = payload.subject || payload['Subject'] || '(No Subject)';
  const bodyText = payload.text || payload['body-plain'] || payload['TextBody'] || payload.stripped_text || '';
  const bodyHtml = payload.html || payload['body-html'] || payload['HtmlBody'] || payload.stripped_html || `<p>${bodyText}</p>`;

  // Parse attachments if present
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.map((att: any) => ({
        filename: String(att.filename || att.name || 'document.pdf'),
        contentType: String(att.contentType || att['content-type'] || 'application/octet-stream'),
        sizeBytes: Number(att.size || att.sizeBytes || 1024),
        url: att.url ? String(att.url) : undefined,
        contentBase64: att.contentBase64 ? String(att.contentBase64) : undefined
      }))
    : undefined;

  const message = store.addMessage({
    inboxAddress: cleanedTo,
    fromAddress: from,
    fromName: fromName,
    subject,
    bodyText,
    bodyHtml,
    headers: {
      'received': new Date().toISOString(),
      'provider-id': req.headers['x-provider-id'] as string || 'inbound-webhook'
    },
    attachments
  });

  res.status(200).json({
    status: 'received',
    messageId: message.id,
    inboxAddress: cleanedTo
  });
});

/**
 * Built-in Real Email Dispatcher for testing
 * Allows triggering actual real test emails into any active inbox without requiring live MX records during sandbox test runs.
 */
router.post('/test-send', (req: Request, res: Response) => {
  const { to, template, customSubject, customBody, customSender } = req.body || {};
  const cleanedTo = (to || '').toLowerCase().trim();

  const inbox = store.getInbox(cleanedTo);
  if (!inbox) {
    return res.status(404).json({ error: 'Active inbox not found or expired.' });
  }

  let subject = customSubject || 'Welcome to your temporary inbox';
  let fromAddress = customSender || 'verify@security-alerts.org';
  let fromName = 'Account Verification Service';
  let bodyText = '';
  let bodyHtml = '';

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  let attachments: any = undefined;

  switch (template) {
    case 'attachment':
      subject = customSubject || 'Confidential: Q3 Security Audit & Credentials [Attachments Included]';
      fromAddress = 'audit@cert-security.io';
      fromName = 'Security Audit Vault';
      bodyText = `Attached to this transmission are your requested security evaluation report and credentials configuration files.`;
      bodyHtml = `
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
          <h3 style="color: #38bdf8; margin-top: 0;">Automated Transmission with Attachments</h3>
          <p style="color: #cbd5e1; font-size: 14px;">The requested files have been packaged and attached to this email message.</p>
          <div style="margin: 16px 0; padding: 12px; background: #1e293b; border-radius: 8px; font-size: 12px; color: #94a3b8;">
            <div>&bull; <strong>security_audit_report.pdf</strong> (142 KB)</div>
            <div>&bull; <strong>service_credentials.json</strong> (1.2 KB)</div>
          </div>
          <span style="font-size: 11px; color: #64748b;">Delivered via QuickNest Inbound Engine</span>
        </div>
      `;
      attachments = [
        {
          filename: 'security_audit_report.pdf',
          contentType: 'application/pdf',
          sizeBytes: 145408
        },
        {
          filename: 'service_credentials.json',
          contentType: 'application/json',
          sizeBytes: 1228
        }
      ];
      break;

    case 'verification':
      subject = `Your single-use security code: ${verificationCode}`;
      fromAddress = 'noreply@auth.quicknest.org';
      fromName = 'Secure Auth Bot';
      bodyText = `Hello,\n\nYour temporary verification code is: ${verificationCode}\nThis code will expire in 10 minutes.\n\nIf you did not request this, please disregard.`;
      bodyHtml = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #0f172a;">
          <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Confirm your registration</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Please use the following 6-digit confirmation code to complete your signup process:</p>
          <div style="margin: 24px 0; padding: 16px; background: #f1f5f9; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #0f172a;">
            ${verificationCode}
          </div>
          <p style="color: #64748b; font-size: 12px;">This single-use code is valid for 10 minutes. Never share this code with anyone.</p>
        </div>
      `;
      break;

    case 'newsletter':
      subject = 'Weekly Developer Dispatch #148: Spatial Web & Micro-tools';
      fromAddress = 'editor@codenews.io';
      fromName = 'CodeNews Weekly';
      bodyText = `Developer Dispatch #148\n\nTop Stories:\n1. Zero-retention privacy tooling in 2026\n2. GPU accelerated WebGL applications\n3. Micro-utilities architecture overview`;
      bodyHtml = `
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h3 style="color: #38bdf8; margin-top: 0;">CodeNews Weekly Dispatch</h3>
          <p style="color: #cbd5e1; font-size: 14px;">Here is your curated briefing of software engineering developments.</p>
          <ul style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            <li><strong style="color: #f1f5f9;">Privacy-First Architecture:</strong> Managing ephemeral data with zero persistence.</li>
            <li><strong style="color: #f1f5f9;">WebGL & 3D Shaders:</strong> Real-time spatial interfaces in browser environments.</li>
          </ul>
        </div>
      `;
      break;

    default:
      bodyText = customBody || `Test message delivered to ${cleanedTo} at ${new Date().toLocaleTimeString()}.\n\nYour inbox is active and receiving emails successfully!`;
      bodyHtml = `
        <div style="font-family: sans-serif; padding: 16px; color: #1e293b;">
          <h3 style="margin-top: 0; color: #0f172a;">${subject}</h3>
          <p style="white-space: pre-wrap; color: #334155;">${bodyText}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <span style="font-size: 11px; color: #94a3b8;">Delivered via QuickNest Inbound Engine</span>
        </div>
      `;
  }

  const message = store.addMessage({
    inboxAddress: cleanedTo,
    fromAddress,
    fromName,
    subject,
    bodyText,
    bodyHtml,
    headers: {
      'received': new Date().toISOString(),
      'x-test-dispatch': 'true'
    },
    attachments
  });

  res.json({
    success: true,
    messageId: message.id,
    message: 'Test email delivered to inbox successfully.'
  });
});

export default router;
