'use client';

import { LOCALES } from '@/lib/translations';
import { useTranslation } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex gap-1">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            locale === code
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
