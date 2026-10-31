import { useState } from 'react';
import { ActiveTool, TempInbox } from '../types.ts';
import { 
  Mail, Link2, QrCode, KeyRound, FileText, Type, 
  ArrowRight, ShieldCheck, Clock, Zap, Sparkles, 
  ChevronRight, ExternalLink, RefreshCw, Terminal, Layers
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface HomeViewProps {
  onSelectTool: (tool: ActiveTool) => void;
  onQuickInbox: () => void;
  currentInbox: TempInbox | null;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HomeView({ onSelectTool, onQuickInbox, currentInbox, onShowToast }: HomeViewProps) {
  const { t } = useLanguage();
  const [quickUrl, setQuickUrl] = useState('');
  const [quickShortened, setQuickShortened] = useState<string | null>(null);
  const [isQuickShortening, setIsQuickShortening] = useState(false);

  const handleQuickShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    setIsQuickShortening(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl.trim() })
      });
      const data = await res.json();
      if (res.ok && data.shortUrl) {
        setQuickShortened(data.shortUrl);
        onShowToast(t('common.copied', 'Short link generated!'), 'success');
      } else {
        onShowToast(data.error || 'Failed to shorten URL', 'error');
      }
    } catch {
      onShowToast('Network error', 'error');
    } finally {
      setIsQuickShortening(false);
    }
  };

  const copyShortened = () => {
    if (!quickShortened) return;
    navigator.clipboard.writeText(quickShortened);
    onShowToast(t('common.copied', 'Copied to clipboard!'), 'success');
  };

  const toolsList = [
    {
      id: 'temp-mail' as ActiveTool,
      title: t('tempMail.title', 'Disposable 10-Minute Email'),
      description: t('tempMail.subtitle', 'Generate temporary disposable addresses with live countdown timers, automated message deletion, and production inbound webhooks.'),
      icon: Mail,
      accent: 'text-cyan-400',
      badge: t('nav.tempMail', 'Temp Mail'),
      action: t('common.preview', 'Open Inbox')
    },
    {
      id: 'url-shortener' as ActiveTool,
      title: t('shortener.title', 'Safe URL Shortener'),
      description: t('shortener.subtitle', 'Compress URLs with heuristic malware inspection, custom aliases, QR export, destination preview, and abuse reporting.'),
      icon: Link2,
      accent: 'text-sky-400',
      badge: t('nav.urlShortener', 'URL Shortener'),
      action: t('shortener.shortenBtn', 'Shorten Links')
    },
    {
      id: 'security-checker' as ActiveTool,
      title: t('checker.title', 'Health & Security Checker'),
      description: t('checker.subtitle', 'Audit website HTTP headers (HSTS, CSP, X-Frame-Options), SSL/TLS certificates, and response latency with Next.js & Cloudflare remediation.'),
      icon: ShieldCheck,
      accent: 'text-cyan-400',
      badge: t('checker.badge', 'Next.js Feature'),
      action: t('checker.analyzeBtn', 'Audit Website')
    },
    {
      id: 'qr-code' as ActiveTool,
      title: t('qrcode.title', 'High-Density QR Generator'),
      description: t('qrcode.subtitle', 'Generate customizable, high-resolution QR codes for URLs, WiFi credentials, vCards, and text with zero tracking.'),
      icon: QrCode,
      accent: 'text-emerald-400',
      badge: t('nav.qrCode', 'QR Generator'),
      action: t('qrcode.downloadPng', 'Create QR')
    },
    {
      id: 'password-generator' as ActiveTool,
      title: t('password.title', 'Cryptographic Password Suite'),
      description: t('password.subtitle', 'Generate high-entropy passphrases or NIST-compliant character sequences using client-side WebCrypto CSPRNG.'),
      icon: KeyRound,
      accent: 'text-violet-400',
      badge: t('nav.passwords', 'Passwords'),
      action: t('password.generateBtn', 'Generate Key')
    },
    {
      id: 'word-counter' as ActiveTool,
      title: t('wordCounter.title', 'Word & Telemetry Counter'),
      description: t('wordCounter.subtitle', 'Real-time word, character, speaking cadence, and keyword frequency analyzer with HTML stripping utilities.'),
      icon: FileText,
      accent: 'text-amber-400',
      badge: t('nav.wordCounter', 'Word Counter'),
      action: t('common.preview', 'Analyze Text')
    },
    {
      id: 'text-case' as ActiveTool,
      title: t('textCase.title', 'Case Converter & Formatter'),
      description: t('textCase.subtitle', 'Instant transformation between camelCase, PascalCase, snake_case, kebab-case, title case, and uppercase.'),
      icon: Type,
      accent: 'text-rose-400',
      badge: t('nav.textCase', 'Case Converter'),
      action: t('common.apply', 'Convert Case')
    }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* 3D Spatial Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-16 sm:pb-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{t('home.badge', 'Zero-Retention Online Utility Suite')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {t('home.heroTitle', 'Privacy-First Developer Utilities & Ephemeral Inboxes')}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('home.heroSubtitle', 'Disposable temporary email inboxes, malicious-link-filtered URL shortener, high-density QR generator, and cryptographic password tools with zero account friction.')}
          </p>

          {/* Quick Action Widget Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onSelectTool('temp-mail')}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>{t('nav.quickInboxBtn', 'Launch 10-Minute Mail')}</span>
            </button>

            <button
              onClick={() => onSelectTool('url-shortener')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>{t('nav.urlShortener', 'Shorten a URL')}</span>
            </button>
          </div>
        </div>

        {/* Dual Quick Utility Hero Dock */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          
          {/* Quick Temp Mail Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Instant Disposable Mail</span>
              </span>
              <span className="font-mono text-emerald-400 text-[11px]">Ready</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 truncate select-all">
              {currentInbox ? currentInbox.address : 'Generating disposable address...'}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">10-minute auto-expiry</span>
              <button
                onClick={() => onSelectTool('temp-mail')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View Inbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Shortener Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-sky-400" />
                <span>Quick URL Compressor</span>
              </span>
              <span className="font-mono text-cyan-400 text-[11px]">Pre-Scanned</span>
            </div>
            <form onSubmit={handleQuickShorten} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/very/long/url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                required
              />
              <button
                type="submit"
                disabled={isQuickShortening}
                className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
              >
                {isQuickShortening ? 'Shortening...' : 'Shorten'}
              </button>
            </form>
            {quickShortened ? (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-mono text-cyan-400 font-semibold truncate max-w-[200px]">{quickShortened}</span>
                <button
                  onClick={copyShortened}
                  className="text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Includes phishing heuristic scan</span>
                <button
                  onClick={() => onSelectTool('url-shortener')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Advanced Suite</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Complete Tools Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Comprehensive Utility Suite
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Zero sign-up required. Every tool operates autonomously with strict data retention limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsList.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 p-6 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-cyan-950/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 group-hover:border-cyan-500/40 transition-colors">
                      <Icon className={`w-6 h-6 ${tool.accent}`} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tool.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-6 mt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      onSelectTool(tool.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 px-4 bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 group-hover:border-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{tool.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Production Architecture Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8 sm:p-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
                Infrastructure Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Engineered for High-Speed Privacy & Zero Retention
              </h2>
            </div>

            <button
              onClick={() => {
                onSelectTool('architecture');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-2 w-fit shrink-0"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Full Topology & SQL DDL</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
              <span className="font-semibold text-slate-200 block">PostgreSQL Database</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Relational schema with cascading foreign keys to purge inboxes and messages synchronously.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
              <span className="font-semibold text-slate-200 block">Redis Rate Limiter</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Token-bucket algorithm preventing automated brute-force attempts and DoS abuse.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
              <span className="font-semibold text-slate-200 block">Inbound Webhook</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Direct integration with Mailgun, Cloudflare Email Routing, and SendGrid MX handlers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
              <span className="font-semibold text-slate-200 block">Autonomous Sweeper</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Background thread executing every 10 seconds to delete expired temporary records.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
