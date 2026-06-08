'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createRoomAction, type CreateRoomState } from './actions';

const initialState: CreateRoomState = {};

export default function CreateRoomPage() {
  const [state, action, isPending] = useActionState(createRoomAction, initialState);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-medium text-slate-500">← Back</Link>
        <h1 className="mt-6 text-3xl font-bold">Create a GuideRoom</h1>
        <p className="mt-3 text-slate-600">
          Fill in the details below, then share the QR code with your visitors.
        </p>

        <form action={action} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Room title</span>
            <input
              name="title"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Basel Old Town Tour"
            />
          </label>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Duration</span>
            <select
              name="duration"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              defaultValue="3h"
            >
              <option value="1h">1 hour</option>
              <option value="3h">3 hours</option>
              <option value="half-day">Half day (4 hours)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Guide name (optional)</span>
            <input
              name="guideName"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Tao"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create room'}
          </button>
        </form>
      </section>
    </main>
  );
}
