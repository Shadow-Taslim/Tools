import { AlertTriangle, ShieldCheck, Scale } from 'lucide-react';

export default function TermsView() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Terms of Service & Acceptable Use
        </h1>
        <p className="text-slate-400 text-sm">
          Guidelines ensuring our free public utilities remain secure, resilient, and safe for all users.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>1. Acceptable Use Policy</span>
          </h2>
          <p>
            QuickNest provides free utilities for legitimate personal, research, and developer workflows. By using this service, you agree not to utilize any tool for abusive, malicious, deceptive, or unlawful purposes.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>2. Strict Prohibitions</span>
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Creating shortened URLs leading to malware, credential phishing pages, exploits, ransomware, or illegal material.</li>
            <li>Using disposable email inboxes to conduct spam campaigns, bypass security bans, or commit fraud.</li>
            <li>Attempting denial-of-service (DoS) attacks, automated bulk scraping, or bypassing rate limits.</li>
            <li>Targeting private internal IP addresses (RFC 1918) or loopback addresses.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>3. Automated Quarantine & Takedown</span>
          </h2>
          <p>
            We maintain real-time automated safety scanning and community abuse reporting. Any link flagged by multiple users or matching known threat feeds will be immediately placed in quarantine and disabled without prior notice.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white">4. Disclaimer of Warranties</h2>
          <p className="text-xs text-slate-400">
            These utilities are provided &quot;as is&quot; without warranties of any kind. As temporary disposable services, inboxes are ephemeral by design and must never be relied upon for mission-critical account recovery or permanent communications.
          </p>
        </div>
      </div>
    </div>
  );
}
