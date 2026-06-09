import { v4 as uuidv4 } from 'uuid';

export type RoomStatus = 'active' | 'ended' | 'expired';

export type Room = {
  id: string;
  title: string;
  guideName?: string;
  durationHours: number;
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

function getCurrentStatus(room: Room): RoomStatus {
  if (room.status === 'ended') {
    return 'ended';
  }

  if (Date.now() >= new Date(room.expiresAt).getTime()) {
    return 'expired';
  }

  return room.status;
}

export function createRoom(input: CreateRoomInput): Room {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.durationHours * 60 * 60 * 1000);

  const room: Room = {
    id,
    title: input.title,
    guideName: input.guideName || undefined,
    durationHours: input.durationHours,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    livekitRoomName: id,
  };

  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  const room = rooms.get(id);

  if (!room) {
    return undefined;
  }

  const status = getCurrentStatus(room);

  if (status !== room.status) {
    const updatedRoom = { ...room, status };
    rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  return room;
}

export function endRoom(id: string): void {
  const room = rooms.get(id);
  if (room) {
    rooms.set(id, { ...room, status: 'ended' });
  }
}

export function getRemainingRoomSeconds(id: string): number | undefined {
  const room = getRoom(id);

  if (!room || room.status !== 'active') {
    return undefined;
  }

  return Math.max(0, Math.floor((new Date(room.expiresAt).getTime() - Date.now()) / 1000));
}
