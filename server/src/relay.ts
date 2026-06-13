import express, { Request, Response } from 'express';
import http from 'http';
import QRCode from 'qrcode';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import {
  createRelayRoom,
  getRelayRoom,
  getRelayRoomByListenerToken,
  getRelayRoomForGuide,
  markRelayRoomEnded,
} from './store';

const HTTP_PORT = Number(process.env.RELAY_HTTP_PORT ?? 3002);
const WS_PORT = Number(process.env.RELAY_WS_PORT ?? 3003);
const MAX_LISTENERS_PER_ROOM = Number(process.env.RELAY_MAX_LISTENERS_PER_ROOM ?? 100);
const MAX_AUDIO_CHUNK_BYTES = Number(process.env.RELAY_MAX_AUDIO_CHUNK_BYTES ?? 256 * 1024);
const ROOM_SWEEP_MS = 60 * 1000;

const app = express();
app.use(express.json({ limit: '16kb' }));

app.post('/relay-api/rooms', (req: Request, res: Response) => {
  const { title, guideName, durationHours } = req.body as {
    title?: string;
    guideName?: string;
    durationHours?: number;
  };
  const room = createRelayRoom(title ?? '', guideName, durationHours ?? 1);
  res.json({
    roomId: room.id,
    listenerToken: room.listenerToken,
    guideToken: room.guideToken,
    expiresAt: room.expiresAt,
    title: room.title,
    guideName: room.guideName,
  });
});

app.get('/relay-api/rooms/:listenerToken', (req: Request, res: Response) => {
  const room = getRelayRoomByListenerToken(String(req.params.listenerToken));
  if (!room) {
    res.status(404).json({ error: 'room not found' });
    return;
  }
  res.json({ roomId: room.id, title: room.title, guideName: room.guideName, expiresAt: room.expiresAt, status: room.status });
});

app.get('/relay-api/rooms/:listenerToken/qrcode', (req: Request, res: Response) => {
  const room = getRelayRoomByListenerToken(String(req.params.listenerToken));
  if (!room) {
    res.status(404).json({ error: 'room not found' });
    return;
  }
  QRCode.toBuffer(room.listenerToken, { width: 300, margin: 2 })
    .then((png) => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(png);
    })
    .catch(() => res.status(500).json({ error: 'qrcode generation failed' }));
});

const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, '127.0.0.1', () => {
  console.log(`Relay HTTP listening on 127.0.0.1:${HTTP_PORT}`);
});

type RoomSockets = {
  guide: WebSocket | null;
  listeners: Set<WebSocket>;
};

const roomSockets = new Map<string, RoomSockets>();
const guideGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const GUIDE_GRACE_MS = 10 * 60 * 1000; // 10-minute grace period on guide disconnect

function getRoomSockets(roomId: string): RoomSockets {
  let room = roomSockets.get(roomId);
  if (!room) {
    room = { guide: null, listeners: new Set<WebSocket>() };
    roomSockets.set(roomId, room);
  }
  return room;
}

function broadcastListenerCount(roomId: string): void {
  const room = roomSockets.get(roomId);
  if (!room?.guide || room.guide.readyState !== WebSocket.OPEN) return;
  room.guide.send(JSON.stringify({ type: 'listener_count', count: room.listeners.size }));
}

function rawDataToBuffer(data: RawData): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data as unknown as Uint8Array);
}

function closeRoomSockets(roomId: string, code = 4004, reason = 'room not active'): void {
  const pendingTimer = guideGraceTimers.get(roomId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    guideGraceTimers.delete(roomId);
  }

  const sockets = roomSockets.get(roomId);
  if (!sockets) return;

  if (sockets.guide?.readyState === WebSocket.OPEN) {
    sockets.guide.close(code, reason);
  }

  sockets.listeners.forEach((listener) => {
    if (listener.readyState === WebSocket.OPEN) {
      listener.send(JSON.stringify({ type: 'room_ended' }));
      listener.close(code, reason);
    }
  });

  roomSockets.delete(roomId);
}

const wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1', maxPayload: MAX_AUDIO_CHUNK_BYTES });
console.log(`Relay WebSocket listening on 127.0.0.1:${WS_PORT}`);

// Ping all clients every 30s to prevent Cloudflare/proxy idle timeout (100s limit)
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  });
}, 30000);

setInterval(() => {
  roomSockets.forEach((_sockets, roomId) => {
    const relayRoom = getRelayRoom(roomId);
    if (!relayRoom || relayRoom.status !== 'active') {
      closeRoomSockets(roomId);
    }
  });
}, ROOM_SWEEP_MS);

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const role = url.searchParams.get('role');
  const relayRoom = role === 'guide'
    ? getRelayRoomForGuide(url.searchParams.get('roomId') ?? '', url.searchParams.get('guideToken') ?? '')
    : role === 'listener'
      ? getRelayRoomByListenerToken(url.searchParams.get('listenerToken') ?? url.searchParams.get('roomId') ?? '')
      : undefined;

  if (!relayRoom || relayRoom.status !== 'active') {
    ws.close(4004, 'invalid room or role');
    return;
  }

  const roomId = relayRoom.id;
  const sockets = getRoomSockets(roomId);

  if (role === 'guide') {
    // Cancel any pending grace-period timer (guide is reconnecting)
    const pendingTimer = guideGraceTimers.get(roomId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      guideGraceTimers.delete(roomId);
      sockets.listeners.forEach((listener) => {
        if (listener.readyState === WebSocket.OPEN) {
          listener.send(JSON.stringify({ type: 'guide_reconnected' }));
        }
      });
    }

    if (sockets.guide) sockets.guide.close(4001, 'replaced by new guide');
    sockets.guide = ws;
    broadcastListenerCount(roomId);

    ws.on('message', (data: RawData, isBinary: boolean) => {
      const currentRoom = getRelayRoom(roomId);
      if (!currentRoom || currentRoom.status !== 'active') {
        closeRoomSockets(roomId);
        return;
      }

      if (isBinary) {
        const audioBuffer = rawDataToBuffer(data);
        if (audioBuffer.byteLength > MAX_AUDIO_CHUNK_BYTES) {
          ws.close(4009, 'audio chunk too large');
          return;
        }
        sockets.listeners.forEach((listener) => {
          if (listener.readyState === WebSocket.OPEN) listener.send(audioBuffer);
        });
      } else {
        const text = data.toString();
        sockets.listeners.forEach((listener) => {
          if (listener.readyState === WebSocket.OPEN) listener.send(text);
        });
      }
    });

    ws.on('close', () => {
      if (sockets.guide !== ws) return;
      sockets.guide = null;

      // Notify listeners of temporary disconnect with grace period expiry time
      const expiresAt = new Date(Date.now() + GUIDE_GRACE_MS).toISOString();
      sockets.listeners.forEach((listener) => {
        if (listener.readyState === WebSocket.OPEN) {
          listener.send(JSON.stringify({ type: 'guide_disconnected', expiresAt }));
        }
      });

      // End room only after 10-minute grace period
      const timer = setTimeout(() => {
        guideGraceTimers.delete(roomId);
        markRelayRoomEnded(roomId);
        const roomSock = roomSockets.get(roomId);
        if (roomSock) {
          roomSock.listeners.forEach((listener) => {
            if (listener.readyState === WebSocket.OPEN) {
              listener.send(JSON.stringify({ type: 'room_ended' }));
              listener.close();
            }
          });
          roomSockets.delete(roomId);
        }
      }, GUIDE_GRACE_MS);

      guideGraceTimers.set(roomId, timer);
    });
  } else {
    if (sockets.listeners.size >= MAX_LISTENERS_PER_ROOM) {
      ws.close(4008, 'listener limit reached');
      return;
    }

    sockets.listeners.add(ws);
    broadcastListenerCount(roomId);

    ws.on('close', () => {
      sockets.listeners.delete(ws);
      broadcastListenerCount(roomId);
    });
  }
});
