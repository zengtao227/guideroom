import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/room-store';
import { ListenerRoom } from './ListenerRoom';

type ListenPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function ListenPage({ params }: ListenPageProps) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room) {
    notFound();
  }

  const wsUrl = process.env.LIVEKIT_URL ?? '';

  return (
    <ListenerRoom
      roomId={roomId}
      wsUrl={wsUrl}
      roomTitle={room.title}
      guideName={room.guideName}
      status={room.status}
      expiresAt={room.expiresAt}
    />
  );
}
