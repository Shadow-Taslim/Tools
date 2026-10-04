import { Shield, Clock, Lock, CheckCircle2 } from 'lucide-react';

export default function PrivacyView() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Privacy Policy & Data Retention
        </h1>
        <p className="text-slate-400 text-sm">
          Last updated: October 2026 · Strict zero-knowledge, zero-log architecture
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>1. Core Zero-Account Guarantee</span>
          </h2>
          <p>
            QuickNest operates on a fundamental principle of data minimization: we never require user accounts, email signups, passwords, phone numbers, or credit cards to access any utility on this website. All operations are completely anonymous.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>2. Strict Ephemeral Data Retention (TTL)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-400 text-sm block">Temporary Email Inboxes</span>
              <p className="text-slate-400">
                Inboxes expire after 10 minutes by default (extendable up to 60 minutes). When an inbox expires, its record and all associated received messages are immediately and permanently erased from memory and disk by our autonomous background sweeper.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-400 text-sm block">Shortened URLs</span>
              <p className="text-slate-400">
                Short links are retained for 7 to 90 days as chosen by the creator, or permanently if active. Click metrics record aggregated visit counts without tracking user IPs or personal identifiers.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>3. Client-Side Cryptographic Processing</span>
          </h2>
          <p>
            Passwords generated via our Password Suite are computed entirely within your local web browser using the standard W3C Web Cryptography API (<code className="text-cyan-300 font-mono">crypto.getRandomValues</code>). Generated passwords are never transmitted across any network or recorded on our servers.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white">4. No Third-Party Tracking or Cookies</h2>
          <p>
            We do not sell data to data brokers, do not deploy behavioral tracking cookies, and do not embed third-party surveillance scripts.
          </p>
        </div>
      </div>
    </div>
  );
}
