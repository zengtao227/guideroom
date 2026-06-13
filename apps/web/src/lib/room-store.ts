import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
  listenerToken: string;
  guideToken: string;
};

export type CreateRoomInput = {
  title: string;
  guideName?: string;
  durationHours: number;
};

declare global {
  var __guideroomRooms: Map<string, Room> | undefined;
  var __guideroomRoomsMtimeMs: number | undefined;
}

type RoomsFile = {
  rooms: Room[];
};

const DEFAULT_ROOM_STORE_PATH: string = join(tmpdir(), 'guideroom', 'rooms.json');
const MAX_TITLE_LENGTH = 120;
const MAX_GUIDE_NAME_LENGTH = 80;
const VALID_DURATIONS = new Set([1, 4]);
const MAX_TOKEN_LENGTH = 128;
const MIN_TOKEN_LENGTH = 16;

function getRoomStorePath(): string {
  const configuredPath: string | undefined = process.env.GUIDEROOM_ROOM_STORE_PATH?.trim();
  return configuredPath || DEFAULT_ROOM_STORE_PATH;
}

function boundedString(value: string | undefined, maxLength: number, fallback?: string): string | undefined {
  const trimmed = value?.trim().slice(0, maxLength);
  return trimmed || fallback;
}

function createCapabilityToken(): string {
  return uuidv4();
}

function isCapabilityToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= MIN_TOKEN_LENGTH && value.length <= MAX_TOKEN_LENGTH;
}

function isRoomStatus(value: unknown): value is RoomStatus {
  return value === 'active' || value === 'ended' || value === 'expired';
}

function coerceRoom(value: unknown): Room | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate: Record<string, unknown> = value as Record<string, unknown>;

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.title !== 'string' ||
    (candidate.guideName !== undefined && typeof candidate.guideName !== 'string') ||
    typeof candidate.durationHours !== 'number' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.expiresAt !== 'string' ||
    !isRoomStatus(candidate.status) ||
    typeof candidate.livekitRoomName !== 'string'
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    guideName: typeof candidate.guideName === 'string' ? candidate.guideName : undefined,
    durationHours: candidate.durationHours,
    createdAt: candidate.createdAt,
    expiresAt: candidate.expiresAt,
    status: candidate.status,
    livekitRoomName: candidate.livekitRoomName,
    listenerToken: isCapabilityToken(candidate.listenerToken) ? candidate.listenerToken : createCapabilityToken(),
    guideToken: isCapabilityToken(candidate.guideToken) ? candidate.guideToken : createCapabilityToken(),
  };
}

function getFileMtimeMs(filePath: string): number {
  if (!existsSync(filePath)) {
    return 0;
  }

  return statSync(filePath).mtimeMs;
}

function readRoomsFromDisk(filePath: string): Map<string, Room> {
  if (!existsSync(filePath)) {
    return new Map<string, Room>();
  }

  const raw: string = readFileSync(filePath, 'utf8');
  const parsed: unknown = JSON.parse(raw) as unknown;
  const file: RoomsFile | undefined =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as RoomsFile).rooms)
      ? (parsed as RoomsFile)
      : undefined;

  if (!file) {
    return new Map<string, Room>();
  }

  const rooms: Map<string, Room> = new Map<string, Room>();

  for (const roomValue of file.rooms) {
    const room = coerceRoom(roomValue);
    if (room) {
      rooms.set(room.id, room);
    }
  }

  return rooms;
}

function writeRoomsToDisk(rooms: Map<string, Room>): void {
  const filePath: string = getRoomStorePath();
  const directoryPath: string = dirname(filePath);
  const temporaryPath: string = `${filePath}.${process.pid}.tmp`;
  const file: RoomsFile = { rooms: Array.from(rooms.values()) };

  mkdirSync(directoryPath, { recursive: true });
  writeFileSync(temporaryPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, filePath);
  globalThis.__guideroomRoomsMtimeMs = getFileMtimeMs(filePath);
}

function getRooms(): Map<string, Room> {
  const filePath: string = getRoomStorePath();
  const fileMtimeMs: number = getFileMtimeMs(filePath);

  if (!globalThis.__guideroomRooms || globalThis.__guideroomRoomsMtimeMs !== fileMtimeMs) {
    globalThis.__guideroomRooms = readRoomsFromDisk(filePath);
    globalThis.__guideroomRoomsMtimeMs = fileMtimeMs;
  }

  return globalThis.__guideroomRooms;
}

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
  const durationHours = VALID_DURATIONS.has(input.durationHours) ? input.durationHours : 1;
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  const room: Room = {
    id,
    title: boundedString(input.title, MAX_TITLE_LENGTH, 'GuideRoom session') ?? 'GuideRoom session',
    guideName: boundedString(input.guideName, MAX_GUIDE_NAME_LENGTH),
    durationHours,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    livekitRoomName: id,
    listenerToken: createCapabilityToken(),
    guideToken: createCapabilityToken(),
  };

  const rooms: Map<string, Room> = getRooms();
  rooms.set(id, room);
  writeRoomsToDisk(rooms);

  return room;
}

export function getRoom(id: string): Room | undefined {
  const rooms = getRooms();
  const room = rooms.get(id);

  if (!room) {
    return undefined;
  }

  const status = getCurrentStatus(room);

  if (status !== room.status) {
    const updatedRoom = { ...room, status };
    rooms.set(id, updatedRoom);
    writeRoomsToDisk(rooms);
    return updatedRoom;
  }

  return room;
}

export function getRoomByListenerToken(listenerToken: string): Room | undefined {
  if (!isCapabilityToken(listenerToken)) {
    return undefined;
  }

  const rooms = getRooms();

  for (const room of rooms.values()) {
    if (room.listenerToken === listenerToken) {
      return getRoom(room.id);
    }
  }

  return undefined;
}

export function getRoomForGuide(roomId: string, guideToken: string): Room | undefined {
  if (!isCapabilityToken(guideToken)) {
    return undefined;
  }

  const room = getRoom(roomId);

  if (!room || room.guideToken !== guideToken) {
    return undefined;
  }

  return room;
}

export function endRoom(id: string): void {
  const rooms = getRooms();
  const room = rooms.get(id);

  if (room) {
    rooms.set(id, { ...room, status: 'ended' });
    writeRoomsToDisk(rooms);
  }
}

export function getRemainingRoomSeconds(id: string): number | undefined {
  const room = getRoom(id);

  if (!room || room.status !== 'active') {
    return undefined;
  }

  return Math.max(0, Math.floor((new Date(room.expiresAt).getTime() - Date.now()) / 1000));
}
