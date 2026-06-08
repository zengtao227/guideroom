import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/room-store';
import { generateQrDataUrl } from '@/lib/qr';
import { GuideAudio } from './GuideAudio';

type GuideRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function GuideRoomPage({ params }: GuideRoomPageProps) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const listenerUrl = `${appUrl}/listen/${roomId}`;
  const qrDataUrl = await generateQrDataUrl(listenerUrl);
  const wsUrl = process.env.LIVEKIT_URL ?? '';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <Link href="/guide/create" className="text-sm font-medium text-slate-500">
            ← Create another room
          </Link>
          <h1 className="mt-6 text-3xl font-bold">{room.title}</h1>
          {room.guideName && (
            <p className="mt-1 text-slate-500">Guide: {room.guideName}</p>
          )}
          <p className="mt-1 text-sm text-slate-400">Room ID: {roomId}</p>

          <GuideAudio roomId={roomId} wsUrl={wsUrl} />
        </div>

        <aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <img
            src={qrDataUrl}
            alt="QR code for listener link"
            className="mx-auto h-56 w-56 rounded-2xl"
          />
          <p className="mt-5 text-sm text-slate-600">Listener link</p>
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
