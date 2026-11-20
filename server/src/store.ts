import { randomUUID } from 'node:crypto';

export type RelayRoomStatus = 'active' | 'ended' | 'expired';

export type RelayRoom = {
  id: string;
  listenerToken: string;
  guideToken: string;
  title: string;
  guideName?: string;
  expiresAt: string;
  status: RelayRoomStatus;
};

const rooms = new Map<string, RelayRoom>();
const MAX_TITLE_LENGTH = 120;
const MAX_GUIDE_NAME_LENGTH = 80;
const MIN_TOKEN_LENGTH = 16;
const MAX_TOKEN_LENGTH = 128;

function isCapabilityToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= MIN_TOKEN_LENGTH && value.length <= MAX_TOKEN_LENGTH;
}

function boundedString(value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) || undefined : undefined;
}

function getCurrentStatus(room: RelayRoom): RelayRoomStatus {
  if (room.status === 'ended') return 'ended';
  if (Date.now() >= new Date(room.expiresAt).getTime()) return 'expired';
  return room.status;
}

function refreshRelayRoomStatus(room: RelayRoom): RelayRoom {
  const status = getCurrentStatus(room);

  if (status === room.status) {
    return room;
  }

  const updatedRoom = { ...room, status };
  rooms.set(room.id, updatedRoom);
  return updatedRoom;
}

export function createRelayRoom(title: unknown, guideName: unknown, durationHours: unknown): RelayRoom {
  const id = randomUUID();
  const hours = durationHours === 4 ? 4 : 1;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const relayRoom: RelayRoom = {
    id,
    listenerToken: randomUUID(),
    guideToken: randomUUID(),
    title: boundedString(title, MAX_TITLE_LENGTH) ?? 'GuideRoom session',
    guideName: boundedString(guideName, MAX_GUIDE_NAME_LENGTH),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };
  rooms.set(id, relayRoom);
  return relayRoom;
}

export function getRelayRoom(id: string): RelayRoom | undefined {
  const room = rooms.get(id);
  return room ? refreshRelayRoomStatus(room) : undefined;
}

export function getRelayRoomByListenerToken(listenerToken: string): RelayRoom | undefined {
  if (!isCapabilityToken(listenerToken)) {
    return undefined;
  }

  for (const room of rooms.values()) {
    if (room.listenerToken === listenerToken) {
      return getRelayRoom(room.id);
    }
  }

  return undefined;
}

export function getRelayRoomForGuide(roomId: string, guideToken: string): RelayRoom | undefined {
  if (!isCapabilityToken(guideToken)) {
    return undefined;
  }

  const room = getRelayRoom(roomId);

  if (!room || room.guideToken !== guideToken) {
    return undefined;
  }

  return room;
}

export function markRelayRoomEnded(id: string): void {
  const relayRoom = rooms.get(id);
  if (relayRoom) {
    rooms.set(id, { ...relayRoom, status: 'ended' });
  }
}
