import { useState, useEffect, useCallback } from 'react';
import { 
  KeyRound, Copy, Check, RefreshCw, Shield, 
  Sparkles, Layers, Sliders 
} from 'lucide-react';

interface PasswordGeneratorViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const DICEWARE_WORDS = [
  'alpha', 'beacon', 'cobalt', 'delta', 'echo', 'falcon', 'galaxy', 'horizon',
  'iris', 'jupiter', 'kestrel', 'lunar', 'matrix', 'nebula', 'orbit', 'pulsar',
  'quantum', 'radar', 'stellar', 'titan', 'uranium', 'vector', 'warp', 'xenon',
  'zenith', 'arcade', 'breeze', 'canyon', 'drizzle', 'ember', 'forest', 'glacier',
  'harbor', 'island', 'jungle', 'kinetic', 'lagoon', 'meadow', 'oasis', 'prairie'
];

export default function PasswordGeneratorView({ onShowToast }: PasswordGeneratorViewProps) {
  const [mode, setMode] = useState<'random' | 'passphrase'>('random');
  const [length, setLength] = useState<number>(24);
  const [passphraseWords, setPassphraseWords] = useState<number>(4);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [excludeChars, setExcludeChars] = useState('');
  const [batchCount, setBatchCount] = useState<number>(20);
  
  const [password, setPassword] = useState('');
  const [batchList, setBatchList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [entropy, setEntropy] = useState<number>(0);
  const [crackTime, setCrackTime] = useState<string>('');

  const generateSingle = useCallback(() => {
    if (mode === 'passphrase') {
      const selected: string[] = [];
      const cryptoArray = new Uint32Array(passphraseWords);
      window.crypto.getRandomValues(cryptoArray);
      for (let i = 0; i < passphraseWords; i++) {
        const word = DICEWARE_WORDS[cryptoArray[i] % DICEWARE_WORDS.length];
        selected.push(word);
      }
      const pass = selected.join('-');
      const bits = Math.floor(passphraseWords * Math.log2(DICEWARE_WORDS.length));
      return { pass, bits };
    }

    // Build character sets with exclusions applied
    const filterChars = (str: string) => {
      let filtered = str;
      if (avoidAmbiguous) {
        filtered = filtered.replace(/[1lI0O]/g, '');
      }
      if (excludeChars) {
        const toExclude = new Set(excludeChars.split(''));
        filtered = filtered.split('').filter(c => !toExclude.has(c)).join('');
      }
      return filtered;
    };

    const lowerSet = filterChars('abcdefghijklmnopqrstuvwxyz');
    const upperSet = filterChars('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    const numSet = filterChars('0123456789');
    const symSet = filterChars('!@#$%^&*()_+-=[]{}|;:,.<>?');

    const requiredSets: string[] = [];
    let combinedPool = '';

    if (useLower && lowerSet.length > 0) {
      requiredSets.push(lowerSet);
      combinedPool += lowerSet;
    }
    if (useUpper && upperSet.length > 0) {
      requiredSets.push(upperSet);
      combinedPool += upperSet;
    }
    if (useNumbers && numSet.length > 0) {
      requiredSets.push(numSet);
      combinedPool += numSet;
    }
    if (useSymbols && symSet.length > 0) {
      requiredSets.push(symSet);
      combinedPool += symSet;
    }

    if (!combinedPool) {
      combinedPool = 'abcdefghijklmnopqrstuvwxyz';
    }

    const effectiveLength = Math.max(4, Math.min(128, length));
    const chars: string[] = [];

    // Guarantee at least 1 character from each selected category
    for (const set of requiredSets) {
      if (chars.length < effectiveLength) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        chars.push(set[buf[0] % set.length]);
      }
    }

    // Fill remaining length from combined pool
    const remaining = effectiveLength - chars.length;
    if (remaining > 0) {
      const randomBuf = new Uint32Array(remaining);
      window.crypto.getRandomValues(randomBuf);
      for (let i = 0; i < remaining; i++) {
        chars.push(combinedPool[randomBuf[i] % combinedPool.length]);
      }
    }

    // Cryptographic Fisher-Yates shuffle
    const shuffleBuf = new Uint32Array(chars.length);
    window.crypto.getRandomValues(shuffleBuf);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = shuffleBuf[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const pass = chars.join('');
    const bits = Math.floor(effectiveLength * Math.log2(combinedPool.length || 2));
    return { pass, bits };
  }, [mode, length, passphraseWords, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous, excludeChars]);

  const regenerate = useCallback(() => {
    const single = generateSingle();
    setPassword(single.pass);
    setEntropy(single.bits);

    // Compute crack time approximation
    if (single.bits < 35) setCrackTime('A few seconds');
    else if (single.bits < 55) setCrackTime('Several days');
    else if (single.bits < 75) setCrackTime('3,000+ years');
    else setCrackTime('Millions of centuries');

    // Generate batch with zero duplicates
    const batchSet = new Set<string>();
    let attempts = 0;
    while (batchSet.size < batchCount && attempts < batchCount * 10) {
      attempts++;
      const p = generateSingle().pass;
      if (p !== single.pass) {
        batchSet.add(p);
      }
    }
    setBatchList(Array.from(batchSet));
  }, [generateSingle, batchCount]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    onShowToast('Cryptographic password copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Cryptographic Password Suite
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Client-side Web Cryptography API generation. Zero transmissions, maximum computational entropy, and resistance to brute-force dictionary attacks.
        </p>
      </div>

      {/* Main Password Output Hero */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Active Generated Key</span>
          <span className="font-mono text-cyan-400 tabular-nums">{entropy} bits entropy</span>
        </div>

        <div className="relative flex items-center bg-slate-950 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-inner">
          <KeyRound className="w-6 h-6 text-cyan-400 shrink-0 mr-4" />
          <div className="font-mono text-base sm:text-xl text-white font-bold tracking-wider select-all break-all w-full">
            {password}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => copyPassword(password)}
              className="p-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              title="Copy password"
            >
              {copied ? <Check className="w-5 h-5 text-slate-950" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={regenerate}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Regenerate new key"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Entropy Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Security Strength:</span>
            <span className={`font-semibold ${
              entropy > 80 ? 'text-emerald-400' : entropy > 50 ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {entropy > 80 ? 'Exceptional (Quantum Resistant)' : entropy > 50 ? 'Strong (NIST Compliant)' : 'Moderate'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                entropy > 80 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Estimated brute-force defense: {crackTime}</span>
            <span>WebCrypto CSPRNG</span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="pt-6 border-t border-slate-800 space-y-6">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setMode('random')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'random' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Random Characters
            </button>
            <button
              onClick={() => setMode('passphrase')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'passphrase' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Memorable Passphrase
            </button>
          </div>

          {mode === 'random' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Length</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">{length} characters</span>
                    <input
                      type="number"
                      min="4"
                      max="128"
                      value={length}
                      onChange={(e) => setLength(Math.max(4, Math.min(128, Number(e.target.value) || 4)))}
                      className="w-14 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-center text-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={Math.min(64, length)}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-slate-200">Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-slate-200">Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-slate-200">Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-slate-200">Symbols (!@#$)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoidAmbiguous}
                      onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>Exclude lookalikes (1, l, I, 0, O)</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Exclude Specific Characters
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. {}[]<>~`"
                    value={excludeChars}
                    onChange={(e) => setExcludeChars(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Word Count</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">{passphraseWords} words</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={passphraseWords}
                  onChange={(e) => setPassphraseWords(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Generator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Alternative Password Pool ({batchList.length})</span>
            </h3>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              {[5, 10, 20, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setBatchCount(count)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    batchCount === count ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(batchList.join('\n'));
                onShowToast(`Copied all ${batchList.length} passwords to clipboard!`, 'success');
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy All</span>
            </button>
            <button
              onClick={regenerate}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer px-2 py-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Batch</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {batchList.map((pwd, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 gap-3"
            >
              <span className="font-mono text-xs sm:text-sm text-slate-200 truncate select-all">
                {pwd}
              </span>
              <button
                onClick={() => copyPassword(pwd)}
                className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Copy password"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
