import { notFound } from 'next/navigation';
import { getRoomByListenerToken } from '@/lib/room-store';
import { ListenerRoom } from './ListenerRoom';

type ListenPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function ListenPage({ params }: ListenPageProps) {
  const { roomId: listenerToken } = await params;
  const room = getRoomByListenerToken(listenerToken);

  if (!room) {
    notFound();
  }

  const wsUrl = process.env.LIVEKIT_URL ?? '';

  return (
    <ListenerRoom
      listenerToken={listenerToken}
      wsUrl={wsUrl}
      roomTitle={room.title}
      guideName={room.guideName}
      status={room.status}
      expiresAt={room.expiresAt}
    />
  );
}
