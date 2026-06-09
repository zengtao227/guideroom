'use server';

import { endRoom } from '@/lib/room-store';

export async function endRoomAction(roomId: string): Promise<void> {
  endRoom(roomId);
}
