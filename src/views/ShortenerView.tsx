import { useState } from 'react';
import { ShortLink } from '../types.ts';
import { 
  Link2, Copy, Check, ShieldAlert, ShieldCheck, 
  ExternalLink, QrCode, AlertTriangle, Eye, ArrowRight,
  Sparkles, Clock, Globe
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShortenerViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToPreview: (code: string) => void;
}

export default function ShortenerView({ onShowToast, onNavigateToPreview }: ShortenerViewProps) {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [allowDirectRedirect, setAllowDirectRedirect] = useState(true);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ link: ShortLink; shortUrl: string; previewUrl: string } | null>(null);
  const [copiedShort, setCopiedShort] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  
  // Abuse Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCode, setReportCode] = useState('');
  const [reportReason, setReportReason] = useState('phishing');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Recent links created in this session
  const [recentLinks, setRecentLinks] = useState<{ code: string; shortUrl: string; originalUrl: string; createdAt: number }[]>([]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl.trim()) {
      onShowToast('Please enter a destination URL', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: longUrl.trim(),
          customCode: customAlias.trim() || undefined,
          directRedirect: allowDirectRedirect,
          expiresInDays: expiryDays
        })
      });

      const data = await res.json();
      if (res.ok && data.link) {
        setCreatedLink(data);
        onShowToast('Short link generated successfully!', 'success');
        
        // Generate QR code
        try {
          const qr = await QRCode.toDataURL(data.shortUrl, {
            width: 260,
            margin: 2,
            color: { dark: '#020617', light: '#ffffff' }
          });
          setQrCodeDataUrl(qr);
        } catch {
          // ignore qr error
        }

        // Add to recents
        setRecentLinks(prev => [
          {
            code: data.link.code,
            shortUrl: data.shortUrl,
            originalUrl: data.link.originalUrl,
            createdAt: Date.now()
          },
          ...prev.slice(0, 4)
        ]);

        // Reset input fields
        setLongUrl('');
        setCustomAlias('');
      } else {
        const errorMsg = data.reasons?.length ? data.reasons.join(' · ') : data.error || 'Failed to shorten URL';
        onShowToast(errorMsg, 'error');
      }
    } catch {
      onShowToast('Network error while creating short link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedShort(true);
    onShowToast('Short link copied to clipboard!', 'success');
    setTimeout(() => setCopiedShort(false), 2000);
  };

  const submitAbuseReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportCode.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await fetch('/api/shorten/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: reportCode.trim(),
          reason: reportReason,
          details: reportDetails
        })
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Report submitted successfully.', 'success');
        setShowReportModal(false);
        setReportCode('');
        setReportDetails('');
      } else {
        onShowToast(data.error || 'Failed to submit report', 'error');
      }
    } catch {
      onShowToast('Error reporting link', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Secure URL Shortener
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Compress lengthy links with automated malware scanning, customizable destination preview, rate limiting, and instantaneous community abuse mitigation.
        </p>
      </div>

      {/* Main Shortener Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        <form onSubmit={handleShorten} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="long-url-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Long URL
            </label>
            <div className="relative flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all shadow-inner">
              <Link2 className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
              <input
                id="long-url-input"
                type="text"
                placeholder="https://example.com/very/long/article/or/resource?id=92841"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="bg-transparent text-white text-sm sm:text-base w-full focus:outline-none placeholder-slate-500"
                required
              />
            </div>
          </div>

          {/* Advanced Options Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="custom-alias-input" className="block text-xs font-medium text-slate-400">
                Custom Alias (Optional)
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono">
                <span className="text-slate-500 mr-1">quicknest.to/s/</span>
                <input
                  id="custom-alias-input"
                  type="text"
                  placeholder="my-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="bg-transparent text-white focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="retention-period-select" className="block text-xs font-medium text-slate-400">
                Retention Lifecycle
              </label>
              <select
                id="retention-period-select"
                value={expiryDays || ''}
                onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="7">7 Days (Auto-expire)</option>
                <option value="30">30 Days (Recommended)</option>
                <option value="90">90 Days</option>
                <option value="">Permanent (Until zero activity)</option>
              </select>
            </div>
          </div>

          {/* Safety Settings Switch */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Destination Safety Interstitial</span>
                <span className="text-[11px] text-slate-400 leading-tight">
                  {allowDirectRedirect
                    ? 'Direct 302 redirect enabled (visitors go straight to target website).'
                    : 'Visitors will first see a destination preview and safety report before proceeding.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAllowDirectRedirect(!allowDirectRedirect)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                allowDirectRedirect
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {allowDirectRedirect ? 'Direct Redirect (Active)' : 'Require Safety Preview'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Scanning Safety & Compressing...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Shorten Link</span>
              </>
            )}
          </button>
        </form>

        {/* Generated Link Result Section */}
        {createdLink && (
          <div className="mt-8 pt-8 border-t border-slate-800 space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Link Verified Safe & Ready to Share</span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 w-full md:w-auto">
                <span className="text-xs text-slate-500">Shortened Address:</span>
                <div className="text-base sm:text-lg font-mono font-bold text-cyan-400 select-all break-all">
                  {createdLink.shortUrl}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-md">
                  Target: {createdLink.link.originalUrl}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => copyToClipboard(createdLink.shortUrl)}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  {copiedShort ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShort ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => onNavigateToPreview(createdLink.link.code)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1"
                  title="Inspect destination preview"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <a
                  href={createdLink.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1"
                  title="Test link destination"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* QR Code Card */}
            {qrCodeDataUrl && (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="p-2 bg-white rounded-lg shadow-md shrink-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="Short Link QR Code"
                    className="w-24 h-24"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 justify-center sm:justify-start">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Mobile QR Scan Ready</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Scan with any smartphone camera to visit the shortened destination immediately.
                  </p>
                  <a
                    href={qrCodeDataUrl}
                    download={`quicknest-${createdLink.link.code}-qr.png`}
                    className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Download QR Code Image (PNG) &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recents & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Session Short Links</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Zero server logging</span>
          </div>

          {recentLinks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No links created in this browser session yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentLinks.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-cyan-400 font-semibold truncate">
                      {item.shortUrl}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm">
                      {item.originalUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyToClipboard(item.shortUrl)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer"
                      title="Copy short link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigateToPreview(item.code)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer"
                      title="View safety preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anti-Abuse & Reporting Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Report Abusive Link</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Found a link pointing to malware, phishing, or harassment? Submit the alias code for immediate quarantine.
            </p>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold rounded-xl border border-rose-900/40 transition-colors cursor-pointer"
          >
            File Link Abuse Report
          </button>
        </div>
      </div>

      {/* Abuse Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Report Malicious Short Link</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitAbuseReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Link Code / Alias</label>
                <input
                  type="text"
                  placeholder="e.g. k92la or custom alias"
                  value={reportCode}
                  onChange={(e) => setReportCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Violation Category</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="phishing">Credential Phishing / Scam</option>
                  <option value="malware">Malware / Ransomware Download</option>
                  <option value="spam">Unsolicited Commercial Spam</option>
                  <option value="illegal">Illegal or Prohibited Content</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Additional Evidence</label>
                <textarea
                  placeholder="Provide context or redirect evidence..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
                >
                  {isSubmittingReport ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
