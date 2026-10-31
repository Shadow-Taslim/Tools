export type ActiveTool = 
  | 'home'
  | 'temp-mail'
  | 'url-shortener'
  | 'security-checker'
  | 'robots-audit'
  | 'ai-observability'
  | 'qr-code'
  | 'password-generator'
  | 'word-counter'
  | 'text-case'
  | 'preview'
  | 'architecture'
  | 'privacy'
  | 'terms'
  | 'contact';

export interface AiSearchEngineMetric {
  id: string;
  name: string;
  icon: string;
  mentions: number;
  citedPages: number;
  visibilityScore: number;
  shareOfVoice: number;
  status: 'active' | 'crawling' | 'high-intent';
  primaryUserAgent: string;
}

export interface AiCrawlerAuditItem {
  name: string;
  userAgent: string;
  provider: string;
  status: 'allowed' | 'restricted' | 'blocked';
  llmsAccess: boolean;
  httpStatus: number;
  latencyMs: number;
  notes: string;
}

export interface AiObservabilityStats {
  domain: string;
  aiVisibilityScore: number;
  previousVisibilityScore: number;
  totalMentions: number;
  previousMentions: number;
  totalCitedPages: number;
  previousCitedPages: number;
  authorityScore: number;
  organicKeywords: number;
  llmsTxtStatus: 'valid' | 'missing' | 'error';
  llmsFullTxtStatus: 'valid' | 'missing' | 'error';
  crawlers: AiCrawlerAuditItem[];
  engines: AiSearchEngineMetric[];
  geoFactors: {
    title: string;
    score: number;
    description: string;
    status: 'optimal' | 'good' | 'warning';
  }[];
  lastAudited: string;
}

export interface AiCitationSimulationResult {
  query: string;
  engine: string;
  confidence: number;
  answerHtml: string;
  citations: {
    id: number;
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }[];
  keyEntities: string[];
}


export interface HeaderAuditItem {
  header: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | null;
  importance: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  fixSnippet: {
    nextjs: string;
    nginx: string;
    cloudflare: string;
  };
}

export interface SecurityCheckResult {
  targetUrl: string;
  finalUrl: string;
  statusCode: number;
  responseTimeMs: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  ssl: {
    valid: boolean;
    protocol?: string;
    issuer?: string;
  };
  headers: HeaderAuditItem[];
  passedCount: number;
  warnCount: number;
  failCount: number;
  checkedAt: number;
}

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
