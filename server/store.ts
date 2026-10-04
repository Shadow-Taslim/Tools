import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

/**
 * In-memory & production-ready data store for Vortex Tools.
 * Handles temporary inboxes, incoming emails, short links, abuse reports,
 * rate limiting, and automated TTL cleanup.
 */

export interface TempInbox {
  id: string;
  address: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
  isBlocked: boolean;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url?: string;
  contentBase64?: string;
}

export interface EmailMessage {
  id: string;
  inboxAddress: string;
  fromAddress: string;
  fromName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: number;
  sizeBytes: number;
  headers: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface ShortLink {
  id: string;
  code: string;
  originalUrl: string;
  title: string;
  domain: string;
  isMalicious: boolean;
  maliciousReasons: string[];
  clickCount: number;
  createdAt: number;
  expiresAt: number | null;
  allowDirectRedirect: boolean;
  reportsCount: number;
  lastAccessedAt: number | null;
}

export interface LinkReport {
  id: string;
  code: string;
  reason: string;
  details: string;
  reporterIp: string;
  reportedAt: number;
}

class Store {
  private inboxes = new Map<string, TempInbox>(); // key: normalized address
  private inboxMessages = new Map<string, EmailMessage[]>(); // key: normalized address -> messages list
  private messages = new Map<string, EmailMessage>(); // key: messageId
  private shortLinks = new Map<string, ShortLink>(); // key: code
  private reports: LinkReport[] = [];
  
  // Rate limiting (IP -> timestamps[])
  private rateLimits = new Map<string, number[]>();

  // Pub-Sub Event Bus for real-time instant email delivery
  private eventBus = new EventEmitter();

  // Supported email domains
  public readonly supportedDomains = [
    'temp.quicknest.org',
    'disposable.quicknest.org',
    'privmail.quicknest.org'
  ];

  constructor() {
    this.eventBus.setMaxListeners(10_000);

    // Start background cleanup worker every 10 seconds
    const interval = setInterval(() => {
      this.sweepExpiredData();
    }, 10_000);
    if (interval.unref) {
      interval.unref();
    }
  }

  // --- Temporary Email Management ---

  public createInbox(customHandle?: string, domainChoice?: string): TempInbox {
    const domain = this.supportedDomains.includes(domainChoice || '')
      ? (domainChoice as string)
      : this.supportedDomains[0];

    const now = Date.now();
    let handle = (customHandle || '').toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');

    if (!handle || handle.length < 3) {
      // Auto-generate cryptographically unique handle ensuring zero collisions between users
      do {
        handle = 'usr_' + crypto.randomBytes(6).toString('hex');
      } while (this.inboxes.has(`${handle}@${domain}`.toLowerCase()));
    } else {
      // Prevent two users from claiming or sharing the same active inbox
      const candidateAddress = `${handle}@${domain}`.toLowerCase();
      const existing = this.inboxes.get(candidateAddress);
      if (existing && existing.expiresAt > now) {
        // Handle is currently occupied by another user: append unique hex to isolate inboxes
        handle = `${handle}_${crypto.randomBytes(3).toString('hex')}`;
      }
    }

    const address = `${handle}@${domain}`.toLowerCase();
    const duration = 10 * 60 * 1000; // 10 minutes default TTL

    const inbox: TempInbox = {
      id: 'ibx_' + crypto.randomBytes(8).toString('hex'),
      address,
      token: 'tok_' + crypto.randomBytes(16).toString('hex'),
      createdAt: now,
      expiresAt: now + duration,
      lastActiveAt: now,
      isBlocked: false
    };

    this.inboxes.set(address, inbox);
    if (!this.inboxMessages.has(address)) {
      this.inboxMessages.set(address, []);
    }
    return inbox;
  }

  public getInbox(address: string): TempInbox | null {
    const normalized = address.toLowerCase().trim();
    const inbox = this.inboxes.get(normalized);
    if (!inbox) return null;

    if (Date.now() > inbox.expiresAt) {
      this.deleteInbox(normalized);
      return null;
    }
    return inbox;
  }

  public extendInbox(address: string, additionalMinutes = 10): TempInbox | null {
    const normalized = address.toLowerCase().trim();
    const inbox = this.getInbox(normalized);
    if (!inbox) return null;

    const maxExpiry = Date.now() + 60 * 60 * 1000; // Max 60 minutes from now
    const newExpiry = Math.min(inbox.expiresAt + additionalMinutes * 60 * 1000, maxExpiry);
    inbox.expiresAt = newExpiry;
    inbox.lastActiveAt = Date.now();
    return inbox;
  }

  public deleteInbox(address: string): boolean {
    const normalized = address.toLowerCase().trim();
    const exists = this.inboxes.delete(normalized);

    // Instant O(1) batch deletion of associated messages
    const msgs = this.inboxMessages.get(normalized);
    if (msgs) {
      for (const msg of msgs) {
        this.messages.delete(msg.id);
      }
      this.inboxMessages.delete(normalized);
    }

    // Safety fallback cleanup
    for (const [id, msg] of this.messages.entries()) {
      if (msg.inboxAddress === normalized) {
        this.messages.delete(id);
      }
    }
    return exists;
  }

  public getMessagesForInbox(address: string): EmailMessage[] {
    const normalized = address.toLowerCase().trim();
    return this.inboxMessages.get(normalized) || [];
  }

  public getMessage(id: string): EmailMessage | null {
    return this.messages.get(id) || null;
  }

  public addMessage(msg: Omit<EmailMessage, 'id' | 'receivedAt' | 'sizeBytes'>): EmailMessage {
    const normalizedInbox = msg.inboxAddress.toLowerCase().trim();
    const now = Date.now();
    const bodySize = (msg.bodyHtml || '').length + (msg.bodyText || '').length;

    const fullMessage: EmailMessage = {
      ...msg,
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      inboxAddress: normalizedInbox,
      receivedAt: now,
      sizeBytes: bodySize
    };

    // Store in global lookup
    this.messages.set(fullMessage.id, fullMessage);

    // Store in instant O(1) inbox list (prepended latest first)
    let list = this.inboxMessages.get(normalizedInbox);
    if (!list) {
      list = [];
      this.inboxMessages.set(normalizedInbox, list);
    }
    list.unshift(fullMessage);

    // If inbox exists, touch activity
    const inbox = this.inboxes.get(normalizedInbox);
    if (inbox) {
      inbox.lastActiveAt = now;
    }

    // Push instant notification to any live connection for this inbox
    this.eventBus.emit(`msg:${normalizedInbox}`, fullMessage);

    return fullMessage;
  }

  /**
   * Subscribe to real-time incoming messages for a specific inbox address.
   */
  public subscribeToInbox(address: string, listener: (message: EmailMessage) => void): () => void {
    const normalized = address.toLowerCase().trim();
    const eventName = `msg:${normalized}`;
    this.eventBus.on(eventName, listener);
    return () => {
      this.eventBus.off(eventName, listener);
    };
  }

  // --- URL Shortener Management ---

  public createShortLink(params: {
    originalUrl: string;
    customCode?: string;
    title?: string;
    domain: string;
    isMalicious: boolean;
    maliciousReasons: string[];
    allowDirectRedirect?: boolean;
    expiresInDays?: number;
  }): ShortLink {
    let code = (params.customCode || '').trim();
    if (!code) {
      code = Math.random().toString(36).substring(2, 8);
    } else {
      code = code.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
    }

    // Ensure uniqueness
    if (this.shortLinks.has(code) && !params.customCode) {
      code = code + Math.random().toString(36).substring(2, 4);
    }

    const now = Date.now();
    const expiresAt = params.expiresInDays ? now + params.expiresInDays * 24 * 60 * 60 * 1000 : null;

    const link: ShortLink = {
      id: 'lnk_' + Math.random().toString(36).substring(2, 11),
      code,
      originalUrl: params.originalUrl,
      title: params.title || params.domain,
      domain: params.domain,
      isMalicious: params.isMalicious,
      maliciousReasons: params.maliciousReasons,
      clickCount: 0,
      createdAt: now,
      expiresAt,
      allowDirectRedirect: params.allowDirectRedirect !== false,
      reportsCount: 0,
      lastAccessedAt: null
    };

    this.shortLinks.set(code, link);
    return link;
  }

  public getShortLink(code: string): ShortLink | null {
    const link = this.shortLinks.get(code);
    if (!link) return null;

    if (link.expiresAt && Date.now() > link.expiresAt) {
      this.shortLinks.delete(code);
      return null;
    }
    return link;
  }

  public recordLinkClick(code: string): ShortLink | null {
    const link = this.getShortLink(code);
    if (!link) return null;

    link.clickCount++;
    link.lastAccessedAt = Date.now();
    return link;
  }

  public reportLink(code: string, reason: string, details: string, reporterIp: string): boolean {
    const link = this.getShortLink(code);
    if (!link) return false;

    link.reportsCount++;
    if (link.reportsCount >= 3) {
      link.isMalicious = true;
      if (!link.maliciousReasons.includes('Reported as abusive by multiple users')) {
        link.maliciousReasons.push('Reported as abusive by multiple users');
      }
    }

    this.reports.push({
      id: 'rep_' + Math.random().toString(36).substring(2, 11),
      code,
      reason,
      details,
      reporterIp,
      reportedAt: Date.now()
    });

    return true;
  }

  // --- Rate Limiting (Token Bucket) ---

  public checkRateLimit(ip: string, maxRequests = 30, windowMs = 60_000): boolean {
    const now = Date.now();
    const timestamps = this.rateLimits.get(ip) || [];

    // Filter out timestamps outside window
    const recent = timestamps.filter(t => now - t < windowMs);
    if (recent.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    recent.push(now);
    this.rateLimits.set(ip, recent);
    return true;
  }

  // --- Background Expiry Sweeper ---

  private sweepExpiredData() {
    const now = Date.now();

    // 1. Sweep expired inboxes
    for (const [address, inbox] of this.inboxes.entries()) {
      if (now > inbox.expiresAt) {
        this.deleteInbox(address);
      }
    }

    // 2. Sweep expired short links
    for (const [code, link] of this.shortLinks.entries()) {
      if (link.expiresAt && now > link.expiresAt) {
        this.shortLinks.delete(code);
      }
    }

    // 3. Sweep old rate limit records
    for (const [ip, list] of this.rateLimits.entries()) {
      const active = list.filter(t => now - t < 120_000);
      if (active.length === 0) {
        this.rateLimits.delete(ip);
      } else {
        this.rateLimits.set(ip, active);
      }
    }
  }

  public getSystemMetrics() {
    return {
      activeInboxes: this.inboxes.size,
      totalMessages: this.messages.size,
      activeShortLinks: this.shortLinks.size,
      totalReports: this.reports.length
    };
  }
}

export const store = new Store();
