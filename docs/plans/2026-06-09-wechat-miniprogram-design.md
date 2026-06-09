# WeChat Mini Program Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a WeChat Mini Program version of GuideRoom for the Chinese market, using a WebSocket audio relay instead of LiveKit/WebRTC.

**Architecture:** Guide captures audio via `RecorderManager`, sends AAC chunks over WSS to a relay server on Frankfurt VPS. Relay broadcasts chunks to all listeners in the same room. Listeners play audio via `InnerAudioContext`.

**Tech Stack:** WeChat Mini Program (WXML/WXSS/TypeScript) + Node.js WebSocket relay server (`ws` library)

---

## Two-Product Strategy

| Product | Target | Audio backend | Server |
|---------|--------|--------------|--------|
| Web app (existing) | Europe / global | LiveKit WebRTC | Frankfurt VPS port 3001 |
| WeChat Mini Program (new) | China | WebSocket relay | Frankfurt VPS port 3002 (test) → Chinese ECS (production) |

Frankfurt is used for testing only. When Chinese operations are ready (company registered, ICP filed), the relay server migrates to a Chinese ECS instance.

---

## Relay Server Design

**Location:** `server/relay.ts` in the existing guideroom repo.

**Runtime:** Node.js + `ws` package. Standalone process, not part of Next.js.

**Room state:** In-memory `Map<roomId, RelayRoom>` (same pattern as web app).

**Ports on Frankfurt VPS:**
- HTTP API: `127.0.0.1:3002` → Caddy proxies `guideroom.zengsg.dpdns.org/relay-api/*`
- WebSocket: `127.0.0.1:3003` → Caddy proxies `wss://guideroom.zengsg.dpdns.org/relay-ws`

**HTTP API endpoints:**
- `POST /relay-api/rooms` — create room, returns `{ roomId, expiresAt }`
- `GET  /relay-api/rooms/:roomId` — get room info

**WebSocket protocol:**
```
Client connects to: wss://guideroom.zengsg.dpdns.org/relay-ws?roomId=xxx&role=guide|listener

Guide → Server:  binary frames (raw AAC audio chunks, ~500ms each)
Server → Guide:  JSON { type: "listener_count", count: N }
Server → Listener: binary frames (forwarded audio chunks)
Server → Listener: JSON { type: "room_ended" } when guide disconnects
```

---

## Mini Program Pages

```
miniprogram/
  pages/
    index/      # Home: "Create room" button + scan QR entry
    guide/      # Guide console: mic toggle, listener count, QR code
    listener/   # Listener: join button → auto-play audio stream
  utils/
    relay.ts    # WebSocket connection + audio send/receive logic
    room.ts     # Room API calls
  app.json      # Permissions: record, network
  app.ts
```

### index page
- Single "创建房间" button
- No login, no account
- Taps → guide page with new room

### guide page
- Shows room ID, QR code (linking to listener page)
- Mic on/off toggle (full-width button)
- Live listener count
- "结束房间" button

### listener page
- Entry: scan QR code → opens mini program at listener page with roomId
- "开始收听" button (user gesture required for audio)
- Status: connecting → connected/playing → ended

---

## Audio Parameters

| Parameter | Value | Reason |
|-----------|-------|--------|
| Format | AAC | Compressed, WeChat native support |
| Sample rate | 16000 Hz | Voice optimised, lower bandwidth |
| Chunk interval | 500 ms | Latency vs smoothness balance |
| Bit rate | 48 kbps | Sufficient for voice |

Expected latency: 1–2 seconds (acceptable for one-way guide commentary).

---

## Caddy Configuration (Frankfurt VPS)

Add to `/etc/caddy/Caddyfile`:
```
guideroom.zengsg.dpdns.org {
  reverse_proxy /relay-api/* localhost:3002
  reverse_proxy /relay-ws   localhost:3003
  reverse_proxy *            localhost:3001   # existing Next.js
}
```

---

## Deployment (Frankfurt VPS)

Relay server runs as a systemd service or PM2 process alongside the Docker Next.js container.

```bash
cd /data/projects/guideroom/server
npm install
pm2 start relay.js --name guideroom-relay
```

---

## Out of Scope (v1)

- WeChat Pay (requires registered company + merchant account)
- User accounts / history
- Session time limits / expiry enforcement
- Migration to Chinese ECS (deferred until company registration)
