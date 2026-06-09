import { v4 as uuidv4 } from 'uuid';

export type RelayRoomStatus = 'active' | 'ended';

export type RelayRoom = {
  id: string;
  title: string;
  guideName?: string;
  createdAt: string;
  expiresAt: string;
  status: RelayRoomStatus;
};

const rooms = new Map<string, RelayRoom>();

export function createRelayRoom(title: string, guideName: string | undefined, durationHours: number): RelayRoom {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  const relayRoom: RelayRoom = {
    id,
    title: title || 'GuideRoom session',
    guideName: guideName || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };
  rooms.set(id, relayRoom);
  return relayRoom;
}

export function getRelayRoom(id: string): RelayRoom | undefined {
  return rooms.get(id);
}

export function markRelayRoomEnded(id: string): void {
  const relayRoom = rooms.get(id);
  if (relayRoom) {
    rooms.set(id, { ...relayRoom, status: 'ended' });
  }
}
