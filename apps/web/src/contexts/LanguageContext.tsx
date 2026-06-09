'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, type Translations, translations } from '@/lib/translations';

type LanguageContextValue = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  t: translations.en,
  setLocale: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('guideroom-locale') as Locale | null;
    if (stored && stored in translations) {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem('guideroom-locale', next);
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}
