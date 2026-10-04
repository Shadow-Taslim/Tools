import { useState, useMemo } from 'react';
import { 
  FileText, Copy, Trash2, Clock, 
  BarChart, Sparkles, Check, AlignLeft 
} from 'lucide-react';

interface WordCounterViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function WordCounterView({ onShowToast }: WordCounterViewProps) {
  const [text, setText] = useState<string>(
    'QuickNest provides zero-knowledge online utilities built with real-time 3D spatial computing. Generate disposable 10-minute temporary email inboxes, inspect shortened destination URLs, generate high-density QR codes, and create high-entropy passwords with zero account requirements.'
  );
  const [copied, setCopied] = useState(false);

  // Compute text statistics
  const stats = useMemo(() => {
    const raw = text.trim();
    if (!raw) {
      return {
        words: 0,
        charsWithSpaces: 0,
        charsNoSpaces: 0,
        letters: 0,
        digits: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0
      };
    }

    const words = raw.split(/\s+/).filter(Boolean).length;
    const codePoints = Array.from(text);
    const charsWithSpaces = codePoints.length; // Counts spaces, punctuation, symbols, and emoji (1 code point each)
    const charsNoSpaces = codePoints.filter(c => !/\s/.test(c)).length;
    const letters = (text.match(/\p{L}/gu) || []).length;
    const digits = (text.match(/\d/g) || []).length;
    const sentences = raw.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = raw.split(/\n+/).filter(p => p.trim().length > 0).length;
    const readingTimeMinutes = Math.max(0.1, +(words / 200).toFixed(1));
    const speakingTimeMinutes = Math.max(0.1, +(words / 130).toFixed(1));

    return {
      words,
      charsWithSpaces,
      charsNoSpaces,
      letters,
      digits,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes
    };
  }, [text]);

  // Compute top keywords
  const topKeywords = useMemo(() => {
    if (!text.trim()) return [];
    const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'for', 'with', 'on', 'that', 'by', 'this', 'an', 'are', 'it', 'or', 'as', 'from', 'at']);
    const wordList = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    const freqMap = new Map<string, number>();
    for (const w of wordList) {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }

    return Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [text]);

  const cleanWhitespace = () => {
    const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
    setText(cleaned);
    onShowToast('Normalized whitespace and blank lines', 'success');
  };

  const stripHtml = () => {
    const stripped = text.replace(/<[^>]*>?/gm, '');
    setText(stripped);
    onShowToast('Stripped all HTML tags', 'success');
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Text copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Real-Time Word & Telemetry Counter
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Analyze textual metrics, character density, speaking cadences, and keyword frequencies in real-time.
        </p>
      </div>

      {/* Metrics Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Words</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {stats.words}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Characters</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">
            {stats.charsWithSpaces}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">No Spaces</span>
          <span className="text-2xl font-bold font-mono text-slate-300 tabular-nums">
            {stats.charsNoSpaces}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Sentences</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">
            {stats.sentences}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Paragraphs</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">
            {stats.paragraphs}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Reading Time</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {stats.readingTimeMinutes}m
          </span>
        </div>
      </div>

      {/* Rules and Counting Specification */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span><strong>Letters:</strong> {stats.letters}</span>
          <span>&bull;</span>
          <span><strong>Digits:</strong> {stats.digits}</span>
          <span>&bull;</span>
          <span><strong>Emoji & Symbols:</strong> Counted as individual Unicode code points</span>
        </div>
        <div className="text-slate-500">
          Spaces, punctuation, and emoji count as characters &bull; Updates live on type/paste/delete
        </div>
      </div>

      {/* Editor & Actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <AlignLeft className="w-4 h-4 text-cyan-400" />
            <span>Live Analysis Buffer</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cleanWhitespace}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
            >
              Normalize Space
            </button>
            <button
              onClick={stripHtml}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
            >
              Strip HTML
            </button>
            <button
              onClick={() => setText('')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={copyText}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type content here for instantaneous textual statistics..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:border-cyan-400 resize-y"
        />

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Speaking estimate (130 WPM): ~{stats.speakingTimeMinutes} min</span>
          <span>Zero external telemetry logged</span>
        </div>
      </div>

      {/* Keyword Density Breakdown */}
      {topKeywords.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-cyan-400" />
            <span>Keyword Frequency Distribution</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topKeywords.map(([kw, count]) => {
              const pct = stats.words > 0 ? ((count / stats.words) * 100).toFixed(1) : '0';
              return (
                <div key={kw} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate">{kw}</span>
                    <span className="font-mono text-cyan-400 tabular-nums">{count}x</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{pct}% density</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
