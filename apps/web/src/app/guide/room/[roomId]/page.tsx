import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/room-store';
import { generateQrDataUrl } from '@/lib/qr';
import { GuideRoomShell } from './GuideRoomShell';

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
    <GuideRoomShell
      roomId={roomId}
      roomTitle={room.title}
      guideName={room.guideName}
      qrDataUrl={qrDataUrl}
      listenerUrl={listenerUrl}
      wsUrl={wsUrl}
    />
  );
}
