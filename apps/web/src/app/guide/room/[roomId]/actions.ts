'use server';

import { endRoom } from '@/lib/room-store';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function endRoomAction(roomId: string): Promise<void> {
  endRoom(roomId);

  const wsUrl = process.env.LIVEKIT_URL ?? '';
  const httpUrl = wsUrl.replace(/^wss?:\/\//, 'https://');

  const svc = new RoomServiceClient(
    httpUrl,
    process.env.LIVEKIT_API_KEY ?? '',
    process.env.LIVEKIT_API_SECRET ?? '',
  );

  try {
    await svc.deleteRoom(roomId);
  } catch {
    // Room may not exist on LiveKit if no participant ever connected
  }
}
