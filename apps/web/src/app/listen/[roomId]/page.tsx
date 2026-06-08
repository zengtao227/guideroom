import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/room-store';
import { ListenerRoom } from './ListenerRoom';

type ListenPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function ListenPage({ params }: ListenPageProps) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room || room.status !== 'active') {
    notFound();
  }

  const wsUrl = process.env.LIVEKIT_URL ?? '';

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-3xl bg-white/10 p-8 shadow-sm ring-1 ring-white/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          GuideRoom listener
        </p>
        <h1 className="mt-5 text-3xl font-bold">{room.title}</h1>
        {room.guideName && (
          <p className="mt-1 text-slate-300">Guide: {room.guideName}</p>
        )}

        <ListenerRoom roomId={roomId} wsUrl={wsUrl} />
      </section>
    </main>
  );
}
