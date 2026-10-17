import { useState, useEffect, useRef } from 'react';
import { TempInbox, EmailMessage } from '../types.ts';
import { 
  Mail, Copy, RefreshCw, PlusCircle, Trash2, Clock, 
  Send, ExternalLink, Shield, Check, AlertTriangle, 
  ChevronRight, Inbox, Terminal, Code, Paperclip
} from 'lucide-react';

interface TempMailViewProps {
  currentInbox: TempInbox | null;
  onInboxCreated: (inbox: TempInbox) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TempMailView({ currentInbox, onInboxCreated, onShowToast }: TempMailViewProps) {
  const [inbox, setInbox] = useState<TempInbox | null>(currentInbox);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [customHandle, setCustomHandle] = useState<string>('');
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'html' | 'text' | 'headers'>('html');
  const [showWebhookGuide, setShowWebhookGuide] = useState<boolean>(false);
  const [showSendTest, setShowSendTest] = useState<boolean>(false);
  const [testTemplate, setTestTemplate] = useState<'verification' | 'newsletter' | 'custom' | 'attachment'>('verification');
  const [customSubject, setCustomSubject] = useState<string>('Test Alert from External App');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const initialFetchDone = useRef<boolean>(false);

  // Load existing or create fresh inbox on mount
  useEffect(() => {
    if (currentInbox) {
      setInbox(currentInbox);
    } else if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      createNewInbox();
    }
  }, [currentInbox]);

  // Polling messages & timer countdown with Real-time SSE Stream
  useEffect(() => {
    if (!inbox) return;

    // Fetch initial messages immediately
    fetchMessages(inbox.address);

    // Setup real-time Server-Sent Events (SSE) connection for instant (<15ms) delivery
    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `/api/email/inbox/${encodeURIComponent(inbox.address)}/stream?token=${encodeURIComponent(inbox.token)}`;
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'new_message' && payload.message) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === payload.message.id);
              if (exists) return prev;
              return [payload.message, ...prev];
            });
            onShowToast(`New message received: ${payload.message.subject}`, 'success');
          }
        } catch {
          // Heartbeat or malformed frame
        }
      };

      eventSource.onerror = () => {
        // Fallback polling will handle it if SSE disconnects
      };
    } catch {
      // Fallback to polling
    }

    // Interval to count down seconds
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Timer expired
          handleInboxExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fast backup poll interval every 2.5s (down from 4s)
    const pollInterval = setInterval(() => {
      fetchMessages(inbox.address, true);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [inbox]);

  const createNewInbox = async (handle?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customHandle: handle })
      });
      const data = await res.json();
      if (res.ok && data.inbox) {
        setInbox(data.inbox);
        onInboxCreated(data.inbox);
        setMessages([]);
        setSelectedMessage(null);
        setRemainingSeconds(600);
        setShowCustomize(false);
        onShowToast('New disposable inbox generated', 'success');
      } else {
        onShowToast(data.error || 'Failed to create inbox', 'error');
      }
    } catch {
      onShowToast('Network error while creating inbox', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (address: string, silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (inbox?.token) {
        headers['x-inbox-token'] = inbox.token;
      }

      const res = await fetch(`/api/email/inbox/${encodeURIComponent(address)}/messages`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else if (res.status === 404) {
        handleInboxExpired();
      }
    } catch {
      // Ignore network flutter during silent poll
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleInboxExpired = () => {
    onShowToast('This temporary inbox has expired and was automatically deleted.', 'info');
    setInbox(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  const extendTimer = async (minutes: number) => {
    if (!inbox) return;
    try {
      const res = await fetch(`/api/email/inbox/${encodeURIComponent(inbox.address)}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-inbox-token': inbox.token
        },
        body: JSON.stringify({ minutes })
      });
      const data = await res.json();
      if (res.ok && data.remainingSeconds) {
        setRemainingSeconds(data.remainingSeconds);
        onShowToast(`Timer extended by ${minutes} minutes!`, 'success');
      }
    } catch {
      onShowToast('Failed to extend inbox timer', 'error');
    }
  };

  const deleteInboxNow = async () => {
    if (!inbox) return;
    if (!confirm('Are you sure you want to delete this inbox now? All messages will be permanently wiped.')) return;

    try {
      await fetch(`/api/email/inbox/${encodeURIComponent(inbox.address)}`, {
        method: 'DELETE',
        headers: {
          'x-inbox-token': inbox.token
        }
      });
      onShowToast('Inbox and all messages permanently wiped.', 'success');
      createNewInbox();
    } catch {
      onShowToast('Error deleting inbox', 'error');
    }
  };

  const copyAddress = () => {
    if (!inbox) return;
    navigator.clipboard.writeText(inbox.address);
    setCopied(true);
    onShowToast('Disposable email copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTestEmail = async () => {
    if (!inbox) return;
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inbox.address,
          template: testTemplate,
          customSubject: customSubject
        })
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast('Test email sent to inbox!', 'success');
        setShowSendTest(false);
        fetchMessages(inbox.address);
      } else {
        onShowToast(data.error || 'Failed to dispatch test mail', 'error');
      }
    } catch {
      onShowToast('Error triggering test mail', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (remainingSeconds / 600) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Disposable 10-Minute Email
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Zero sign-up temporary address to receive activation codes, prevent spam, and bypass registrations. Expired data is permanently erased.
        </p>
      </div>

      {/* Main Inbox Controller Card */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Address and Actions */}
          <div className="w-full lg:w-2/3 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Your Active Temporary Address</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-emerald-400">Listening for incoming mail</span>
              </div>
            </div>

            {/* Email Address Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 shadow-inner">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
                <input
                  type="text"
                  readOnly
                  value={
                    !inbox
                      ? 'No active inbox'
                      : remainingSeconds <= 0
                      ? `${inbox.address} (Expired)`
                      : inbox.address
                  }
                  className={`bg-transparent font-mono text-sm sm:text-base w-full focus:outline-none select-all ${
                    remainingSeconds <= 0 || !inbox ? 'text-slate-500 line-through' : 'text-slate-100'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Active state: Copy Address button (Visible while time has NOT finished) */}
                {remainingSeconds > 0 && inbox && (
                  <button
                    onClick={copyAddress}
                    disabled={!inbox || isLoading}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
                    title="Copy email address"
                  >
                    {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                )}

                {/* Expired state: Retry Icon Button (ONLY shown when expiring time is finished) */}
                {(remainingSeconds <= 0 || !inbox) && (
                  <button
                    onClick={() => createNewInbox()}
                    disabled={isLoading}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                    title="Expiring time finished - Click to Retry and get a new email"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Retry / New Address</span>
                  </button>
                )}

                {/* Customize handle (only visible while active) */}
                {remainingSeconds > 0 && inbox && (
                  <button
                    onClick={() => setShowCustomize(!showCustomize)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="Change address username"
                    aria-label="Change address"
                  >
                    <Code className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom handle input drawer */}
            {showCustomize && remainingSeconds > 0 && inbox && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  placeholder="Custom username (e.g. privacy_alex)"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => createNewInbox(customHandle)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Apply Custom Address
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => extendTimer(10)}
                disabled={!inbox || remainingSeconds <= 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>+10 Minutes</span>
              </button>

              <button
                onClick={() => extendTimer(30)}
                disabled={!inbox || remainingSeconds <= 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5 text-violet-400" />
                <span>+30 Minutes</span>
              </button>

              <button
                onClick={() => createNewInbox()}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>New Address</span>
              </button>

              <button
                onClick={deleteInboxNow}
                disabled={!inbox || remainingSeconds <= 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-medium rounded-lg border border-rose-900/40 transition-colors cursor-pointer ml-auto disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Now</span>
              </button>
            </div>
          </div>

          {/* Countdown Timer Display */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-4 border border-slate-800 rounded-xl bg-slate-950/50">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-slate-800 stroke-current"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`stroke-current transition-all duration-1000 ${
                    remainingSeconds > 180 ? 'text-cyan-400' : remainingSeconds > 60 ? 'text-amber-400' : 'text-rose-500 animate-pulse'
                  }`}
                  strokeWidth="6"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${remainingSeconds <= 0 ? 'text-rose-400' : 'text-white'}`}>
                  {remainingSeconds <= 0 ? '00:00' : formatTime(remainingSeconds)}
                </span>
                <span className={`text-[10px] uppercase tracking-widest mt-0.5 ${remainingSeconds <= 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                  {remainingSeconds <= 0 ? 'Expired' : 'Expires in'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs">
              <button
                onClick={() => setShowSendTest(!showSendTest)}
                className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Send Test Mail</span>
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Terminal className="w-3 h-3" />
                <span>Webhook API</span>
              </button>
            </div>
          </div>
        </div>

        {/* Test Email Sender Drawer */}
        {showSendTest && (
          <div className="mt-6 pt-6 border-t border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>Send Real Inbound Email to this Address</span>
              </h3>
              <button
                onClick={() => setShowSendTest(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify receipt without waiting for external mail services. This exercises the backend webhook parsing pipeline and places a real incoming message into your inbox.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setTestTemplate('verification')}
                className={`p-3 text-left rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  testTemplate === 'verification' ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-semibold mb-1">6-Digit Code</div>
                <div className="text-[11px] text-slate-400">Account OTP / login code</div>
              </button>

              <button
                onClick={() => setTestTemplate('attachment')}
                className={`p-3 text-left rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  testTemplate === 'attachment' ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-semibold mb-1 flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-cyan-400" />
                  <span>With Attachments</span>
                </div>
                <div className="text-[11px] text-slate-400">PDF + JSON files attached</div>
              </button>

              <button
                onClick={() => setTestTemplate('newsletter')}
                className={`p-3 text-left rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  testTemplate === 'newsletter' ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-semibold mb-1">HTML Newsletter</div>
                <div className="text-[11px] text-slate-400">Rich HTML formatted message</div>
              </button>

              <button
                onClick={() => setTestTemplate('custom')}
                className={`p-3 text-left rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  testTemplate === 'custom' ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-semibold mb-1">Custom Message</div>
                <div className="text-[11px] text-slate-400">Custom subject & text</div>
              </button>
            </div>

            {testTemplate === 'custom' && (
              <input
                type="text"
                placeholder="Custom subject line..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            )}

            <button
              onClick={sendTestEmail}
              disabled={isSendingTest}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isSendingTest ? 'Delivering...' : 'Deliver Email to Inbox'}
            </button>
          </div>
        )}

        {/* Webhook & Inbound Provider Integration Instructions */}
        {showWebhookGuide && (
          <div className="mt-6 pt-6 border-t border-slate-800 bg-slate-950/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Production Inbound Email Webhook & MX Config</span>
              </h3>
              <button onClick={() => setShowWebhookGuide(false)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In production, point your domain&apos;s MX records to your inbound email handler (Cloudflare Email Routing, SendGrid Inbound Parse, Mailgun, or Postmark). Have the provider forward incoming mail to this webhook:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-300 overflow-x-auto">
              POST https://yourdomain.com/api/email/inbound-webhook
            </div>
            <p className="text-[11px] text-slate-500">
              Compatible with standard JSON, SendGrid, and Mailgun multipart payloads. Inboxes are matched against the &apos;to&apos; address and automatically refreshed.
            </p>
          </div>
        )}
      </div>

      {/* Messages Inbox Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Messages List (Left column) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">Inbox Messages</h2>
              <span className="text-xs font-mono bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-full tabular-nums">
                {messages.length}
              </span>
            </div>
            {remainingSeconds > 0 && inbox ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Stream</span>
              </div>
            ) : (
              <button
                onClick={() => createNewInbox()}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Session</span>
              </button>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                <Clock className="w-6 h-6 animate-pulse text-cyan-400/80" />
              </div>
              <p className="text-sm font-medium text-slate-300">Awaiting incoming mail...</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Any emails sent to <span className="font-mono text-slate-400">{inbox?.address}</span> will appear here automatically every 4 seconds.
              </p>
              <button
                onClick={() => setShowSendTest(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send test email to this inbox</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium text-cyan-400 truncate max-w-[180px]">
                        {msg.fromName || msg.fromAddress}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums">
                        {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100 truncate mb-1">
                      {msg.subject || '(No Subject)'}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">
                      {msg.bodyText || 'HTML formatted message'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Detail Viewer (Right column) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 min-h-[460px] flex flex-col">
          {selectedMessage ? (
            <div className="space-y-5 flex-1 flex flex-col">
              {/* Message Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {selectedMessage.subject || '(No Subject)'}
                  </h2>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setViewMode('html')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'html' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'text' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Plain
                    </button>
                    <button
                      onClick={() => setViewMode('headers')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'headers' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Headers
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">From: </span>
                    <span className="font-semibold text-slate-200">{selectedMessage.fromName}</span>{' '}
                    <span className="font-mono text-slate-400">&lt;{selectedMessage.fromAddress}&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Date: </span>
                    <span className="text-slate-300 font-mono tabular-nums">
                      {new Date(selectedMessage.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Size: </span>
                    <span className="font-mono text-slate-400">
                      {(selectedMessage.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {/* Attachments list if message has attached files */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Attachments ({selectedMessage.attachments.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-xs">
                          <span className="font-mono text-cyan-300">{att.filename}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({(att.sizeBytes / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 p-4">
                {viewMode === 'html' && (
                  <iframe
                    title="Sanitized Email Content"
                    sandbox="allow-same-origin"
                    srcDoc={selectedMessage.bodyHtml}
                    className="w-full h-full min-h-[360px] bg-white rounded-lg border-0"
                  />
                )}

                {viewMode === 'text' && (
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[380px]">
                    {selectedMessage.bodyText || selectedMessage.bodyHtml}
                  </pre>
                )}

                {viewMode === 'headers' && (
                  <div className="space-y-2 overflow-y-auto max-h-[380px] font-mono text-xs">
                    <p className="text-slate-400">Delivered-To: {selectedMessage.inboxAddress}</p>
                    <p className="text-slate-400">From: {selectedMessage.fromAddress}</p>
                    <p className="text-slate-400">Subject: {selectedMessage.subject}</p>
                    <p className="text-slate-400">Date: {new Date(selectedMessage.receivedAt).toUTCString()}</p>
                    {selectedMessage.headers && Object.entries(selectedMessage.headers).map(([key, val]) => (
                      <p key={key} className="text-slate-400">{key}: {val}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Mail className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">No message selected</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Select an incoming message from the list on the left to read its sanitized contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
