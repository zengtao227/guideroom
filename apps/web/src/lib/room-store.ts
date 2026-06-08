import { v4 as uuidv4 } from 'uuid';

export type RoomStatus = 'active' | 'ended' | 'expired';

export type Room = {
  id: string;
  title: string;
  guideName?: string;
  createdAt: string;
  expiresAt: string;
  status: RoomStatus;
  livekitRoomName: string;
};

export type CreateRoomInput = {
  title: string;
  guideName?: string;
  durationHours: number;
};

const rooms = new Map<string, Room>();

export function createRoom(input: CreateRoomInput): Room {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.durationHours * 60 * 60 * 1000);

  const room: Room = {
    id,
    title: input.title,
    guideName: input.guideName || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    livekitRoomName: id,
  };

  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function endRoom(id: string): void {
  const room = rooms.get(id);
  if (room) {
    rooms.set(id, { ...room, status: 'ended' });
  }
}
