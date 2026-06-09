'use client';

import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { GuideAudio } from './GuideAudio';

type GuideRoomShellProps = {
  roomId: string;
  roomTitle: string;
  guideName?: string;
  durationHours: number;
  expiresAt: string;
  status: 'active' | 'ended' | 'expired';
  qrDataUrl: string;
  listenerUrl: string;
  wsUrl: string;
};

export function GuideRoomShell({
  roomId,
  roomTitle,
  guideName,
  durationHours,
  expiresAt,
  status,
  qrDataUrl,
  listenerUrl,
  wsUrl,
}: GuideRoomShellProps) {
  const { t } = useTranslation();
  const { guideRoom: g } = t;
  const isActive = status === 'active';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <Link href="/guide/create" className="text-sm font-medium text-slate-500">
            {g.createAnother}
          </Link>
          <h1 className="mt-6 text-3xl font-bold">{roomTitle}</h1>
          {guideName && (
            <p className="mt-1 text-slate-500">
              {g.guide} {guideName}
            </p>
          )}
          <p className="mt-1 text-sm text-slate-400">
            {g.roomId} {roomId}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">{g.status}</p>
              <p className="mt-2 font-semibold">
                {status === 'active' ? g.statusActive : status === 'ended' ? g.statusEnded : g.statusExpired}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">{g.sessionTime}</p>
              <p className="mt-2 font-semibold">{durationHours}h</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">{g.expiresAt}</p>
              <p className="mt-2 text-sm font-semibold">{new Date(expiresAt).toLocaleString()}</p>
            </div>
          </div>

          {isActive ? (
            <GuideAudio roomId={roomId} wsUrl={wsUrl} />
          ) : (
            <div className="mt-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="font-semibold">
                {status === 'ended' ? g.roomEnded : g.roomExpired}
              </p>
            </div>
          )}
        </div>

        <aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          {isActive ? (
            <>
              <img
                src={qrDataUrl}
                alt="QR code for listener link"
                className="mx-auto h-56 w-56 rounded-2xl"
              />
              <p className="mt-5 text-sm text-slate-600">{g.listenerLink}</p>
              <a
                href={listenerUrl}
                className="mt-2 block break-all text-sm font-semibold text-slate-950"
              >
                {listenerUrl}
              </a>
            </>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-100 p-6 text-sm text-slate-500">
              {status === 'ended' ? g.roomEnded : g.roomExpired}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
