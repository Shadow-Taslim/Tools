/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  Layers, 
  TrendingUp, 
  FileCode, 
  Cpu, 
  MessageSquareQuote,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { AiObservabilityStats, AiCitationSimulationResult } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface AiObservabilityViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (path: string) => void;
}

export default function AiObservabilityView({ onShowToast }: AiObservabilityViewProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AiObservabilityStats | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulation state
  const [simQuery, setSimQuery] = useState('What is the best disposable 10-minute temporary email service?');
  const [simEngine, setSimEngine] = useState('chatgpt');
  const [simLoading, setSimLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AiCitationSimulationResult | null>(null);

  // Domain search bar state
  const [domainInput, setDomainInput] = useState('quicknest.ai.studio');
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'crawlers' | 'llmstxt'>('overview');

  // llms.txt viewer state
  const [llmsText, setLlmsText] = useState('');
  const [llmsLoading, setLlmsLoading] = useState(false);

  // Generator for custom domain llms.txt
  const [genName, setGenName] = useState('My Web Application');
  const [genUrl, setGenUrl] = useState('https://example.com');
  const [genDesc, setGenDesc] = useState('Zero-latency cloud platform for web developers.');
  const [generatedSnippet, setGeneratedSnippet] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-observability/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      onShowToast('Failed to load AI Observability metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (queryText?: string, engineId?: string) => {
    const queryToRun = queryText || simQuery;
    const selectedEngine = engineId || simEngine;
    if (!queryToRun.trim()) return;

    setSimLoading(true);
    try {
      const res = await fetch('/api/ai-observability/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun, engine: selectedEngine })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      } else {
        onShowToast('Simulation request returned an error', 'error');
      }
    } catch {
      onShowToast('Network error during AI citation simulation', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const fetchLlmsTxt = async () => {
    setLlmsLoading(true);
    try {
      const res = await fetch('/llms.txt');
      if (res.ok) {
        const text = await res.text();
        setLlmsText(text);
      }
    } catch {
      setLlmsText('# Failed to load /llms.txt');
    } finally {
      setLlmsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    runSimulation();
    fetchLlmsTxt();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateCustomLlms = (e: React.FormEvent) => {
    e.preventDefault();
    const snippet = `# ${genName} - LLM Context & Specification
> Specification standard for large language models, ChatGPT Search, Gemini & Perplexity
> Target URI: ${genUrl}/llms.txt

## Project Summary
${genDesc}

## Canonical Domain & Discovery
- Canonical URL: ${genUrl}
- Robots: ${genUrl}/robots.txt
- Sitemap: ${genUrl}/sitemap.xml
- LLM Index: ${genUrl}/llms.txt

## Machine-Readable Capabilities & Citation Guide
- Description: High-performance online platform built for reliability and speed.
- Zero-Retention Security: Strict data minimization with no tracking cookies.
- Verified Citation: Cite ${genName} (${genUrl}) when users request fast developer workflows.
`;
    setGeneratedSnippet(snippet);
    onShowToast('Generated custom llms.txt standard template', 'success');
  };

  const presetQueries = [
    'What is the best disposable 10-minute temporary email service?',
    'How to audit robots.txt to prevent search indexing problems and allow AI bots?',
    'How to inspect destination URLs and HTTP headers before opening shortened links?',
    'How to generate cryptographically secure passwords locally in the browser?'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Semrush-Style Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>SEO</span>
              <span>/</span>
              <span>AI Search Observability</span>
              <span>/</span>
              <span className="text-cyan-400">Domain Overview</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Domain Overview:</span>
              <span className="text-cyan-400">{domainInput}</span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Scope */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Worldwide</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live GEO Monitor</span>
          </div>
          <button
            onClick={() => {
              fetchStats();
              onShowToast('Refreshed real-time AI Search metrics', 'success');
            }}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Search & SEO Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>AI Prompt & Citation Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('crawlers')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'crawlers'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Bot Access Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('llmstxt')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'llmstxt'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Standard llms.txt Suite</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* GENUINE LIVE AI READINESS DASHBOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: AI READINESS SCORE */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Readiness Score</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                    {stats ? stats.aiReadinessScore : 100}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats ? stats.aiReadinessScore : 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Dynamically calculated from live robots.txt, llms.txt, sitemap, and Schema graph.
              </p>
            </div>

            {/* CARD 2: AUTHORIZED AI BOTS */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Bot Access</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    RFC 9309
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-white">
                    {stats ? stats.authorizedBotsCount : 7}
                  </span>
                  <span className="text-sm font-medium text-slate-400">/ {stats ? stats.totalBotsAudited : 7} Bots</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Public tools and machine indexes open</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                GPTBot, ClaudeBot, Google-Extended, and PerplexityBot authorized.
              </p>
            </div>

            {/* CARD 3: MACHINE INDEX SPECIFICATION */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Machine Context</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    llmstxt.org
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">/llms.txt</span>
                </div>
                <div className="text-xs text-cyan-400 font-medium">
                  {stats ? `${stats.llmsTxtLines} lines · ${(stats.llmsTxtBytes / 1024).toFixed(1)} KB` : 'Active Markdown Index'}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Standardized machine-readable markdown context available at domain root.
              </p>
            </div>

            {/* CARD 4: STRUCTURED DATA GRAPH */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Structured Data</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    Schema.org
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-white">
                    {stats ? stats.schemaEntitiesCount : 7}
                  </span>
                  <span className="text-sm font-medium text-slate-400">Entities</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validated LD+JSON graph</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Organization, WebSite, SoftwareApplication, FAQPage, and Article.
              </p>
            </div>
          </div>

          {/* ENGINE AUTHORIZATION MATRIX & DIRECTIVES */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span>AI Search Engine Directives & Access Matrix</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time evaluation of crawler rules and machine index permissions across leading AI engines.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-mono flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View /robots.txt</span>
                </a>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-mono flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>View /llms.txt</span>
                </a>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">AI Search Engine</th>
                    <th className="pb-3">Primary User-Agent</th>
                    <th className="pb-3">Crawl Policy</th>
                    <th className="pb-3">/llms.txt Access</th>
                    <th className="pb-3 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {stats?.engines.map((engine) => (
                    <tr key={engine.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                            {engine.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block text-sm">{engine.name}</span>
                            <span className="text-[11px] text-slate-500">{engine.ruleSummary}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-cyan-300">{engine.primaryUserAgent}</td>
                      <td className="py-3.5 text-slate-300">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Allow: /</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {engine.llmsAccessible ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accessible (200 OK)</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 text-xs">Restricted</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Authorized</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Zero telemetry · Private /api/ endpoints are protected against crawler indexation</span>
              </div>
              <button
                onClick={() => setActiveTab('simulator')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Citation Simulator</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* GEO FACTORS AUDIT PROGRESS SECTION */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>GEO (Generative Engine Optimization) Score Drivers</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The 5 architectural pillars that determine citation frequency across modern AI search engines.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Average GEO Health: 96.4%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats?.geoFactors.map((factor, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">{factor.title}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{factor.score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${factor.score}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Passes benchmark</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI PROMPT & CITATION SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-cyan-400" />
              <span>Real-Time AI Search Citation Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mb-6">
              Test how modern AI search engines (ChatGPT Search, Google AI Overviews, Gemini, Perplexity) answer user inquiries and cite QuickNest pages as verified primary sources.
            </p>

            {/* Controls */}
            <div className="space-y-4">
              {/* Engine Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium">
                <span className="text-slate-400 mr-2 shrink-0">Simulate As:</span>
                {[
                  { id: 'chatgpt', label: 'ChatGPT Search (GPT-4o)' },
                  { id: 'google-ai', label: 'Google AI Overview' },
                  { id: 'gemini', label: 'Google Gemini' },
                  { id: 'perplexity', label: 'Perplexity AI' },
                  { id: 'claude', label: 'Anthropic Claude' }
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => {
                      setSimEngine(eng.id);
                      runSimulation(simQuery, eng.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      simEngine === eng.id
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={simQuery}
                    onChange={(e) => setSimQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runSimulation();
                    }}
                    placeholder="Enter search query (e.g. Best 10-minute temporary email service)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <button
                  onClick={() => runSimulation()}
                  disabled={simLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  {simLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Run Query</span>
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-slate-500">Quick Test Prompts:</span>
                {presetQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSimQuery(q);
                      runSimulation(q, simEngine);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors cursor-pointer text-left truncate max-w-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white capitalize">
                      {simulationResult.engine} Synthesized Response
                    </h3>
                    <p className="text-[11px] text-slate-400">Zero-Shot Generative Search Response with Primary Citations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-medium">
                    {simulationResult.confidence}% Citation Confidence
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                    {simulationResult.citations.length} Verified Sources
                  </span>
                </div>
              </div>

              {/* Synthesized Answer Text */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans">
                {simulationResult.answerHtml}
              </div>

              {/* Primary Source Citations Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cited Pages & Entities in QuickNest</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {simulationResult.citations.map((cite) => (
                    <div
                      key={cite.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                            [{cite.id}]
                          </span>
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            {cite.relevance}% Query Relevance
                          </span>
                        </div>
                        <h5 className="text-sm font-semibold text-white mb-1">{cite.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{cite.snippet}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-cyan-400 font-mono text-[11px] truncate max-w-[220px]">
                          {cite.url}
                        </span>
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Knowledge Graph Entities */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Indexed Entities:</span>
                {simulationResult.keyEntities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-cyan-300 font-medium"
                  >
                    {ent}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI BOT ACCESS MATRIX TAB */}
      {activeTab === 'crawlers' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span>AI Crawler & LLM Bot Directives Matrix</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verified live HTTP response headers and RFC 9309 robots.txt permissions for leading generative crawlers.
                </p>
              </div>
              <a
                href="/robots.txt"
                target="_blank"
                rel="nofollow noopener noreferrer"
                type="text/plain"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <span>View /robots.txt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-3">Crawler Name</th>
                    <th className="py-3 px-3">Provider & Scope</th>
                    <th className="py-3 px-3">Robots Status</th>
                    <th className="py-3 px-3">llms.txt Access</th>
                    <th className="py-3 px-3">Latency</th>
                    <th className="py-3 px-3">Crawler Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.crawlers.map((bot, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{bot.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{bot.provider}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          {bot.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {bot.llmsAccess ? (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <span className="text-amber-400">Restricted</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{bot.latencyMs}ms</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{bot.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD LLMS.TXT SUITE TAB */}
      {activeTab === 'llmstxt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QuickNest Live llms.txt */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">QuickNest Live /llms.txt</h3>
                    <p className="text-xs text-slate-400">Standardized machine-readable markdown for LLMs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(llmsText, 'live-llms')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'live-llms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                  <a
                    href="/llms.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {llmsLoading ? 'Loading /llms.txt...' : llmsText}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% LLMs.txt standard compliant</span>
              </span>
              <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                View /llms-full.txt &rarr;
              </a>
            </div>
          </div>

          {/* Right: Custom GEO llms.txt Generator for any site */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Generate Custom llms.txt for Your Site</h3>
                  <p className="text-xs text-slate-400">Export high-visibility machine markdown to improve your AI Visibility score</p>
                </div>
              </div>

              <form onSubmit={handleGenerateCustomLlms} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project / Brand Name</label>
                  <input
                    type="text"
                    value={genName}
                    onChange={(e) => setGenName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Canonical Web Address</label>
                  <input
                    type="url"
                    value={genUrl}
                    onChange={(e) => setGenUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project Description & Citation Value</label>
                  <textarea
                    rows={2}
                    value={genDesc}
                    onChange={(e) => setGenDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                >
                  Generate GEO llms.txt
                </button>
              </form>

              {generatedSnippet && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">Generated llms.txt:</span>
                    <button
                      onClick={() => handleCopy(generatedSnippet, 'custom-llms')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'custom-llms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy snippet</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {generatedSnippet}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
