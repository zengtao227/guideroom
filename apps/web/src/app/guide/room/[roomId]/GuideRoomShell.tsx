'use client';

import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { GuideAudio } from './GuideAudio';

type GuideRoomShellProps = {
  roomId: string;
  roomTitle: string;
  guideName?: string;
  qrDataUrl: string;
  listenerUrl: string;
  wsUrl: string;
};

export function GuideRoomShell({
  roomId,
  roomTitle,
  guideName,
  qrDataUrl,
  listenerUrl,
  wsUrl,
}: GuideRoomShellProps) {
  const { t } = useTranslation();
  const { guideRoom: g } = t;

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

          <GuideAudio roomId={roomId} wsUrl={wsUrl} />
        </div>

        <aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
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
        </aside>
      </section>
    </main>
  );
}
