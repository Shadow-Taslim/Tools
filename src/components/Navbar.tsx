import { useState } from 'react';
import { ActiveTool } from '../types.ts';
import { Mail, Link2, QrCode, KeyRound, FileText, Menu, X, ShieldCheck, Bot, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import LanguageSelector from './LanguageSelector.tsx';

interface NavbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onQuickInbox: () => void;
}

export default function Navbar({ activeTool, onSelectTool, onQuickInbox }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navItems: { id: ActiveTool; label: string; icon: typeof Mail }[] = [
    { id: 'temp-mail', label: t('nav.tempMail', 'Temp Mail'), icon: Mail },
    { id: 'url-shortener', label: t('nav.urlShortener', 'URL Shortener'), icon: Link2 },
    { id: 'security-checker', label: t('nav.securityChecker', 'Security Checker'), icon: ShieldCheck },
    { id: 'ai-observability', label: t('nav.aiObservability', 'AI Search (74)'), icon: Sparkles },
    { id: 'robots-audit', label: t('nav.robotsAudit', 'Robots & SEO'), icon: Bot },
    { id: 'qr-code', label: t('nav.qrCode', 'QR Generator'), icon: QrCode },
    { id: 'password-generator', label: t('nav.passwords', 'Passwords'), icon: KeyRound }
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element brand wordmark */}
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onSelectTool('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></span>
          <span>{t('nav.brand', 'QuickNest')}</span>
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTool === item.id;
            return (
              <a
                key={item.id}
                href={`/${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onSelectTool(item.id);
                }}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  isActive
                    ? 'text-cyan-400 border-cyan-400 font-semibold'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Language Selector & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector Dropdown */}
          <LanguageSelector variant="navbar" />

          <button
            onClick={onQuickInbox}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-lg shadow-sm shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t('nav.quickInboxBtn', 'Generate 10m Mail')}</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-700"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onSelectTool('home');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              activeTool === 'home' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            {t('nav.home', 'Home Overview')}
          </a>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`/${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                onSelectTool(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
                activeTool === item.id ? 'text-cyan-400 bg-slate-900' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <item.icon className="w-4 h-4 text-slate-400" />
              <span>{item.label}</span>
            </a>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                onQuickInbox();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-xs font-semibold text-center text-slate-950 bg-cyan-400 rounded-lg cursor-pointer"
            >
              {t('nav.quickInboxBtn', 'Generate 10m Mail Now')}
            </button>
          </div>

          {/* Mobile language options */}
          <LanguageSelector variant="mobile" />
        </div>
      )}
    </header>
  );
}
