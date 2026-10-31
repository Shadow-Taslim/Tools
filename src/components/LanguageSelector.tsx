import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Language } from '../i18n/types.ts';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'footer' | 'mobile';
  className?: string;
}

export default function LanguageSelector({ variant = 'navbar', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentLanguageMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className={`space-y-1.5 pt-2 border-t border-slate-800 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Language / ভাষা / Idioma</span>
        </div>
        <div className="grid grid-cols-2 gap-1 px-1">
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="truncate">{lang.nativeName}</span>
                {isSelected && <Check className="w-3 h-3 ml-auto text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-medium select-none ${
          variant === 'footer'
            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-slate-700'
        } ${isOpen ? 'ring-1 ring-cyan-400 border-cyan-400' : ''}`}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-sm leading-none">{currentLanguageMeta.flag}</span>
        <span className="hidden sm:inline-block font-sans font-medium">{currentLanguageMeta.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl py-1 focus:outline-none animate-in fade-in slide-in-from-top-1 ${
            variant === 'footer' ? 'bottom-full mb-2 right-0' : 'right-0'
          }`}
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-cyan-400 font-sans">{currentLanguageMeta.flag}</span>
          </div>
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight font-medium">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
