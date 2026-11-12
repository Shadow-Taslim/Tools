import { ActiveTool } from '../types.ts';
import { Shield, Lock, Clock, Terminal, ExternalLink } from 'lucide-react';
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

        {/* Comprehensive Crawlable Internal Link Directory & Standards */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 border-b border-slate-900 text-xs">
          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Privacy Utilities</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="/temp-mail"
                  onClick={(e) => { e.preventDefault(); onSelectTool('temp-mail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Disposable 10-Minute Temp Mail
                </a>
              </li>
              <li>
                <a
                  href="/url-shortener"
                  onClick={(e) => { e.preventDefault(); onSelectTool('url-shortener'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Safe URL Shortener &amp; Phishing Shield
                </a>
              </li>
              <li>
                <a
                  href="/qr-code"
                  onClick={(e) => { e.preventDefault(); onSelectTool('qr-code'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  High-Density QR Code Generator
                </a>
              </li>
              <li>
                <a
                  href="/password-generator"
                  onClick={(e) => { e.preventDefault(); onSelectTool('password-generator'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Cryptographic Password Suite
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">SEO &amp; Developer Tools</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="/ai-observability"
                  onClick={(e) => { e.preventDefault(); onSelectTool('ai-observability'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  AI Search Observability
                </a>
              </li>
              <li>
                <a
                  href="/robots-audit"
                  onClick={(e) => { e.preventDefault(); onSelectTool('robots-audit'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Robots.txt &amp; SEO Validator
                </a>
              </li>
              <li>
                <a
                  href="/security-checker"
                  onClick={(e) => { e.preventDefault(); onSelectTool('security-checker'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  HTTP Security Headers Checker
                </a>
              </li>
              <li>
                <a
                  href="/word-counter"
                  onClick={(e) => { e.preventDefault(); onSelectTool('word-counter'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Word &amp; Character Counter
                </a>
              </li>
              <li>
                <a
                  href="/text-case"
                  onClick={(e) => { e.preventDefault(); onSelectTool('text-case'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Case Converter &amp; Formatter
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Architecture &amp; AI Standards</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="/architecture"
                  onClick={(e) => { e.preventDefault(); onSelectTool('architecture'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-200 transition-colors"
                >
                  Zero-Retention System Architecture
                </a>
              </li>
              <li>
                <a
                  href="/guides"
                  onClick={(e) => { e.preventDefault(); onSelectTool('knowledge-hub'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-cyan-400 text-cyan-300 font-semibold transition-colors"
                >
                  Knowledge Hub &amp; Technical Guides
                </a>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  type="text/plain"
                  className="hover:text-cyan-400 transition-colors font-mono"
                >
                  /llms.txt (Standard AI Context)
                </a>
              </li>
              <li>
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  type="text/plain"
                  className="hover:text-cyan-400 transition-colors font-mono"
                >
                  /llms-full.txt (Technical Corpus)
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  type="application/xml"
                  className="hover:text-slate-200 transition-colors font-mono"
                >
                  /sitemap.xml (XML Index)
                </a>
              </li>
              <li>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  type="text/plain"
                  className="hover:text-slate-200 transition-colors font-mono"
                >
                  /robots.txt (RFC 9309 Rules)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Open Standards</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc9309"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>IETF RFC 9309 Standard</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Cryptography_API"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>MDN Web Cryptography</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://safebrowsing.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Google Safe Browsing</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://developers.google.com/search/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Google Search Central</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.w3.org/TR/CSP3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>W3C Security CSP3</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Trust &amp; Legal</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => { e.preventDefault(); onSelectTool('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-200 transition-colors"
                >
                  Privacy Policy &amp; Data Eviction
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => { e.preventDefault(); onSelectTool('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-200 transition-colors"
                >
                  Terms of Service &amp; Acceptable Use
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => { e.preventDefault(); onSelectTool('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-rose-400 transition-colors"
                >
                  Abuse Reporting &amp; Contact
                </a>
              </li>
            </ul>
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
              <span>Full-Stack MERN + WebGL</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
