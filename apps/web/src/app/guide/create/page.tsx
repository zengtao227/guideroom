'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createRoomAction, type CreateRoomState } from './actions';
import { useTranslation } from '@/contexts/LanguageContext';

const initialState: CreateRoomState = {};

export default function CreateRoomPage() {
  const [state, action, isPending] = useActionState(createRoomAction, initialState);
  const { t } = useTranslation();
  const { createRoom: c } = t;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-medium text-slate-500">
          {c.back}
        </Link>
        <h1 className="mt-6 text-3xl font-bold">{c.heading}</h1>
        <p className="mt-3 text-slate-600">{c.subheading}</p>

        <form action={action} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{c.durationLabel}</span>
            <select
              name="duration"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              defaultValue="1h"
            >
              <option value="1h">{c.duration1h}</option>
              <option value="4h">{c.duration4h}</option>
            </select>
          </label>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{c.titleLabel}</span>
            <input
              name="title"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder={c.titlePlaceholder}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{c.guideNameLabel}</span>
            <input
              name="guideName"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder={c.guideNamePlaceholder}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? c.creating : c.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
