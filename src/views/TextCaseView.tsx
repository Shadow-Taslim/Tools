import { useState, useMemo } from 'react';
import { Type, Copy, Download, Check, Sparkles } from 'lucide-react';

interface TextCaseViewProps {
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TextCaseView({ onShowToast }: TextCaseViewProps) {
  const [input, setInput] = useState('hyperlink security & disposable temporary email service');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const conversions = useMemo(() => {
    const raw = input.trim();
    if (!raw) return [];

    const words = raw.split(/[\s_-]+/).filter(Boolean);

    // UPPERCASE (preserves punctuation, numbers, accents, and emoji)
    const upper = input.toUpperCase();

    // lowercase (preserves punctuation, numbers, accents, and emoji)
    const lower = input.toLowerCase();

    // Title Case (Unicode-aware, preserves original spacing, blank lines, punctuation, numbers, accents, and emoji)
    const title = input.replace(/\p{L}+/gu, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    // Sentence case (capitalizes sentence starts, preserving whitespace, punctuation, accents, numbers, and emoji)
    const sentence = input.toLowerCase().replace(/(^\s*|\n\s*|[.!?]\s+)(\p{L})/gu, (_match, prefix, char) => {
      return prefix + char.toUpperCase();
    });

    // camelCase
    const camel = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    // PascalCase
    const pascal = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    // snake_case
    const snake = words.map(w => w.toLowerCase()).join('_');

    // kebab-case
    const kebab = words.map(w => w.toLowerCase()).join('-');

    // CONSTANT_CASE
    const constant = words.map(w => w.toUpperCase()).join('_');

    // dot.case
    const dot = words.map(w => w.toLowerCase()).join('.');

    return [
      { id: 'upper', label: 'UPPERCASE', text: upper },
      { id: 'lower', label: 'lowercase', text: lower },
      { id: 'title', label: 'Title Case', text: title },
      { id: 'sentence', label: 'Sentence case', text: sentence },
      { id: 'camel', label: 'camelCase', text: camel },
      { id: 'pascal', label: 'PascalCase', text: pascal },
      { id: 'snake', label: 'snake_case', text: snake },
      { id: 'kebab', label: 'kebab-case', text: kebab },
      { id: 'constant', label: 'CONSTANT_CASE', text: constant },
      { id: 'dot', label: 'dot.case', text: dot }
    ];
  }, [input]);

  const copyResult = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast(`Copied ${key} conversion!`, 'success');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const downloadText = (text: string, label: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quicknest-${label.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Text file exported', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Text Case Converter
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Instant simultaneous transformation across title case, camelCase, snake_case, kebab-case, and programming formats.
        </p>
      </div>

      {/* Input buffer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label htmlFor="source-text-buffer" className="font-semibold text-slate-300">Source Text Buffer</label>
          <span className="font-mono">{input.length} characters</span>
        </div>
        <textarea
          id="source-text-buffer"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to convert..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Conversion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {conversions.map((conv) => {
          const isCopied = copiedKey === conv.id;
          return (
            <div
              key={conv.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3 group hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-400">{conv.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyResult(conv.id, conv.text)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copy result"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => downloadText(conv.text, conv.label)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Download as .txt"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 font-mono text-xs sm:text-sm text-slate-200 break-all select-all">
                  {conv.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
