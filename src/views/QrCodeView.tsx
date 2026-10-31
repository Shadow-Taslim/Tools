import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode as QrIcon, Download, Copy, Check, Wifi, 
  Globe, Type, User, Mail, Sparkles, RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface QrCodeViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type QrMode = 'url' | 'text' | 'wifi' | 'vcard' | 'email';

export default function QrCodeView({ onShowToast }: QrCodeViewProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<QrMode>('url');
  
  // Inputs
  const [urlInput, setUrlInput] = useState('https://quicknest.org');
  const [textInput, setTextInput] = useState('Secure, ephemeral utility suite');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  
  // vCard
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');

  // Email
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState(2);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute raw payload based on mode
  const getPayload = () => {
    switch (mode) {
      case 'url':
        return urlInput.trim() || 'https://quicknest.org';
      case 'text':
        return textInput.trim() || 'Text content';
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      default:
        return 'https://quicknest.org';
    }
  };

  useEffect(() => {
    const payload = getPayload();
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 320,
          margin: margin,
          errorCorrectionLevel: ecc,
          color: {
            dark: fgColor,
            light: bgColor
          }
        },
        (error) => {
          if (!error && canvasRef.current) {
            setDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [mode, urlInput, textInput, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail, emailTo, emailSubject, fgColor, bgColor, ecc, margin]);

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `quicknest-qr-${Date.now()}.png`;
    a.click();
    onShowToast('QR Code downloaded (PNG)', 'success');
  };

  const copyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        onShowToast('QR image copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      onShowToast('Clipboard image write not supported in this browser', 'info');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('qrcode.title', 'High-Density QR Code Generator')}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {t('qrcode.subtitle', 'Generate customizable, high-resolution QR codes for websites, WiFi networks, and plain text with zero tracking.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-6">
          
          {/* Format Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'url' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL</span>
            </button>

            <button
              onClick={() => setMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'text' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Plain Text</span>
            </button>

            <button
              onClick={() => setMode('wifi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'wifi' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>WiFi Access</span>
            </button>

            <button
              onClick={() => setMode('vcard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'vcard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>vCard Contact</span>
            </button>

            <button
              onClick={() => setMode('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'email' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>

          {/* Form Fields by Mode */}
          <div className="space-y-4">
            {mode === 'url' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            )}

            {mode === 'text' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Text Content</label>
                <textarea
                  rows={4}
                  placeholder="Enter notes, serial numbers, cryptographic keys..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            )}

            {mode === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Network SSID (Name)</label>
                  <input
                    type="text"
                    placeholder="Home_5G_Network"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">WiFi Password</label>
                  <input
                    type="password"
                    placeholder="Passphrase"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Security Encryption</label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP (Legacy)</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Alex Vance"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2831"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="alex@domain.org"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Recipient Address</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Default Subject</label>
                  <input
                    type="text"
                    placeholder="Quick Inquiry"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Style & Error Correction Tweaks */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Pattern Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px] text-slate-300">{fgColor}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Background</label>
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px] text-slate-300">{bgColor}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Error Correction</label>
              <select
                value={ecc}
                onChange={(e) => setEcc(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
              >
                <option value="L">L (7% Recovery)</option>
                <option value="M">M (15% Recovery)</option>
                <option value="Q">Q (25% Recovery)</option>
                <option value="H">H (30% Recovery)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Quiet Zone</label>
              <select
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
              >
                <option value="1">1 Block</option>
                <option value="2">2 Blocks (Standard)</option>
                <option value="4">4 Blocks (High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Canvas & Export Column */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 flex flex-col items-center justify-between gap-6">
          <div className="space-y-1 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Render Output</span>
            <p className="text-xs text-slate-500">Scan directly or export in high resolution</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={downloadPng}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Image (PNG)</span>
            </button>

            <button
              onClick={copyImage}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
