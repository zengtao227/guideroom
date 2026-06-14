import { v4 as uuidv4 } from 'uuid';

export type RelayRoomStatus = 'active' | 'ended' | 'expired';

export type RelayRoom = {
  id: string;
  listenerToken: string;
  guideToken: string;
  title: string;
  guideName?: string;
  createdAt: string;
  expiresAt: string;
  status: RelayRoomStatus;
};

const rooms = new Map<string, RelayRoom>();
const MAX_TITLE_LENGTH = 120;
const MAX_GUIDE_NAME_LENGTH = 80;
const VALID_DURATIONS = new Set([1, 4]);
const MIN_TOKEN_LENGTH = 16;
const MAX_TOKEN_LENGTH = 128;

function createCapabilityToken(): string {
  return uuidv4();
}

function isCapabilityToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= MIN_TOKEN_LENGTH && value.length <= MAX_TOKEN_LENGTH;
}

function boundedString(value: string | undefined, maxLength: number, fallback?: string): string | undefined {
  const trimmed = value?.trim().slice(0, maxLength);
  return trimmed || fallback;
}

function normalizeDurationHours(value: number): number {
  return VALID_DURATIONS.has(value) ? value : 1;
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

export function createRelayRoom(title: string, guideName: string | undefined, durationHours: number): RelayRoom {
  const id = uuidv4();
  const normalizedDurationHours = normalizeDurationHours(durationHours);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + normalizedDurationHours * 60 * 60 * 1000);
  const relayRoom: RelayRoom = {
    id,
    listenerToken: createCapabilityToken(),
    guideToken: createCapabilityToken(),
    title: boundedString(title, MAX_TITLE_LENGTH, 'GuideRoom session') ?? 'GuideRoom session',
    guideName: boundedString(guideName, MAX_GUIDE_NAME_LENGTH),
    createdAt: now.toISOString(),
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
