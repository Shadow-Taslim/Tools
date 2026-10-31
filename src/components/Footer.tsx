import { ActiveTool } from '../types.ts';
import { Shield, Lock, Clock, Terminal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import LanguageSelector from './LanguageSelector.tsx';

interface FooterProps {
  onSelectTool: (tool: ActiveTool) => void;
}

export default function Footer({ onSelectTool }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Retention & Privacy Principles Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-900">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">{t('footer.ttlPurgeTitle', 'Strict TTL Data Purging')}</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {t('footer.ttlPurgeDesc', 'Temporary inboxes and emails expire within 10 to 60 minutes and are permanently wiped by our background sweeper.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">{t('footer.zeroAccountTitle', 'Zero Account Requirement')}</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {t('footer.zeroAccountDesc', 'No sign-ups, no passwords, and no trackers. Free disposable privacy tools accessible instantly to anyone.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">{t('footer.abuseShieldTitle', 'Proactive Abuse Shield')}</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {t('footer.abuseShieldDesc', 'Shortened URLs are pre-scanned against malware and phishing blocklists, with community reporting for fast takedown.')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-200">QuickNest</span>
            <span aria-hidden="true">·</span>
            <span>{t('footer.copyright', 'Zero-Retention Privacy Utilities')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400 text-[11px] flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>Full-Stack WebGL</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-slate-400">
            <button
              onClick={() => {
                onSelectTool('architecture');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 cursor-pointer"
            >
              {t('nav.architecture', 'Architecture')}
            </button>
            <button
              onClick={() => {
                onSelectTool('privacy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 cursor-pointer"
            >
              {t('nav.privacy', 'Privacy Policy')}
            </button>
            <button
              onClick={() => {
                onSelectTool('terms');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 cursor-pointer"
            >
              {t('nav.terms', 'Terms of Use')}
            </button>
            <button
              onClick={() => {
                onSelectTool('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-rose-400 cursor-pointer"
            >
              {t('nav.contact', 'Contact')}
            </button>

            {/* Language dropdown in footer */}
            <div className="pl-2 border-l border-slate-800">
              <LanguageSelector variant="footer" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
