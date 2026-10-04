import { useState } from 'react';
import { Mail, AlertTriangle, Send, CheckCircle2, Shield } from 'lucide-react';

interface ContactViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ContactView({ onShowToast }: ContactViewProps) {
  const [activeTab, setActiveTab] = useState<'abuse' | 'general'>('abuse');
  
  // Abuse form state
  const [linkCode, setLinkCode] = useState('');
  const [reason, setReason] = useState('phishing');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // General inquiry state
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const handleAbuseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shorten/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: linkCode.trim(),
          reason,
          details
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        onShowToast('Abuse report filed. Link placed under review.', 'success');
      } else {
        onShowToast(data.error || 'Failed to submit report', 'error');
      }
    } catch {
      onShowToast('Error submitting report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Thank you! Your feedback has been received.', 'success');
    setContactEmail('');
    setContactMsg('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Contact & Takedown Desk
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Report malicious links, submit security disclosures, or reach the engineering team.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('abuse')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'abuse' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Abuse / Malicious Link</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'general' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>General Contact</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        {activeTab === 'abuse' ? (
          submitted ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Report Successfully Submitted</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Thank you for contributing to web safety. The link code has been registered in our threat database and quarantined if multiple reports have accumulated.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setLinkCode('');
                  setDetails('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg cursor-pointer"
              >
                Report Another Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleAbuseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="abuse-link-code" className="text-xs font-semibold text-slate-300">
                  Target Link Code or URL
                </label>
                <input
                  id="abuse-link-code"
                  type="text"
                  placeholder="e.g. k92la or https://quicknest.org/s/k92la"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="abuse-category-select" className="text-xs font-semibold text-slate-300">
                  Violation Category
                </label>
                <select
                  id="abuse-category-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="phishing">Credential Phishing / Banking Scam</option>
                  <option value="malware">Malware / Virus Distribution</option>
                  <option value="spam">Unsolicited Commercial Spam / Botnet</option>
                  <option value="copyright">Copyright Infringement / DMCA</option>
                  <option value="illegal">Harmful / Prohibited Content</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="abuse-details-textarea" className="text-xs font-semibold text-slate-300">
                  Evidence or Explanation
                </label>
                <textarea
                  id="abuse-details-textarea"
                  rows={4}
                  placeholder="Provide any additional details or the destination URL you observed..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
              >
                <Shield className="w-4 h-4" />
                <span>{isSubmitting ? 'Filing Report...' : 'File Instant Abuse Takedown'}</span>
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleGeneralSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="contact-email-input" className="text-xs font-semibold text-slate-300">
                Your Email Address (Optional for reply)
              </label>
              <input
                id="contact-email-input"
                type="email"
                placeholder="you@domain.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-message-textarea" className="text-xs font-semibold text-slate-300">
                Message / Feedback
              </label>
              <textarea
                id="contact-message-textarea"
                rows={5}
                placeholder="Questions, integration feedback, or suggestions..."
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
