import express, { Request, Response } from 'express';
import http from 'http';
import QRCode from 'qrcode';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { createRelayRoom, getRelayRoom, markRelayRoomEnded } from './store';

const HTTP_PORT = Number(process.env.RELAY_HTTP_PORT ?? 3002);
const WS_PORT = Number(process.env.RELAY_WS_PORT ?? 3003);

const app = express();
app.use(express.json());

app.post('/relay-api/rooms', (req: Request, res: Response) => {
  const { title, guideName, durationHours } = req.body as {
    title?: string;
    guideName?: string;
    durationHours?: number;
  };
  const room = createRelayRoom(title ?? '', guideName, durationHours ?? 1);
  res.json({ roomId: room.id, expiresAt: room.expiresAt, title: room.title, guideName: room.guideName });
});

app.get('/relay-api/rooms/:roomId', (req: Request, res: Response) => {
  const room = getRelayRoom(String(req.params.roomId));
  if (!room) {
    res.status(404).json({ error: 'room not found' });
    return;
  }
  res.json({ roomId: room.id, title: room.title, guideName: room.guideName, expiresAt: room.expiresAt, status: room.status });
});

app.get('/relay-api/rooms/:roomId/qrcode', (req: Request, res: Response) => {
  const room = getRelayRoom(String(req.params.roomId));
  if (!room) {
    res.status(404).json({ error: 'room not found' });
    return;
  }
  QRCode.toBuffer(room.id, { width: 300, margin: 2 })
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

const wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });
console.log(`Relay WebSocket listening on 127.0.0.1:${WS_PORT}`);

// Ping all clients every 30s to prevent Cloudflare/proxy idle timeout (100s limit)
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  });
}, 30000);

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const roomId = url.searchParams.get('roomId') ?? '';
  const role = url.searchParams.get('role');
  const relayRoom = getRelayRoom(roomId);

  if (!relayRoom || relayRoom.status !== 'active' || (role !== 'guide' && role !== 'listener')) {
    ws.close(4004, 'invalid room or role');
    return;
  }

  const sockets = getRoomSockets(roomId);

  if (role === 'guide') {
    if (sockets.guide) sockets.guide.close(4001, 'replaced by new guide');
    sockets.guide = ws;
    broadcastListenerCount(roomId);

    ws.on('message', (data: RawData, isBinary: boolean) => {
      if (isBinary) {
        const audioBuffer = rawDataToBuffer(data);
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
      if (sockets.guide === ws) sockets.guide = null;
      markRelayRoomEnded(roomId);
      sockets.listeners.forEach((listener) => {
        if (listener.readyState === WebSocket.OPEN) {
          listener.send(JSON.stringify({ type: 'room_ended' }));
          listener.close();
        }
      });
      roomSockets.delete(roomId);
    });
  } else {
    sockets.listeners.add(ws);
    broadcastListenerCount(roomId);

    ws.on('close', () => {
      sockets.listeners.delete(ws);
      broadcastListenerCount(roomId);
    });
  }
});
