'use client';

import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

export default function HomePage() {
  const { t } = useTranslation();
  const { home: h } = t;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {h.tagline}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{h.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{h.description}</p>
          <div className="mt-8">
            <Link
              href="/guide/create"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {h.cta}
            </Link>
          </div>
        </div>

        <div id="how-it-works" className="grid gap-4 sm:grid-cols-3">
          {h.steps.map((step, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
