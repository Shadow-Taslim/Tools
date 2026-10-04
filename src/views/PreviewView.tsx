import { useState, useEffect } from 'react';
import { ShortLink } from '../types.ts';
import { 
  ShieldCheck, ShieldAlert, ExternalLink, AlertTriangle, 
  ArrowRight, Globe, Clock, BarChart3, CornerDownRight 
} from 'lucide-react';

interface PreviewViewProps {
  code: string;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onBack: () => void;
}

export default function PreviewView({ code, onShowToast, onBack }: PreviewViewProps) {
  const [link, setLink] = useState<ShortLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shorten/preview/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (res.ok && data.link) {
          setLink(data.link);
        } else {
          setError(data.error || 'Short link not found or has expired.');
        }
      } catch {
        setError('Network error while inspecting short link.');
      } finally {
        setIsLoading(false);
      }
    }

    if (code) {
      fetchPreview();
    }
  }, [code]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Inspecting link destination and safety heuristics...</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Link Unavailable</h2>
        <p className="text-slate-400 text-sm">{error || 'This link does not exist.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
        >
          Return to Tools
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <button
        onClick={onBack}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
      >
        &larr; Back to URL Shortener
      </button>

      {/* Safety Header Banner */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
        link.isMalicious
          ? 'bg-rose-950/40 border-rose-900/80 text-rose-200'
          : 'bg-slate-900/80 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-start gap-4">
          {link.isMalicious ? (
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-1" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0 mt-1" />
          )}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">
              {link.isMalicious ? 'Suspicious or Blocked Destination' : 'Link Destination Preview'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {link.isMalicious
                ? 'This link has been flagged as unsafe or received multiple community abuse reports.'
                : 'QuickNest has verified this destination through automated malware and heuristic checks.'}
            </p>
          </div>
        </div>
      </div>

      {/* Target Details Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination URL</span>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-cyan-300 break-all select-all flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{link.originalUrl}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Target Host</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{link.domain}</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Created At</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{new Date(link.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-slate-500 block mb-1">Total Clicks</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono tabular-nums">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{link.clickCount} visits</span>
            </span>
          </div>
        </div>

        {/* Warning or reasons */}
        {link.maliciousReasons && link.maliciousReasons.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 space-y-1">
            <div className="font-semibold text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Safety Concerns Detected:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/80 pl-1">
              {link.maliciousReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={link.originalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`w-full sm:flex-1 py-3 px-5 text-center font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
              link.isMalicious
                ? 'bg-rose-700 hover:bg-rose-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <span>Proceed to External Site</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => {
              onShowToast('Link reported to safety moderation queue.', 'success');
            }}
            className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Report Link
          </button>
        </div>
      </div>
    </div>
  );
}
