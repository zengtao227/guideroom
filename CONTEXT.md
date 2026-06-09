---
project: guideroom
status: active
language: TypeScript
stack: Next.js 16, LiveKit, Tailwind CSS v4
vps: frankfurt
public_url: https://guideroom.zengsg.dpdns.org
github: https://github.com/zengtao227/guideroom
---

# GuideRoom

一键创建导游直播音频房间。访客扫描二维码，用自己的手机和耳机收听，无需安装任何 App。

## 架构

```
Browser (guide)  ──WSS──→  LiveKit Server (self-hosted, frank VPS :7880)
                                  ↕ WebRTC media (UDP 50000-60000)
Browser (listener) ←──audio──────┘
```

- **Next.js 16 App Router** (apps/web)，npm workspaces monorepo
- **LiveKit** 处理 WebRTC 音频 SFU；自建于 frank VPS，通过 Caddy 代理 WSS
- **in-memory room store**（`Map<string, Room>`）- MVP，无数据库；重启数据丢失
- **QR 码**：服务端生成 SVG（qrcode 包），base64 嵌入
- **多语言**：EN/ZH/DE/FR，客户端 Context + localStorage 持久化

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 首页（英文默认，右上角切换语言） |
| `/guide/create` | 导游创建房间表单 |
| `/guide/room/[roomId]` | 导游控制台（麦克风开关、QR 码、结束房间） |
| `/listen/[roomId]` | 访客收听页（扫码后跳转） |
| `/api/livekit-token` | 生成 LiveKit JWT token |

## 环境变量

Server-side (in `.env.local` 或 `.env.production`，不入 git):
- `LIVEKIT_URL` — LiveKit Server WebSocket URL，生产用 `wss://livekit.zengsg.dpdns.org`
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` — 与 `/data/livekit/livekit.yaml` 的 keys 一致

Build-time (baked into client bundle):
- `NEXT_PUBLIC_APP_URL` — 生产值 `https://guideroom.zengsg.dpdns.org`（通过 docker-compose.prod.yml build arg 注入）

## 本地开发

```bash
cd apps/web
cp .env.local.example .env.local  # 填入 LiveKit Cloud 凭证
npm run dev  # localhost:3000
```

导游必须用 `localhost:3000`（getUserMedia 需要 secure context）；监听者可用局域网 IP。

## 生产部署（frank VPS）

```bash
# 首次部署
cd /data/projects/guideroom
git clone https://github.com/zengtao227/guideroom.git .
# 创建 .env.production（见上方环境变量）
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 代码更新后重建
git pull
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

LiveKit Server（独立管理）：
```bash
cd /data/livekit
sudo docker compose up -d    # 启动
sudo docker compose down     # 停止
sudo docker compose logs -f  # 查看日志
```

## DNS（Cloudflare）

| 子域名 | 类型 | IP | 代理 |
|--------|------|-----|------|
| `guideroom.zengsg.dpdns.org` | A | 89.168.80.38 | 橙色（proxied） |
| `livekit.zengsg.dpdns.org` | A | 89.168.80.38 | 灰色（DNS-only）推荐 |

## Oracle Cloud Security List（需手动配置）

| 协议 | 端口 | 说明 |
|------|------|------|
| UDP | 50000-60000 | WebRTC 媒体流 |
| TCP | 7881 | WebRTC TCP 回退 |

## 关键设计决策

- **自建 LiveKit vs Cloud**：Cloud 约 $0.005/participant-minute；自建 frank VPS 后成本归零
- **host 网络模式**：LiveKit 容器使用 `network_mode: host` 避免 Docker NAT 影响 WebRTC ICE
- **in-memory store**：MVP 阶段无数据库，重启后所有房间丢失；足够用于单次导览
- **NEXT_PUBLIC_APP_URL 在构建时注入**：生产 URL baked 进 JS bundle，Dockerfile ARG 控制
