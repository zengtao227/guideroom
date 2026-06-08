# QR Code Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the QR placeholder on the guide room page with a real SVG QR code encoding the listener URL.

**Architecture:** `lib/qr.ts` wraps the `qrcode` package and returns a base64 SVG data URL. The guide room Server Component calls it at render time — no client JS needed. `NEXT_PUBLIC_APP_URL` controls the base URL; falls back to `http://localhost:3000` when unset.

**Tech Stack:** Next.js 16 App Router, TypeScript, `qrcode` + `@types/qrcode` (already installed).

---

### Task 1: Create `lib/qr.ts`

**Files:**
- Create: `apps/web/src/lib/qr.ts`

**Step 1: Write the file**

```ts
import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: 'svg', margin: 1 });
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
```

**Step 2: Type-check**

```bash
cd apps/web && npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/lib/qr.ts
git commit -m "feat: add generateQrDataUrl helper"
```

---

### Task 2: Replace QR placeholder in guide room page

**Files:**
- Modify: `apps/web/src/app/guide/room/[roomId]/page.tsx`

**Step 1: Update the aside section**

Replace the existing `<aside>` block:

```tsx
import { generateQrDataUrl } from '@/lib/qr';

// Inside the component, after room is resolved:
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const listenerUrl = `${appUrl}/listen/${roomId}`;
const qrDataUrl = await generateQrDataUrl(listenerUrl);
```

Replace the `<aside>` JSX:

```tsx
<aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
  <img
    src={qrDataUrl}
    alt="QR code for listener link"
    className="mx-auto h-56 w-56 rounded-2xl"
  />
  <p className="mt-5 text-sm text-slate-600">Listener link</p>
  <a
    href={listenerUrl}
    className="mt-2 block break-all text-sm font-semibold text-slate-950"
  >
    {listenerUrl}
  </a>
</aside>
```

Note: `listenerUrl` replaces both the QR target and the display link, so the `const listenUrl` line already in the file should be removed.

**Step 2: Type-check**

```bash
cd apps/web && npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add "apps/web/src/app/guide/room/[roomId]/page.tsx"
git commit -m "feat: render real QR code on guide room page"
```

---

### Task 3: Update `.env.example` and smoke test

**Files:**
- Modify: `apps/web/.env.example`

**Step 1: Update env example**

```bash
# .env.example
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

# Base URL used in QR codes and listener links.
# Local WiFi testing: set to your machine's network IP, e.g. http://192.168.1.x:3000
# Production: https://zengsg.dpdns.org
NEXT_PUBLIC_APP_URL=
```

**Step 2: Start dev server and verify**

```bash
cd apps/web && npm run dev
```

1. Open `http://localhost:3000/guide/create`
2. Fill in a room title and submit
3. Confirm URL changed to `/guide/room/<uuid>`
4. Confirm a real QR code image is visible (not the grey placeholder)
5. Confirm the listener link text below the QR shows `http://localhost:3000/listen/<uuid>`

**Step 3: Commit and push**

```bash
git add apps/web/.env.example docs/plans/2026-06-08-qr-code-design.md docs/plans/2026-06-08-qr-code-impl.md
git commit -m "docs: update env.example with NEXT_PUBLIC_APP_URL instructions"
git push
```
