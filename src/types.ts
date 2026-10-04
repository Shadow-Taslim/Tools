export type ActiveTool = 
  | 'home'
  | 'temp-mail'
  | 'url-shortener'
  | 'qr-code'
  | 'password-generator'
  | 'word-counter'
  | 'text-case'
  | 'preview'
  | 'architecture'
  | 'privacy'
  | 'terms'
  | 'contact';

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
  headers?: Record<string, string>;
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
}

export interface SystemStats {
  status: string;
  uptime: number;
  activeInboxes: number;
  totalMessages: number;
  activeShortLinks: number;
  totalReports: number;
}
