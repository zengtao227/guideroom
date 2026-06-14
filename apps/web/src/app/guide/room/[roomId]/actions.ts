'use server';

import { endRoom, getRoomForGuide } from '@/lib/room-store';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function endRoomAction(roomId: string, guideToken: string): Promise<void> {
  const room = getRoomForGuide(roomId, guideToken);

  if (!room) {
    throw new Error('Access denied');
  }

  endRoom(room.id);

  const wsUrl = process.env.LIVEKIT_URL ?? '';
  const httpUrl = wsUrl.replace(/^ws/, 'http');

  const svc = new RoomServiceClient(
    httpUrl,
    process.env.LIVEKIT_API_KEY ?? '',
    process.env.LIVEKIT_API_SECRET ?? '',
  );

  try {
    await svc.deleteRoom(room.livekitRoomName);
  } catch {
    // Room may not exist on LiveKit if no participant ever connected
  }
}
