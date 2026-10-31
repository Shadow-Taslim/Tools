import { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  Search, RefreshCw, Copy, Check, Download, ExternalLink, 
  Bot, Compass, Globe, Sparkles, Terminal, Code2, Layers, CheckSquare
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface RobotsAuditViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

interface AuditIssue {
  severity: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  description: string;
  recommendation: string;
  affectedLine?: number;
}

interface RobotsAuditResult {
  rawContent: string;
  sourceUrl?: string;
  totalLines: number;
  groupsCount: number;
  sitemaps: string[];
  issues: AuditIssue[];
  healthScore: number;
  isSiteBlocked: boolean;
  hasSitemap: boolean;
  blocksAssets: boolean;
  privatePathsExposed: string[];
  aiBotsManaged: boolean;
}

interface PathTestResult {
  path: string;
  userAgent: string;
  allowed: boolean;
  matchedRule: string | null;
  matchedLine: number | null;
  reason: string;
}

const TEMPLATES: Record<string, { name: string; desc: string; code: string }> = {
  quicknest: {
    name: 'QuickNest Safe Default',
    desc: 'Public tools indexed, private ephemeral APIs and redirects strictly blocked.',
    code: `# ==========================================
# QuickNest - Production Robots.txt Specification
# ==========================================

User-agent: *
Allow: /
Allow: /temp-mail
Allow: /url-shortener
Allow: /security-checker
Allow: /robots-audit
Allow: /qr-code
Allow: /password-generator
Allow: /word-counter
Allow: /text-case
Allow: /architecture
Allow: /privacy
Allow: /terms
Allow: /contact

# Disallow private user data and backend endpoints
Disallow: /api/
Disallow: /s/
Disallow: /preview/

# AI Training Crawlers
User-agent: GPTBot
Disallow: /api/
Disallow: /s/
Disallow: /preview/

User-agent: CCBot
Disallow: /api/
Disallow: /s/
Disallow: /preview/

Sitemap: https://quicknest.org/sitemap.xml
`
  },
  nextjs: {
    name: 'Next.js App Router & Cloudflare',
    desc: 'Optimized for Server & Client Components, protects API routes while allowing _next/static assets.',
    code: `# Next.js App Router Robots.txt
User-agent: *
Allow: /
Allow: /_next/static/
Allow: /_next/image/

# Disallow server actions and private API routes
Disallow: /api/
Disallow: /private/
Disallow: /draft/

# Block AI crawlers from scraping pre-rendered pages if desired
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
`
  },
  saas: {
    name: 'SaaS / Web App Standard',
    desc: 'Promotes marketing pages and documentation; disallows authenticated app dashboard & checkout.',
    code: `# SaaS & Web Application Standard
User-agent: *
Allow: /
Allow: /blog/
Allow: /features/
Allow: /pricing/
Allow: /docs/

# Disallow internal authenticated user workspace
Disallow: /dashboard/
Disallow: /settings/
Disallow: /account/
Disallow: /checkout/
Disallow: /auth/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
`
  },
  aiShield: {
    name: 'Search-First AI Scraper Shield',
    desc: 'Welcomes Google, Bing, DuckDuckGo for search rankings, but restricts AI training bots.',
    code: `# Welcoming standard search engines
User-agent: *
Allow: /

# Restricting known generative AI model training crawlers
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Bytespider
Disallow: /

Sitemap: https://example.com/sitemap.xml
`
  },
  staging: {
    name: 'Staging / Preview Noindex',
    desc: 'Emergency blocking of non-production staging environments to avoid duplicate ranking penalties.',
    code: `# STAGING ENVIRONMENT - DO NOT INDEX
User-agent: *
Disallow: /
`
  }
};

const POPULAR_TEST_DOMAINS = [
  'quicknest.org (Local)',
  'github.com',
  'cloudflare.com',
  'wikipedia.org'
];

export default function RobotsAuditView({ onShowToast }: RobotsAuditViewProps) {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'audit' | 'simulator' | 'templates' | 'live'>('audit');
  const [content, setContent] = useState<string>(TEMPLATES.quicknest.code);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<RobotsAuditResult | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'good'>('all');

  // Simulator state
  const [testPath, setTestPath] = useState<string>('/api/email/inbox');
  const [testAgent, setTestAgent] = useState<string>('*');
  const [simResult, setSimResult] = useState<PathTestResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Copied state
  const [copied, setCopied] = useState<boolean>(false);

  // Initial audit of default content on mount
  useEffect(() => {
    runAudit(TEMPLATES.quicknest.code);
  }, []);

  const runAudit = async (customContent?: string, targetUrl?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/robots/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: customContent !== undefined ? customContent : content,
          url: targetUrl || (urlInput.trim() ? urlInput.trim() : undefined)
        })
      });

      const data = await res.json();
      if (res.ok && data.healthScore !== undefined) {
        setAuditResult(data);
        if (customContent !== undefined) {
          setContent(customContent);
        } else if (data.rawContent) {
          setContent(data.rawContent);
        }
        onShowToast(`Robots.txt audit complete! Health score: ${data.healthScore}/100`, 'success');
      } else {
        onShowToast(data.error || 'Failed to audit robots.txt', 'error');
      }
    } catch {
      onShowToast('Network error while running robots.txt audit', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPath = async () => {
    if (!testPath.trim()) {
      onShowToast('Please provide a path to test (e.g. /api/inbox)', 'error');
      return;
    }

    setIsSimulating(true);
    try {
      const res = await fetch('/api/robots/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userAgent: testAgent,
          path: testPath.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.allowed !== undefined) {
        setSimResult(data);
        onShowToast(data.allowed ? 'Path is ALLOWED' : 'Path is BLOCKED', data.allowed ? 'success' : 'error');
      } else {
        onShowToast(data.error || 'Failed to simulate path', 'error');
      }
    } catch {
      onShowToast('Error simulating path against robots rules', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const copyContent = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onShowToast('Robots.txt configuration copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (text: string, filename = 'robots.txt') => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${filename}`, 'success');
  };

  const filteredIssues = auditResult?.issues.filter(issue => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>Search Engine Optimization & Crawler Governance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Robots.txt & SEO Indexing Auditor
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Prevent indexing disasters. Detect catastrophic site-wide blocks, asset disallows that hurt Google rankings, exposed sensitive directories, and simulate crawler access in real-time.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit & Editor</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('simulator');
              if (!simResult) handleTestPath();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Path Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Production Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>QuickNest Live /robots.txt</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => copyContent(content)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy current robots.txt"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => downloadFile(content, 'robots.txt')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download robots.txt file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AUDIT & EDITOR */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Remote Domain Fetch Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Fetch Live From Any Domain:</span>
              <span className="text-[11px] text-slate-500">SSRF & DNS Protected</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-cyan-400 transition-colors">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="https://example.com or github.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="bg-transparent text-white text-xs sm:text-sm w-full focus:outline-none placeholder-slate-500 font-mono"
                />
              </div>
              <button
                onClick={() => runAudit(undefined, urlInput.trim())}
                disabled={isLoading || !urlInput.trim()}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Audit Domain</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="text-slate-500">Quick Test:</span>
              {POPULAR_TEST_DOMAINS.map((domain) => (
                <button
                  key={domain}
                  onClick={() => {
                    if (domain.includes('quicknest.org')) {
                      runAudit(TEMPLATES.quicknest.code);
                    } else {
                      setUrlInput(domain);
                      runAudit(undefined, domain);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Health Score Overview Cards */}
          {auditResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Health Score */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">SEO Health Score</span>
                  <div className="text-xs text-slate-500 font-mono">
                    {auditResult.healthScore >= 80 ? 'Optimal Setup' : auditResult.healthScore >= 50 ? 'Needs Attention' : 'Critical Issues'}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl font-mono shadow-inner ${
                  auditResult.healthScore >= 80 
                    ? 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40' 
                    : auditResult.healthScore >= 50
                    ? 'text-amber-400 border-amber-500/50 bg-amber-950/40'
                    : 'text-rose-400 border-rose-500/50 bg-rose-950/40'
                }`}>
                  {auditResult.healthScore}
                </div>
              </div>

              {/* Site Indexing Status */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-xl">
                <span className="text-xs text-slate-400 font-medium block">Indexing Status</span>
                <div className="flex items-center gap-2 pt-1 font-semibold text-sm">
                  {auditResult.isSiteBlocked ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-400">Entire Site Blocked!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Search Indexing Allowed</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {auditResult.isSiteBlocked ? 'Disallow: / detected without allow exceptions' : 'Crawlers can discover public pages'}
                </span>
              </div>

              {/* Asset Accessibility (CSS/JS) */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-xl">
                <span className="text-xs text-slate-400 font-medium block">CSS & JS Assets</span>
                <div className="flex items-center gap-2 pt-1 font-semibold text-sm">
                  {auditResult.blocksAssets ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-400">Assets Disallowed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Full Asset Rendering</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {auditResult.blocksAssets ? 'Googlebot rendering may be penalized' : 'Google mobile test compliant'}
                </span>
              </div>

              {/* Sitemap Reference */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-xl">
                <span className="text-xs text-slate-400 font-medium block">XML Sitemap Reference</span>
                <div className="flex items-center gap-2 pt-1 font-semibold text-sm">
                  {auditResult.hasSitemap ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">{auditResult.sitemaps.length} Sitemap(s) Linked</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-amber-400">No Sitemap Linked</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  {auditResult.hasSitemap ? auditResult.sitemaps[0] : 'Search engines lack index entrypoint'}
                </span>
              </div>
            </div>
          )}

          {/* Editor and Diagnostics Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Code Editor */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">robots.txt Direct Buffer</span>
                </div>
                <button
                  onClick={() => runAudit(content)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
                >
                  Re-analyze Code
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /private/&#10;Sitemap: https://example.com/sitemap.xml"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-200/90 leading-relaxed focus:outline-none focus:border-cyan-500/60 selection:bg-cyan-500/40"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{content.split('\n').length} lines · RFC 9309 Parser</span>
                <span>UTF-8 Plain Text</span>
              </div>
            </div>

            {/* Right: Audit Findings & Issues */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Diagnostic Findings ({filteredIssues.length})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setFilterSeverity('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${filterSeverity === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterSeverity('critical')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${filterSeverity === 'critical' ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-800/40' : 'text-slate-400'}`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => setFilterSeverity('warning')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${filterSeverity === 'warning' ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/40' : 'text-slate-400'}`}
                  >
                    Warnings
                  </button>
                  <button
                    onClick={() => setFilterSeverity('good')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${filterSeverity === 'good' ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/40' : 'text-slate-400'}`}
                  >
                    Good
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredIssues.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No issues matching this filter.
                  </div>
                ) : (
                  filteredIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        issue.severity === 'critical'
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          : issue.severity === 'warning'
                          ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                          : issue.severity === 'good'
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-1.5">
                          {issue.severity === 'critical' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                          {issue.severity === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {issue.severity === 'good' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          <span>{issue.title}</span>
                        </div>
                        {issue.affectedLine && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            Line {issue.affectedLine}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed text-slate-300">
                        {issue.description}
                      </p>
                      <div className="pt-1 text-[11px] text-slate-400 font-medium">
                        <span className="text-cyan-400 font-semibold">Remedy: </span>
                        {issue.recommendation}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATH SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Real-Time RFC 9309 URL Path Simulator</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Verify with mathematical precision whether a specific search bot or AI crawler is permitted or disallowed from accessing any URL path based on your currently loaded rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                User-Agent Bot
              </label>
              <select
                value={testAgent}
                onChange={(e) => setTestAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="*">* (All Search Engines Fallback)</option>
                <option value="Googlebot">Googlebot (Google Search)</option>
                <option value="Bingbot">Bingbot (Microsoft Bing)</option>
                <option value="GPTBot">GPTBot (OpenAI Training)</option>
                <option value="ClaudeBot">ClaudeBot (Anthropic)</option>
                <option value="CCBot">CCBot (Common Crawl)</option>
                <option value="Baiduspider">Baiduspider (Baidu Search)</option>
                <option value="YandexBot">YandexBot (Yandex Search)</option>
              </select>
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                URL Path to Inspect
              </label>
              <input
                type="text"
                placeholder="/api/email/inbox or /temp-mail"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={handleTestPath}
                disabled={isSimulating}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Test Path</span>
              </button>
            </div>
          </div>

          {/* Test Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Preset Paths:</span>
            {[
              { path: '/', label: 'Home (/)' },
              { path: '/temp-mail', label: 'Public Tool (/temp-mail)' },
              { path: '/api/email/inbox', label: 'Private API (/api/email/inbox)' },
              { path: '/s/demo-alias', label: 'Short Redirect (/s/demo-alias)' },
              { path: '/preview/demo', label: 'Preview Screen (/preview/demo)' },
              { path: '/_next/static/css/app.css', label: 'CSS Asset' },
              { path: '/admin/login', label: 'Admin Route' }
            ].map((p) => (
              <button
                key={p.path}
                onClick={() => {
                  setTestPath(p.path);
                  setTimeout(handleTestPath, 50);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className={`p-6 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
              simResult.allowed
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    simResult.allowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {simResult.allowed ? <CheckCircle2 className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      <span>{simResult.allowed ? 'ACCESS ALLOWED' : 'ACCESS BLOCKED'}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {simResult.userAgent}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 break-all">
                      Path: {simResult.path}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-xs text-slate-400">RFC 9309 Precedence Resolution:</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {simResult.matchedRule ? simResult.matchedRule : 'No matching disallow (Implicit Allow)'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <strong>Evaluation Reason: </strong>
                {simResult.reason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white">Battle-Tested Production Templates</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              One configuration error can ruin SEO. Pick a vetted template suited to your tech stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <div
                key={key}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
                      Vetted
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tpl.desc}
                  </p>
                  <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
                    {tpl.code}
                  </pre>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setContent(tpl.code);
                      setActiveTab('audit');
                      runAudit(tpl.code);
                      onShowToast(`Loaded ${tpl.name} template into editor`, 'success');
                    }}
                    className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Load into Editor
                  </button>
                  <button
                    onClick={() => copyContent(tpl.code)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title="Copy template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUICKNEST LIVE CONFIG */}
      {activeTab === 'live' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span>QuickNest Live /robots.txt & /sitemap.xml</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Served directly from our Node/Express backend with standard Content-Type and caching headers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Raw /robots.txt</span>
              </a>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Raw /sitemap.xml</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>1. Active /robots.txt</span>
                <span className="text-cyan-400 font-mono">Content-Type: text/plain</span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto max-h-80">
                {TEMPLATES.quicknest.code}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>2. Active /sitemap.xml</span>
                <span className="text-emerald-400 font-mono">Content-Type: application/xml</span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-80">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://quicknest.org/</loc><priority>1.0</priority></url>
  <url><loc>https://quicknest.org/temp-mail</loc><priority>0.9</priority></url>
  <url><loc>https://quicknest.org/url-shortener</loc><priority>0.9</priority></url>
  <url><loc>https://quicknest.org/security-checker</loc><priority>0.9</priority></url>
  <url><loc>https://quicknest.org/robots-audit</loc><priority>0.9</priority></url>
  <url><loc>https://quicknest.org/qr-code</loc><priority>0.8</priority></url>
  <url><loc>https://quicknest.org/password-generator</loc><priority>0.8</priority></url>
  <url><loc>https://quicknest.org/word-counter</loc><priority>0.7</priority></url>
  <url><loc>https://quicknest.org/text-case</loc><priority>0.7</priority></url>
  <url><loc>https://quicknest.org/architecture</loc><priority>0.6</priority></url>
  <url><loc>https://quicknest.org/privacy</loc><priority>0.5</priority></url>
  <url><loc>https://quicknest.org/terms</loc><priority>0.5</priority></url>
  <url><loc>https://quicknest.org/contact</loc><priority>0.5</priority></url>
</urlset>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SEO Education & Knowledge Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>SEO Best Practices: robots.txt vs noindex vs Authentication</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <span>1. Robots.txt Controls Crawling, Not Security</span>
            </h4>
            <p className="text-slate-400">
              Robots.txt tells polite search engine bots which URLs they can crawl. It does <em>not</em> prevent malicious scrapers or users from visiting URLs. Never hide sensitive admin pages in robots.txt without password authentication.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>2. Use &apos;noindex&apos; to Remove from Google</span>
            </h4>
            <p className="text-slate-400">
              If an unwanted page is already indexed by Google, adding <code>Disallow</code> in robots.txt prevents Googlebot from crawling it to see the <code>noindex</code> tag! Let Googlebot crawl the page with a <code>&lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt;</code> tag to drop it from search results.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-violet-400" />
              <span>3. Never Disallow CSS or JS Assets</span>
            </h4>
            <p className="text-slate-400">
              Google uses a full headless browser to render web pages. Disallowing your CSS, JavaScript bundles, or web fonts causes Google to fail mobile-friendliness checks and downgrades your search rank.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
