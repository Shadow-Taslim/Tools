import { useState } from 'react';
import { 
  Database, Server, RefreshCw, Mail, 
  Terminal, ShieldCheck, ArrowRight, Layers, FileCode2, Copy, Check 
} from 'lucide-react';

interface ArchitectureViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ArchitectureView({ onShowToast }: ArchitectureViewProps) {
  const [activeTab, setActiveTab] = useState<'diagram' | 'sql' | 'production' | 'dns'>('diagram');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    onShowToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlSchema = `-- ==========================================
-- PostgreSQL Production Schema for QuickNest
-- ==========================================

-- 1. Inboxes (Temporary Ephemeral Records)
CREATE TABLE inboxes (
  id VARCHAR(36) PRIMARY KEY,
  address VARCHAR(255) UNIQUE NOT NULL,
  token VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_inboxes_address ON inboxes(address);
CREATE INDEX idx_inboxes_expires_at ON inboxes(expires_at);

-- 2. Incoming Messages
CREATE TABLE email_messages (
  id VARCHAR(36) PRIMARY KEY,
  inbox_id VARCHAR(36) NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
  inbox_address VARCHAR(255) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes INTEGER NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_inbox ON email_messages(inbox_id);

-- 3. Short Links
CREATE TABLE short_links (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  title VARCHAR(255),
  domain VARCHAR(255) NOT NULL,
  is_malicious BOOLEAN NOT NULL DEFAULT FALSE,
  malicious_reasons TEXT[] DEFAULT '{}',
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  allow_direct_redirect BOOLEAN NOT NULL DEFAULT TRUE,
  reports_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_short_links_code ON short_links(code);

-- 4. Abuse Reports
CREATE TABLE link_reports (
  id VARCHAR(36) PRIMARY KEY,
  link_code VARCHAR(32) NOT NULL REFERENCES short_links(code) ON DELETE CASCADE,
  reason VARCHAR(64) NOT NULL,
  details TEXT,
  reporter_ip VARCHAR(45) NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          System Architecture & Deployment Guide
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Production topology, database schemas, Redis rate-limiting, inbound email MX record configuration, and background purge worker.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('diagram')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'diagram' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Visual Topology
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sql' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          PostgreSQL DDL
        </button>
        <button
          onClick={() => setActiveTab('dns')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'dns' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Email MX & Webhook
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'production' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Production Deploy
        </button>
      </div>

      {/* Tab: Visual Topology Diagram */}
      {activeTab === 'diagram' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Full-Stack Architecture Pipeline</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
              Interactive Blueprint
            </span>
          </div>

          {/* ASCII / Interactive Flow Diagram */}
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto leading-relaxed space-y-4">
            <pre className="text-slate-300">
{`Visitor
  │
  ▼
Web Frontend ───────────────► API Gateway ──────────────► PostgreSQL
(Three.js 3D, React)              │                         │
                                  ├──► Redis                └── Short links, Inbox metadata,
                                  │    (Token-bucket,           Audit logs & Abuse reports
                                  │     60s rate limit,
                                  │     fast TTL cache)
                                  │
                                  ├──► Inbound Webhook ◄─── (Mailgun / SendGrid / Postmark / Cloudflare)
                                  │    (Incoming RFC emails)
                                  │
                                  └──► Background Worker
                                       (Sweeps expired inboxes every 10s,
                                        purges short links, validates abuse)

Short-link Visitor ──► /s/:code ──► [Safety Heuristic Check] ──► Destination Website`}
            </pre>
          </div>

          {/* Component Responsibilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Mail className="w-4 h-4" />
                <span>Inbound Email Provider Webhook</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Incoming emails arrive at domain MX records (e.g. Cloudflare Email Routing or SendGrid Inbound Parse), which forwards the email payload to <code className="text-cyan-300 font-mono">POST /api/email/inbound-webhook</code>. The API parses the recipient address, validates that the inbox is active, and stores sanitized message contents.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <RefreshCw className="w-4 h-4" />
                <span>Background Expiry Sweeper</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Runs an autonomous sweeper every 10 seconds. Inboxes whose <code className="text-emerald-300 font-mono">expires_at &lt; NOW()</code> are deleted along with all their stored messages in a single atomic cascade, ensuring strict zero-retention privacy guarantees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-violet-400 font-bold">
                <Database className="w-4 h-4" />
                <span>PostgreSQL Storage</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Houses transactional metadata for short links, click counters, abuse reports, and active disposable inboxes. Relational foreign key constraints cascade deletions instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Malware & Abuse Heuristics</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Pre-scans every shortened URL against phishing regexes, private IP ranges (SSRF protection), and active blocklists. Short links reported by 3+ users are automatically quarantined.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PostgreSQL Schema */}
      {activeTab === 'sql' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Production PostgreSQL Tables & Indexes</span>
            </h3>
            <button
              onClick={() => copySnippet('sql', sqlSchema)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy SQL</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {sqlSchema}
          </pre>
        </div>
      )}

      {/* Tab: DNS & MX Records */}
      {activeTab === 'dns' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span>Production Disposable Domain DNS Configuration</span>
            </h3>
            <p className="text-xs text-slate-400">
              To accept inbound email for <code className="text-cyan-300">@temp.yourdomain.org</code> in production, configure the following DNS records with your registrar or Cloudflare:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Host Name</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Value / Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-cyan-400">MX</td>
                  <td className="p-3">temp</td>
                  <td className="p-3 tabular-nums">10</td>
                  <td className="p-3">mx.sendgrid.net (or route1.mx.cloudflare.net)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-cyan-400">MX</td>
                  <td className="p-3">temp</td>
                  <td className="p-3 tabular-nums">20</td>
                  <td className="p-3">route2.mx.cloudflare.net</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-cyan-400">TXT</td>
                  <td className="p-3">temp</td>
                  <td className="p-3 tabular-nums">-</td>
                  <td className="p-3">v=spf1 include:_spf.mx.cloudflare.net ~all</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-white block">Forwarding Webhook URL:</span>
            <code className="text-cyan-400 block break-all font-mono">
              https://yourdomain.com/api/email/inbound-webhook
            </code>
            <p className="text-slate-500 text-[11px] pt-1">
              Supports Cloudflare Email Routing rules (Catch-all &rarr; Worker / Webhook), SendGrid Inbound Parse, and Mailgun Forwarding.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Production Deploy */}
      {activeTab === 'production' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Production Environment & Deployment Steps</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deploy to Google Cloud Run, Fly.io, Railway, or AWS ECS with standard containerization.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-slate-300">1. Required Environment Variables</span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
{`PORT=3000
NODE_ENV=production
APP_URL="https://quicknest.org"
EMAIL_INBOUND_DOMAIN="temp.quicknest.org"
EMAIL_WEBHOOK_SECRET="quicknest_sec_random_string"
DATABASE_URL="postgres://user:pass@ep-host.pooler.supabase.com:5432/quicknest"
REDIS_URL="redis://default:token@redis-server:6379"`}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-300">2. Build & Launch Command</span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono">
{`# 1. Install dependencies
npm install

# 2. Build Vite frontend assets into /dist
npm run build

# 3. Start full-stack Node/Express server
npm start`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
