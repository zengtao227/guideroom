import { notFound } from 'next/navigation';
import { getRoomForGuide } from '@/lib/room-store';
import { generateQrDataUrl } from '@/lib/qr';
import { GuideRoomShell } from './GuideRoomShell';

type GuideRoomPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ guideToken?: string | string[] }>;
};

function readSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuideRoomPage({ params, searchParams }: GuideRoomPageProps) {
  const { roomId } = await params;
  const { guideToken: rawGuideToken } = await searchParams;
  const guideToken = readSingleParam(rawGuideToken);

  if (!guideToken) {
    notFound();
  }

  const room = getRoomForGuide(roomId, guideToken);

  if (!room) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const listenerUrl = `${appUrl}/listen/${encodeURIComponent(room.listenerToken)}`;
  const qrDataUrl = await generateQrDataUrl(listenerUrl);
  const wsUrl = process.env.LIVEKIT_URL ?? '';

  return (
    <GuideRoomShell
      roomId={roomId}
      guideToken={guideToken}
      roomTitle={room.title}
      guideName={room.guideName}
      durationHours={room.durationHours}
      expiresAt={room.expiresAt}
      status={room.status}
      qrDataUrl={qrDataUrl}
      listenerUrl={listenerUrl}
      wsUrl={wsUrl}
    />
  );
}
