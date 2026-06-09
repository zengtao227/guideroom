# WeChat Mini Program Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a WeChat Mini Program (3 pages: index, guide, listener) backed by a new Node.js WebSocket relay server, so Chinese users can use GuideRoom without LiveKit/WebRTC.

**Architecture:** Relay server (`server/`) runs on Frankfurt VPS port 3002 (HTTP) and 3003 (WebSocket), proxied by Caddy under `guideroom.zengsg.dpdns.org`. Mini program (`miniprogram/`) connects to this relay. Guide sends AAC audio chunks via WebSocket; relay broadcasts to all listeners; listeners write chunks to temp files and play them sequentially with `InnerAudioContext`.

**Tech Stack:** Node.js 20 + TypeScript + `ws` + `express` (relay); WeChat Mini Program WXML/WXSS/TypeScript (client); PM2 for process management on VPS.

---

## Task 1: Relay server — scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/room-store.ts`

**Step 1: Create `server/package.json`**

```json
{
  "name": "guideroom-relay",
  "version": "1.0.0",
  "private": true,
  "main": "dist/relay.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/relay.js",
    "dev": "ts-node src/relay.ts"
  },
  "dependencies": {
    "express": "^4.21.0",
    "uuid": "^11.0.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "@types/ws": "^8.5.13",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Create `server/src/room-store.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';

export type RelayRoom = {
  id: string;
  title: string;
  guideName?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'ended';
};

const rooms = new Map<string, RelayRoom>();

export function createRoom(title: string, guideName: string | undefined, durationHours: number): RelayRoom {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  const room: RelayRoom = {
    id,
    title: title || '导览房间',
    guideName: guideName || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): RelayRoom | undefined {
  return rooms.get(id);
}

export function endRoom(id: string): void {
  const room = rooms.get(id);
  if (room) rooms.set(id, { ...room, status: 'ended' });
}
```

**Step 4: Install deps and verify TypeScript compiles**

```bash
cd server
npm install
npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add server/
git commit -m "feat: relay server scaffold (room store + build config)"
```

---

## Task 2: Relay server — HTTP API + WebSocket relay

**Files:**
- Create: `server/src/relay.ts`

**Step 1: Create `server/src/relay.ts`**

```typescript
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createRoom, getRoom, endRoom } from './room-store.js';

const HTTP_PORT = Number(process.env.RELAY_HTTP_PORT ?? 3002);
const WS_PORT   = Number(process.env.RELAY_WS_PORT   ?? 3003);

// ── HTTP API ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.post('/relay-api/rooms', (req: Request, res: Response) => {
  const { title, guideName, durationHours } = req.body as {
    title?: string;
    guideName?: string;
    durationHours?: number;
  };
  const room = createRoom(title ?? '', guideName, durationHours ?? 1);
  res.json({ roomId: room.id, expiresAt: room.expiresAt, title: room.title });
});

app.get('/relay-api/rooms/:roomId', (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) { res.status(404).json({ error: 'room not found' }); return; }
  res.json(room);
});

const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, '127.0.0.1', () =>
  console.log(`Relay HTTP listening on 127.0.0.1:${HTTP_PORT}`),
);

// ── WebSocket relay ───────────────────────────────────────────────────────────

type RoomSockets = {
  guide: WebSocket | null;
  listeners: Set<WebSocket>;
};

const roomSockets = new Map<string, RoomSockets>();

function getRoomSockets(roomId: string): RoomSockets {
  if (!roomSockets.has(roomId)) {
    roomSockets.set(roomId, { guide: null, listeners: new Set() });
  }
  return roomSockets.get(roomId)!;
}

function broadcastListenerCount(roomId: string): void {
  const rs = roomSockets.get(roomId);
  if (!rs?.guide) return;
  const msg = JSON.stringify({ type: 'listener_count', count: rs.listeners.size });
  if (rs.guide.readyState === WebSocket.OPEN) rs.guide.send(msg);
}

const wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });
console.log(`Relay WebSocket listening on 127.0.0.1:${WS_PORT}`);

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url ?? '', `http://localhost`);
  const roomId = url.searchParams.get('roomId') ?? '';
  const role   = url.searchParams.get('role');

  const room = getRoom(roomId);
  if (!room || room.status !== 'active' || (role !== 'guide' && role !== 'listener')) {
    ws.close(4004, 'invalid room or role');
    return;
  }

  const rs = getRoomSockets(roomId);

  if (role === 'guide') {
    if (rs.guide) rs.guide.close(4001, 'replaced by new guide');
    rs.guide = ws;
    broadcastListenerCount(roomId);

    ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      // Forward binary audio chunks to all listeners
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      rs.listeners.forEach(listener => {
        if (listener.readyState === WebSocket.OPEN) listener.send(buf);
      });
    });

    ws.on('close', () => {
      if (rs.guide === ws) rs.guide = null;
      endRoom(roomId);
      rs.listeners.forEach(listener => {
        if (listener.readyState === WebSocket.OPEN) {
          listener.send(JSON.stringify({ type: 'room_ended' }));
          listener.close();
        }
      });
      roomSockets.delete(roomId);
    });

  } else {
    rs.listeners.add(ws);
    broadcastListenerCount(roomId);

    ws.on('close', () => {
      rs.listeners.delete(ws);
      broadcastListenerCount(roomId);
    });
  }
});
```

**Step 2: Build and smoke-test locally**

```bash
cd server
npm run build
node dist/relay.js &
# Test HTTP
curl -s -X POST http://127.0.0.1:3002/relay-api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test","durationHours":1}' | jq .
# Expected: { roomId: "...", expiresAt: "...", title: "Test" }
kill %1
```

**Step 3: Commit**

```bash
git add server/src/relay.ts
git commit -m "feat: relay server HTTP API and WebSocket audio relay"
```

---

## Task 3: Deploy relay server to Frankfurt VPS

**Files (on VPS):**
- Modify: `/etc/caddy/Caddyfile`
- Create: `/data/projects/guideroom/server/ecosystem.config.js` (PM2)

**Step 1: Push latest code and install deps on VPS**

```bash
git push
ssh frank "cd /data/projects/guideroom && git pull && cd server && npm install && npm run build"
```

**Step 2: Create PM2 ecosystem file on VPS**

```bash
ssh frank "cat > /data/projects/guideroom/server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'guideroom-relay',
    script: '/data/projects/guideroom/server/dist/relay.js',
    env: { RELAY_HTTP_PORT: 3002, RELAY_WS_PORT: 3003 },
    restart_delay: 3000,
    max_restarts: 10,
  }]
}
EOF"
```

**Step 3: Install PM2 and start relay**

```bash
ssh frank "sudo npm install -g pm2 2>/dev/null || true && pm2 start /data/projects/guideroom/server/ecosystem.config.js && pm2 save"
```

**Step 4: Update Caddy — replace the guideroom block**

Current `/etc/caddy/Caddyfile` has:
```
guideroom.zengsg.dpdns.org { reverse_proxy localhost:3001 }
```

Replace with:
```
guideroom.zengsg.dpdns.org {
    reverse_proxy /relay-api/* localhost:3002
    reverse_proxy /relay-ws    localhost:3003
    reverse_proxy *            localhost:3001
}
```

```bash
ssh frank "sudo sed -i 's|guideroom.zengsg.dpdns.org { reverse_proxy localhost:3001 }|guideroom.zengsg.dpdns.org {\n    reverse_proxy /relay-api/* localhost:3002\n    reverse_proxy /relay-ws    localhost:3003\n    reverse_proxy *            localhost:3001\n}|' /etc/caddy/Caddyfile && sudo caddy reload --config /etc/caddy/Caddyfile"
```

If the sed fails (Caddyfile format differs), edit manually via `ssh frank "sudo nano /etc/caddy/Caddyfile"`.

**Step 5: Verify relay API is live**

```bash
curl -s -X POST https://guideroom.zengsg.dpdns.org/relay-api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"title":"TestRoom","durationHours":1}' | jq .
# Expected: { roomId: "...", expiresAt: "...", title: "TestRoom" }
```

**Step 6: Commit ecosystem config**

```bash
git add server/ecosystem.config.js
git commit -m "feat: PM2 ecosystem config for relay server"
git push
```

---

## Task 4: Mini Program — scaffold

**Files:**
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.ts`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/utils/room-api.ts`

WeChat Mini Program projects are opened in **WeChat DevTools** (separate IDE, download from https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html). The `miniprogram/` directory IS the mini program root — open it in DevTools.

**Step 1: Create `miniprogram/app.json`**

```json
{
  "pages": [
    "pages/index/index",
    "pages/guide/guide",
    "pages/listener/listener"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#0f172a",
    "navigationBarTitleText": "GuideRoom",
    "navigationBarTextStyle": "white"
  },
  "permission": {
    "scope.record": {
      "desc": "导游需要使用麦克风进行语音导览"
    }
  },
  "requiredPrivateInfos": ["chooseAddress"],
  "sitemapLocation": "sitemap.json"
}
```

**Step 2: Create `miniprogram/app.ts`**

```typescript
App({
  globalData: {
    relayBase: 'https://guideroom.zengsg.dpdns.org',
  },
});
```

**Step 3: Create `miniprogram/app.wxss`**

```css
page {
  background-color: #0f172a;
  color: #ffffff;
  font-family: -apple-system, 'PingFang SC', sans-serif;
  box-sizing: border-box;
}
```

**Step 4: Create `miniprogram/project.config.json`**

```json
{
  "appid": "YOUR_APPID_HERE",
  "projectname": "guideroom",
  "compileType": "miniprogram",
  "setting": {
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compile": {}
  },
  "condition": {}
}
```

Note: Replace `YOUR_APPID_HERE` with the real AppID from https://mp.weixin.qq.com after registering the mini program. For local testing, DevTools allows a "test account" (测试号) with no AppID.

**Step 5: Create `miniprogram/utils/room-api.ts`**

```typescript
const app = getApp<{ globalData: { relayBase: string } }>();

export type RoomInfo = {
  roomId: string;
  title: string;
  guideName?: string;
  expiresAt: string;
};

export function createRoom(params: {
  title: string;
  guideName: string;
  durationHours: number;
}): Promise<RoomInfo> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.relayBase}/relay-api/rooms`,
      method: 'POST',
      data: params,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data as RoomInfo);
        else reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail: (err) => reject(new Error(err.errMsg)),
    });
  });
}

export function getRoom(roomId: string): Promise<RoomInfo> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.relayBase}/relay-api/rooms/${roomId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data as RoomInfo);
        else reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail: (err) => reject(new Error(err.errMsg)),
    });
  });
}
```

**Step 6: Create `miniprogram/sitemap.json`**

```json
{ "rules": [{ "action": "disallow", "page": "*" }] }
```

**Step 7: Commit**

```bash
git add miniprogram/
git commit -m "feat: WeChat Mini Program scaffold"
```

---

## Task 5: Mini Program — index page

**Files:**
- Create: `miniprogram/pages/index/index.wxml`
- Create: `miniprogram/pages/index/index.wxss`
- Create: `miniprogram/pages/index/index.ts`
- Create: `miniprogram/pages/index/index.json`

**Step 1: Create `miniprogram/pages/index/index.json`**

```json
{ "navigationBarTitleText": "GuideRoom" }
```

**Step 2: Create `miniprogram/pages/index/index.wxml`**

```xml
<view class="container">
  <view class="hero">
    <text class="tagline">GuideRoom</text>
    <text class="headline">30秒创建导游直播音频房间</text>
    <text class="desc">访客扫码用自己的手机收听，无需专用设备</text>
  </view>

  <view class="actions">
    <button class="btn-primary" bindtap="createRoom" loading="{{creating}}">
      {{creating ? '创建中…' : '创建房间（导游）'}}
    </button>
    <button class="btn-secondary" bindtap="scanToListen">
      扫码收听（访客）
    </button>
  </view>
</view>
```

**Step 3: Create `miniprogram/pages/index/index.wxss`**

```css
.container {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 60rpx;
}
.hero { display: flex; flex-direction: column; gap: 20rpx; }
.tagline { font-size: 24rpx; color: #94a3b8; text-transform: uppercase; letter-spacing: 4rpx; }
.headline { font-size: 56rpx; font-weight: bold; line-height: 1.2; }
.desc { font-size: 28rpx; color: #94a3b8; line-height: 1.6; }
.actions { display: flex; flex-direction: column; gap: 24rpx; }
.btn-primary {
  width: 100%; padding: 32rpx;
  background: #ffffff; color: #0f172a;
  border-radius: 100rpx; font-size: 28rpx; font-weight: bold;
  border: none;
}
.btn-secondary {
  width: 100%; padding: 32rpx;
  background: transparent; color: #ffffff;
  border-radius: 100rpx; font-size: 28rpx;
  border: 2rpx solid rgba(255,255,255,0.3);
}
```

**Step 4: Create `miniprogram/pages/index/index.ts`**

```typescript
import { createRoom } from '../../utils/room-api';

Page({
  data: { creating: false },

  async createRoom() {
    if (this.data.creating) return;
    this.setData({ creating: true });
    try {
      const room = await createRoom({ title: '', guideName: '', durationHours: 1 });
      wx.navigateTo({
        url: `/pages/guide/guide?roomId=${room.roomId}&title=${encodeURIComponent(room.title)}&expiresAt=${encodeURIComponent(room.expiresAt)}`,
      });
    } catch {
      wx.showToast({ title: '创建失败，请重试', icon: 'none' });
    } finally {
      this.setData({ creating: false });
    }
  },

  scanToListen() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const roomId = res.result.trim();
        if (!roomId) { wx.showToast({ title: '无效的房间码', icon: 'none' }); return; }
        wx.navigateTo({ url: `/pages/listener/listener?roomId=${roomId}` });
      },
      fail: () => wx.showToast({ title: '扫码取消', icon: 'none' }),
    });
  },
});
```

**Step 5: Verify in WeChat DevTools**
- Open DevTools, select `miniprogram/` as project root
- Use test account (测试号) if no AppID yet
- Should render home page with two buttons
- "创建房间" calls relay API — check DevTools network tab for POST `/relay-api/rooms`

**Step 6: Commit**

```bash
git add miniprogram/pages/index/
git commit -m "feat: mini program index page"
```

---

## Task 6: Mini Program — guide page

**Files:**
- Create: `miniprogram/pages/guide/guide.wxml`
- Create: `miniprogram/pages/guide/guide.wxss`
- Create: `miniprogram/pages/guide/guide.ts`
- Create: `miniprogram/pages/guide/guide.json`
- Create: `miniprogram/utils/relay-client.ts`

**Step 1: Create `miniprogram/utils/relay-client.ts`**

This module manages the WebSocket connection and audio recording for the guide.

```typescript
const app = getApp<{ globalData: { relayBase: string } }>();

function wsUrl(roomId: string, role: 'guide' | 'listener'): string {
  const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${base}/relay-ws?roomId=${roomId}&role=${role}`;
}

// ── Guide client ──────────────────────────────────────────────────────────────

type GuideCallbacks = {
  onListenerCount: (count: number) => void;
  onError: (msg: string) => void;
};

export class GuideRelayClient {
  private ws: WechatMiniprogram.SocketTask | null = null;
  private recorder = wx.getRecorderManager();
  private recording = false;

  constructor(private roomId: string, private cb: GuideCallbacks) {}

  connect(): void {
    this.ws = wx.connectSocket({
      url: wsUrl(this.roomId, 'guide'),
      fail: () => this.cb.onError('连接失败'),
    });

    this.ws.onMessage((res) => {
      if (typeof res.data === 'string') {
        const msg = JSON.parse(res.data) as { type: string; count?: number };
        if (msg.type === 'listener_count') this.cb.onListenerCount(msg.count ?? 0);
      }
    });

    this.ws.onError(() => this.cb.onError('连接断开'));

    this.recorder.onFrameRecorded(({ frameBuffer, isLastFrame }) => {
      if (this.ws && frameBuffer) {
        this.ws.send({ data: frameBuffer });
      }
      if (isLastFrame) this.recording = false;
    });
  }

  startMic(): void {
    if (this.recording) return;
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorder.start({
          duration: 600000,       // up to 10 min; we stop manually
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'aac',
          frameSize: 1,           // emit frames ~every 500ms (1KB chunks)
        });
        this.recording = true;
      },
      fail: () => this.cb.onError('需要麦克风权限'),
    });
  }

  stopMic(): void {
    if (!this.recording) return;
    this.recorder.stop();
    this.recording = false;
  }

  disconnect(): void {
    this.stopMic();
    this.ws?.close({});
    this.ws = null;
  }

  get isRecording(): boolean { return this.recording; }
}
```

**Step 2: Create `miniprogram/pages/guide/guide.json`**

```json
{ "navigationBarTitleText": "导游控制台" }
```

**Step 3: Create `miniprogram/pages/guide/guide.wxml`**

```xml
<view class="container">
  <view class="card">
    <text class="label">房间ID（让访客扫码或手动输入）</text>
    <text class="room-id" bindtap="copyRoomId">{{roomId}}</text>
    <text class="hint">点击复制</text>
  </view>

  <view class="card row">
    <text class="label">当前收听人数</text>
    <text class="count">{{listenerCount}}</text>
  </view>

  <view class="card">
    <canvas type="2d" id="qrcode" style="width:300rpx;height:300rpx;" />
    <text class="hint">访客扫描二维码加入</text>
  </view>

  <button class="btn-mic {{micOn ? 'active' : ''}}" bindtap="toggleMic">
    {{micOn ? '🎙 停止讲话' : '🎙 开始讲话'}}
  </button>

  <button class="btn-end" bindtap="endRoom">结束房间</button>
</view>
```

**Step 4: Create `miniprogram/pages/guide/guide.wxss`**

```css
.container { min-height: 100vh; padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx; }
.card {
  background: rgba(255,255,255,0.08);
  border-radius: 24rpx; padding: 32rpx;
  display: flex; flex-direction: column; gap: 12rpx;
}
.card.row { flex-direction: row; align-items: center; justify-content: space-between; }
.label { font-size: 24rpx; color: #94a3b8; }
.room-id { font-size: 36rpx; font-weight: bold; font-family: monospace; letter-spacing: 4rpx; }
.count { font-size: 48rpx; font-weight: bold; }
.hint { font-size: 22rpx; color: #64748b; }
.btn-mic {
  width: 100%; padding: 36rpx; border-radius: 100rpx;
  background: rgba(255,255,255,0.12); color: #ffffff;
  font-size: 30rpx; font-weight: bold; border: none; margin-top: 12rpx;
}
.btn-mic.active { background: #1e3a5f; border: 2rpx solid #3b82f6; }
.btn-end {
  width: 100%; padding: 32rpx; border-radius: 100rpx;
  background: transparent; color: #ef4444;
  font-size: 28rpx; border: 2rpx solid rgba(239,68,68,0.4);
}
```

**Step 5: Create `miniprogram/pages/guide/guide.ts`**

```typescript
import { GuideRelayClient } from '../../utils/relay-client';

Page({
  data: {
    roomId: '',
    listenerCount: 0,
    micOn: false,
  },

  client: null as GuideRelayClient | null,

  onLoad(options) {
    const roomId = options.roomId ?? '';
    this.setData({ roomId });

    this.client = new GuideRelayClient(roomId, {
      onListenerCount: (count) => this.setData({ listenerCount: count }),
      onError: (msg) => wx.showToast({ title: msg, icon: 'none' }),
    });
    this.client.connect();
    this.drawQrCode(roomId);
  },

  drawQrCode(roomId: string) {
    // Use a simple text display for the QR code — full QR library requires npm build setup
    // The canvas is reserved; for now the room ID itself is the share token
    // TODO: integrate weapp-qrcode after npm build is configured
  },

  copyRoomId() {
    wx.setClipboardData({
      data: this.data.roomId,
      success: () => wx.showToast({ title: '已复制房间ID', icon: 'success' }),
    });
  },

  toggleMic() {
    const client = this.client;
    if (!client) return;
    if (this.data.micOn) {
      client.stopMic();
      this.setData({ micOn: false });
    } else {
      client.startMic();
      this.setData({ micOn: true });
    }
  },

  endRoom() {
    wx.showModal({
      title: '确认结束',
      content: '结束房间后所有访客将断开连接。',
      success: (res) => {
        if (res.confirm) {
          this.client?.disconnect();
          wx.navigateBack();
        }
      },
    });
  },

  onUnload() {
    this.client?.disconnect();
  },
});
```

**Step 6: Verify in DevTools**
- Navigate from index → guide page
- Network tab shows WebSocket connection to `wss://guideroom.zengsg.dpdns.org/relay-ws`
- Room ID displays and copies on tap

**Step 7: Commit**

```bash
git add miniprogram/utils/relay-client.ts miniprogram/pages/guide/
git commit -m "feat: mini program guide page with mic and WebSocket"
```

---

## Task 7: Mini Program — listener page

**Files:**
- Create: `miniprogram/pages/listener/listener.wxml`
- Create: `miniprogram/pages/listener/listener.wxss`
- Create: `miniprogram/pages/listener/listener.ts`
- Create: `miniprogram/pages/listener/listener.json`

WeChat requires a **user gesture** (button tap) before audio playback. The listener must tap "开始收听" before audio plays.

**Step 1: Create `miniprogram/pages/listener/listener.json`**

```json
{ "navigationBarTitleText": "收听中" }
```

**Step 2: Create `miniprogram/pages/listener/listener.wxml`**

```xml
<view class="container">
  <view class="card">
    <text class="tag">GuideRoom 听众端</text>
    <text class="title">{{title || '导览房间'}}</text>
    <text wx:if="{{guideName}}" class="guide">导游：{{guideName}}</text>
  </view>

  <view wx:if="{{status === 'idle'}}" class="card">
    <text class="hint-main">请佩戴耳机，然后点击下方按钮开始收听</text>
    <button class="btn-primary" bindtap="startListening">开始收听</button>
  </view>

  <view wx:elif="{{status === 'connecting'}}" class="card status">
    <text class="status-dot connecting" />
    <text>连接中…</text>
  </view>

  <view wx:elif="{{status === 'connected'}}" class="card status">
    <text class="status-dot connected" />
    <text>收听中（实时）</text>
    <text class="hint">音频延迟约 1-2 秒，属于正常现象</text>
  </view>

  <view wx:elif="{{status === 'ended'}}" class="card">
    <text class="title">房间已结束</text>
    <text class="hint">导游已关闭本次导览</text>
    <button class="btn-secondary" bindtap="goHome">返回首页</button>
  </view>
</view>
```

**Step 3: Create `miniprogram/pages/listener/listener.wxss`**

```css
.container { min-height: 100vh; padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx; }
.card {
  background: rgba(255,255,255,0.08);
  border-radius: 24rpx; padding: 32rpx;
  display: flex; flex-direction: column; gap: 16rpx;
}
.card.status { flex-direction: row; align-items: center; gap: 20rpx; }
.tag { font-size: 22rpx; color: #94a3b8; text-transform: uppercase; }
.title { font-size: 40rpx; font-weight: bold; }
.guide { font-size: 28rpx; color: #94a3b8; }
.hint-main { font-size: 28rpx; color: #cbd5e1; line-height: 1.6; }
.hint { font-size: 22rpx; color: #64748b; }
.status-dot { width: 20rpx; height: 20rpx; border-radius: 50%; }
.status-dot.connecting { background: #f59e0b; }
.status-dot.connected { background: #22c55e; }
.btn-primary {
  width: 100%; padding: 36rpx; border-radius: 100rpx;
  background: #ffffff; color: #0f172a;
  font-size: 30rpx; font-weight: bold; border: none;
}
.btn-secondary {
  width: 100%; padding: 32rpx; border-radius: 100rpx;
  background: transparent; color: #ffffff;
  font-size: 28rpx; border: 2rpx solid rgba(255,255,255,0.3);
}
```

**Step 4: Create `miniprogram/pages/listener/listener.ts`**

```typescript
import { getRoom } from '../../utils/room-api';

const app = getApp<{ globalData: { relayBase: string } }>();
const fs = wx.getFileSystemManager();

Page({
  data: {
    roomId: '',
    title: '',
    guideName: '',
    status: 'idle' as 'idle' | 'connecting' | 'connected' | 'ended',
  },

  ws: null as WechatMiniprogram.SocketTask | null,
  audioCtx: null as WechatMiniprogram.InnerAudioContext | null,
  audioQueue: [] as string[],
  isPlaying: false,
  chunkIndex: 0,

  async onLoad(options) {
    const roomId = options.roomId ?? '';
    this.setData({ roomId });
    try {
      const room = await getRoom(roomId);
      this.setData({ title: room.title, guideName: room.guideName ?? '' });
    } catch {
      this.setData({ status: 'ended' });
    }
  },

  startListening() {
    this.setData({ status: 'connecting' });

    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.obeyMuteSwitch = false;
    this.audioCtx.onEnded(() => this.playNext());
    this.audioCtx.onError(() => this.playNext());

    const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = wx.connectSocket({
      url: `${base}/relay-ws?roomId=${this.data.roomId}&role=listener`,
      fail: () => this.setData({ status: 'ended' }),
    });

    this.ws.onOpen(() => this.setData({ status: 'connected' }));

    this.ws.onMessage((res) => {
      if (typeof res.data === 'string') {
        const msg = JSON.parse(res.data) as { type: string };
        if (msg.type === 'room_ended') {
          this.cleanup();
          this.setData({ status: 'ended' });
        }
        return;
      }
      // Binary: AAC audio chunk — write to temp file and queue
      this.chunkIndex += 1;
      const path = `${wx.env.USER_DATA_PATH}/gr_chunk_${this.chunkIndex}.aac`;
      fs.writeFile({
        filePath: path,
        data: res.data as ArrayBuffer,
        encoding: 'binary',
        success: () => {
          this.audioQueue.push(path);
          if (!this.isPlaying) this.playNext();
        },
      });
    });

    this.ws.onClose(() => {
      if (this.data.status !== 'ended') this.setData({ status: 'ended' });
    });
  },

  playNext() {
    if (this.audioQueue.length === 0) { this.isPlaying = false; return; }
    this.isPlaying = true;
    const path = this.audioQueue.shift()!;
    if (this.audioCtx) {
      this.audioCtx.src = path;
      this.audioCtx.play();
    }
    // Clean up old file after slight delay
    setTimeout(() => {
      fs.unlink({ filePath: path, fail: () => {} });
    }, 5000);
  },

  cleanup() {
    this.ws?.close({});
    this.ws = null;
    this.audioCtx?.stop();
    this.audioCtx?.destroy();
    this.audioCtx = null;
    this.audioQueue = [];
    this.isPlaying = false;
  },

  goHome() {
    wx.navigateBack({ delta: 99 });
  },

  onUnload() {
    this.cleanup();
  },
});
```

**Step 5: End-to-end test in DevTools**
- Open two DevTools simulator windows (or use a real device for the listener)
- Window 1: guide page → tap "开始讲话" (speak into mic)
- Window 2: listener page → tap "开始收听"
- Verify: listener status changes to "收听中", audio plays with ~1-2s delay

**Step 6: Commit**

```bash
git add miniprogram/pages/listener/
git commit -m "feat: mini program listener page with audio queue playback"
git push
```

---

## Task 8: Update CONTEXT.md and registry

**Files:**
- Modify: `CONTEXT.md`
- Modify: `/Users/zengtao/InfraOps/registry/registry_frankfurt.yaml`

**Step 1: Add WeChat Mini Program section to `CONTEXT.md`**

Append after the existing content:

```markdown
## 微信小程序（中国市场）

| 项目 | 路径 |
|------|------|
| 小程序源码 | `miniprogram/` |
| 中继服务器源码 | `server/` |
| 中继服务器部署 | Frankfurt VPS，PM2 进程名 `guideroom-relay` |

### 中继服务器端点

| 端点 | 用途 |
|------|------|
| `POST /relay-api/rooms` | 创建房间 |
| `GET /relay-api/rooms/:roomId` | 查询房间 |
| `wss://guideroom.zengsg.dpdns.org/relay-ws?roomId=X&role=guide\|listener` | WebSocket 音频中继 |

### 中继服务器管理

```bash
ssh frank "pm2 status guideroom-relay"
ssh frank "pm2 logs guideroom-relay"
ssh frank "pm2 restart guideroom-relay"
```

### 发布前提条件

- 注册微信小程序开发者账号（企业主体）
- 将 `miniprogram/project.config.json` 中的 `YOUR_APPID_HERE` 替换为真实 AppID
- 在微信公众平台后台将 `guideroom.zengsg.dpdns.org` 加入合法域名白名单
- 正式对中国用户上线时，将中继服务器迁移至国内 ECS
```

**Step 2: Add relay entry to Frankfurt registry**

Add to `registry_frankfurt.yaml` under services:

```yaml
  - name: guideroom_relay
    runtime: pm2
    project_root: "/data/projects/guideroom/server"
    entrypoint: "pm2 start /data/projects/guideroom/server/ecosystem.config.js"
    ports:
      - "127.0.0.1:3002 -> HTTP API"
      - "127.0.0.1:3003 -> WebSocket relay"
    reverse_proxy: "Caddy /etc/caddy/Caddyfile guideroom.zengsg.dpdns.org/relay-api/* and /relay-ws -> 127.0.0.1:3002/3003"
    health_check_cmd: "pm2 status guideroom-relay && curl -fsS http://127.0.0.1:3002/relay-api/rooms -X POST -H 'Content-Type:application/json' -d '{\"title\":\"ping\"}' >/dev/null"
    log_path: "pm2 logs guideroom-relay"
    restart_policy: "pm2 save + pm2 startup"
    notes:
      - "Test only on Frankfurt VPS; migrate to Chinese ECS when company is registered"
      - "Mini Program AppID: update miniprogram/project.config.json before publishing"
```

**Step 3: Run catalog sync**

```bash
python3 "/Users/zengtao/Doc/My code/_catalog/sync_context_catalog.py"
python3 "/Users/zengtao/Doc/My code/_catalog/sync_context_catalog.py" --check
```

**Step 4: Commit everything**

```bash
git add CONTEXT.md
git add "/Users/zengtao/InfraOps/registry/registry_frankfurt.yaml"
git commit -m "docs: update CONTEXT.md and registry for WeChat Mini Program + relay server"
git push
```
