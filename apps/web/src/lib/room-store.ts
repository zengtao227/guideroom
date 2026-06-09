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

function getRoomStorePath(): string {
  const configuredPath: string | undefined = process.env.GUIDEROOM_ROOM_STORE_PATH?.trim();
  return configuredPath || DEFAULT_ROOM_STORE_PATH;
}

function isRoomStatus(value: unknown): value is RoomStatus {
  return value === 'active' || value === 'ended' || value === 'expired';
}

function isRoom(value: unknown): value is Room {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate: Record<string, unknown> = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    (candidate.guideName === undefined || typeof candidate.guideName === 'string') &&
    typeof candidate.durationHours === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.expiresAt === 'string' &&
    isRoomStatus(candidate.status) &&
    typeof candidate.livekitRoomName === 'string'
  );
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

  for (const room of file.rooms) {
    if (isRoom(room)) {
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
