import { useState } from 'react';
import { SecurityCheckResult, HeaderAuditItem } from '../types.ts';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  ExternalLink, Copy, Check, Search, Terminal, 
  Layers, Lock, Sparkles, Activity, Globe, Info, Code2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface SecurityCheckerViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const POPULAR_PRESETS = [
  'cloudflare.com',
  'github.com',
  'google.com',
  'mozilla.org'
];

export default function SecurityCheckerView({ onShowToast }: SecurityCheckerViewProps) {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SecurityCheckResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'pass' | 'warn' | 'fail'>('all');
  const [expandedHeader, setExpandedHeader] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'nextjs' | 'cloudflare' | 'nginx'>('nextjs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNextJsDocs, setShowNextJsDocs] = useState(false);

  const handleScan = async (targetUrl?: string) => {
    const urlToScan = (targetUrl || urlInput).trim();
    if (!urlToScan) {
      onShowToast('Please enter a website URL or domain', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan })
      });

      const data = await res.json();
      if (res.ok && data.grade) {
        setResult(data);
        onShowToast(`Security audit complete! Grade: ${data.grade}`, 'success');
      } else {
        onShowToast(data.error || 'Failed to scan website', 'error');
      }
    } catch {
      onShowToast('Network error while analyzing security headers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copySnippet = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    onShowToast('Configuration snippet copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredHeaders = result?.headers.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  }) || [];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
      case 'B':
        return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
      case 'C':
        return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
      case 'D':
        return 'text-orange-400 border-orange-500/50 bg-orange-950/40';
      default:
        return 'text-rose-400 border-rose-500/50 bg-rose-950/40';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('checker.badge', 'Next.js App Router & Cloudflare Ready')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('checker.title', 'Website Health & Security Checker')}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {t('checker.subtitle', 'Comprehensive HTTP security header auditor, SSL/TLS protocol validator, and latency inspector with zero server telemetry.')}
        </p>
      </div>

      {/* Main Scan Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="security-url-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('checker.targetInput', 'Target Domain or URL')}
            </label>
            <div className="relative flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all shadow-inner">
              <Globe className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
              <input
                id="security-url-input"
                type="text"
                placeholder="https://example.com or domain.org"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-transparent text-white text-sm sm:text-base w-full focus:outline-none placeholder-slate-500 font-mono"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="ml-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 active:bg-cyan-600 text-slate-950 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-cyan-500/20 shrink-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t('checker.auditing', 'Auditing...')}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{t('checker.analyzeBtn', 'Analyze Security')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">{t('checker.quickTest', 'Quick Test:')}</span>
            {POPULAR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setUrlInput(preset);
                  handleScan(preset);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 font-mono transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNextJsDocs(!showNextJsDocs)}
              className="ml-auto inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showNextJsDocs ? 'Hide Architecture' : 'Next.js & Cloudflare Guide'}</span>
            </button>
          </div>
        </form>

        {/* Next.js & Cloudflare Architecture Guide Drawer */}
        {showNextJsDocs && (
          <div className="p-5 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-4 animate-in fade-in slide-in-from-top-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Next.js App Router & Cloudflare Free-Tier Implementation</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-slate-500">Architecture Spec</span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              This checker is architected to run seamlessly on the **Next.js App Router** with React Server Components (`RSC`) and Cloudflare Pages/Workers (`@cloudflare/next-on-pages`) with zero cold starts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200">1. Next.js App Router Route (`app/api/checker/route.ts`):</span>
                <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`import { NextResponse } from 'next/server';
export const runtime = 'edge'; // Cloudflare Edge

export async function POST(req: Request) {
  const { url } = await req.json();
  const res = await fetch(url, { method: 'GET' });
  const headers = res.headers;
  // Audit HSTS, CSP, X-Frame-Options...
  return NextResponse.json({ score: 95, grade: 'A+' });
}`}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200">2. Cloudflare Free Tier (`wrangler.jsonc`):</span>
                <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "quicknest-edge",
  "compatibility_date": "2026-10-17",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": ".vercel/output/static"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Grade Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">{t('checker.securityGrade', 'Security Grade')}</span>
                <div className="text-xs text-slate-500 font-mono">OWASP Score: {result.score}/100</div>
              </div>
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-2xl font-mono shadow-inner ${getGradeColor(result.grade)}`}>
                {result.grade}
              </div>
            </div>

            {/* Protocol & SSL */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>{t('checker.protocol', 'Encryption Protocol')}</span>
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                {result.ssl.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="truncate">{result.ssl.protocol}</span>
              </div>
              <div className="text-[11px] text-slate-500">Status: {result.statusCode} OK</div>
            </div>

            {/* Latency / TTFB */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>{t('checker.latency', 'Response Latency')}</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-base font-bold text-white font-mono flex items-center gap-1.5 tabular-nums">
                <span className={result.responseTimeMs < 250 ? 'text-emerald-400' : result.responseTimeMs < 600 ? 'text-amber-400' : 'text-rose-400'}>
                  {result.responseTimeMs} ms
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Target: {new URL(result.finalUrl).hostname}</div>
            </div>

            {/* Header Compliance Ratio */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>{t('checker.directives', 'Audited Directives')}</span>
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="text-emerald-400">{result.passedCount} Passed</span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400">{result.warnCount} Warn</span>
                <span className="text-slate-600">·</span>
                <span className="text-rose-400">{result.failCount} Fail</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div style={{ width: `${(result.passedCount / 6) * 100}%` }} className="bg-emerald-400 h-full" />
                <div style={{ width: `${(result.warnCount / 6) * 100}%` }} className="bg-amber-400 h-full" />
                <div style={{ width: `${(result.failCount / 6) * 100}%` }} className="bg-rose-500 h-full" />
              </div>
            </div>
          </div>

          {/* Headers Inspection Table Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>{t('checker.headerInspection', 'Security Header Directives Inspection')}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed evaluation of the 6 core browser defense headers.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  All (6)
                </button>
                <button
                  onClick={() => setFilter('pass')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'pass' ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-800/40' : 'text-slate-400 hover:text-emerald-400'}`}
                >
                  Passed ({result.passedCount})
                </button>
                <button
                  onClick={() => setFilter('warn')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'warn' ? 'bg-amber-950/60 text-amber-300 font-semibold border border-amber-800/40' : 'text-slate-400 hover:text-amber-400'}`}
                >
                  Warnings ({result.warnCount})
                </button>
                <button
                  onClick={() => setFilter('fail')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'fail' ? 'bg-rose-950/60 text-rose-300 font-semibold border border-rose-800/40' : 'text-slate-400 hover:text-rose-400'}`}
                >
                  Failed ({result.failCount})
                </button>
              </div>
            </div>

            {/* List of Headers */}
            <div className="space-y-4">
              {filteredHeaders.map((item) => {
                const isExpanded = expandedHeader === item.header;
                return (
                  <div
                    key={item.header}
                    className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            item.status === 'pass' 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : item.status === 'warn'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          }`}>
                            {item.status === 'pass' ? <Check className="w-3 h-3" /> : item.status === 'warn' ? <AlertTriangle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            <span>{item.status.toUpperCase()}</span>
                          </span>

                          <span className="font-mono text-sm font-bold text-slate-100">
                            {item.header}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          {item.title} — <span className="text-slate-400 font-normal">{item.description}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedHeader(isExpanded ? null : item.header)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {isExpanded ? 'Hide Fix Snippet' : 'View Fix Snippet'}
                      </button>
                    </div>

                    {item.value && (
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-300 break-all select-all">
                        <span className="text-slate-500 mr-2">Received:</span>
                        {item.value}
                      </div>
                    )}

                    {/* Expanded Remediation Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            Remediation: {item.recommendation}
                          </span>

                          {/* Framework Tabs */}
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <button
                              onClick={() => setActiveSnippetTab('nextjs')}
                              className={`px-2 py-0.5 rounded cursor-pointer ${activeSnippetTab === 'nextjs' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                              Next.js
                            </button>
                            <button
                              onClick={() => setActiveSnippetTab('cloudflare')}
                              className={`px-2 py-0.5 rounded cursor-pointer ${activeSnippetTab === 'cloudflare' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                              Cloudflare
                            </button>
                            <button
                              onClick={() => setActiveSnippetTab('nginx')}
                              className={`px-2 py-0.5 rounded cursor-pointer ${activeSnippetTab === 'nginx' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                              Nginx
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <pre className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 select-all pr-12">
                            {activeSnippetTab === 'nextjs' && item.fixSnippet.nextjs}
                            {activeSnippetTab === 'cloudflare' && item.fixSnippet.cloudflare}
                            {activeSnippetTab === 'nginx' && item.fixSnippet.nginx}
                          </pre>
                          <button
                            onClick={() => {
                              const snippet = activeSnippetTab === 'nextjs' 
                                ? item.fixSnippet.nextjs 
                                : activeSnippetTab === 'cloudflare' 
                                ? item.fixSnippet.cloudflare 
                                : item.fixSnippet.nginx;
                              copySnippet(snippet, item.header);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md cursor-pointer"
                            title="Copy snippet"
                          >
                            {copiedKey === item.header ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
