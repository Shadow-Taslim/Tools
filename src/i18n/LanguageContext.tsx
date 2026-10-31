import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, LanguageMeta, SUPPORTED_LANGUAGES } from './types.ts';
import { translations } from './translations.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  languages: LanguageMeta[];
  currentLanguageMeta: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'quicknest_preferred_language';

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'en';
  }

  const stored = localStorage.getItem(STORAGE_KEY) as Language;
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
    return stored;
  }

  const browserLang = (navigator.language || (navigator as any).userLanguage || 'en').toLowerCase();
  
  // Exact or prefix match
  for (const lang of SUPPORTED_LANGUAGES) {
    if (browserLang === lang.code || browserLang.startsWith(`${lang.code}-`)) {
      return lang.code;
    }
  }

  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectBrowserLanguage());

  const currentLanguageMeta = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const dir = currentLanguageMeta.dir;

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore quota or disabled local storage
    }
  };

  useEffect(() => {
    // Update HTML root lang and dir attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageMeta,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
