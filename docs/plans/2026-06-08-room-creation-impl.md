# Room Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the create-room form to a Server Action that stores a Room in memory and redirects the guide to `/guide/room/[roomId]`.

**Architecture:** In-memory `Map<string, Room>` in `lib/room-store.ts` acts as the data layer. A Next.js Server Action in `guide/create/actions.ts` validates input, creates the room, and calls `redirect()`. The create page becomes a Client Component so the form can call the Server Action and show a loading state. The guide room page reads the room title from the store.

**Tech Stack:** Next.js 16 App Router, TypeScript, `uuid` (already installed), no test framework — verify with `tsc --noEmit` + manual dev-server smoke test.

---

### Task 1: Create `lib/room-store.ts`

**Files:**
- Create: `apps/web/src/lib/room-store.ts`

**Step 1: Write the file**

```ts
import { v4 as uuidv4 } from 'uuid';

export type RoomStatus = 'active' | 'ended' | 'expired';

export type Room = {
  id: string;
  title: string;
  guideName?: string;
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

const rooms = new Map<string, Room>();

export function createRoom(input: CreateRoomInput): Room {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.durationHours * 60 * 60 * 1000);

  const room: Room = {
    id,
    title: input.title,
    guideName: input.guideName || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    livekitRoomName: id,
  };

  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function endRoom(id: string): void {
  const room = rooms.get(id);
  if (room) {
    rooms.set(id, { ...room, status: 'ended' });
  }
}
```

**Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors related to `room-store.ts`.

**Step 3: Commit**

```bash
git add apps/web/src/lib/room-store.ts
git commit -m "feat: add Room type and in-memory room store"
```

---

### Task 2: Create `guide/create/actions.ts`

**Files:**
- Create: `apps/web/src/app/guide/create/actions.ts`

**Step 1: Write the file**

```ts
'use server';

import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/room-store';

const DURATION_MAP: Record<string, number> = {
  '1h': 1,
  '3h': 3,
  'half-day': 4,
};

export type CreateRoomState = {
  error?: string;
};

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const duration = (formData.get('duration') as string | null) ?? '3h';
  const guideName = (formData.get('guideName') as string | null)?.trim() || undefined;

  if (!title) {
    return { error: 'Room title is required.' };
  }

  const durationHours = DURATION_MAP[duration] ?? 3;
  const room = createRoom({ title, guideName, durationHours });

  redirect(`/guide/room/${room.id}`);
}
```

**Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/app/guide/create/actions.ts
git commit -m "feat: add createRoomAction Server Action"
```

---

### Task 3: Wire form in `guide/create/page.tsx`

**Files:**
- Modify: `apps/web/src/app/guide/create/page.tsx`

**Step 1: Replace the file contents**

```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createRoomAction, type CreateRoomState } from './actions';

const initialState: CreateRoomState = {};

export default function CreateRoomPage() {
  const [state, action, isPending] = useActionState(createRoomAction, initialState);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-medium text-slate-500">← Back</Link>
        <h1 className="mt-6 text-3xl font-bold">Create a GuideRoom</h1>
        <p className="mt-3 text-slate-600">
          Fill in the details below, then share the QR code with your visitors.
        </p>

        <form action={action} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Room title</span>
            <input
              name="title"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Basel Old Town Tour"
            />
          </label>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Duration</span>
            <select name="duration" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" defaultValue="3h">
              <option value="1h">1 hour</option>
              <option value="3h">3 hours</option>
              <option value="half-day">Half day (4 hours)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Guide name (optional)</span>
            <input
              name="guideName"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Tao"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create room'}
          </button>
        </form>
      </section>
    </main>
  );
}
```

**Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/app/guide/create/page.tsx
git commit -m "feat: wire create-room form to Server Action"
```

---

### Task 4: Show room title in `guide/room/[roomId]/page.tsx`

**Files:**
- Modify: `apps/web/src/app/guide/room/[roomId]/page.tsx`

**Step 1: Update the page to read from store**

Replace the file:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/room-store';

type GuideRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function GuideRoomPage({ params }: GuideRoomPageProps) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room) {
    notFound();
  }

  const listenUrl = `/listen/${roomId}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <Link href="/guide/create" className="text-sm font-medium text-slate-500">← Create another room</Link>
          <h1 className="mt-6 text-3xl font-bold">{room.title}</h1>
          {room.guideName && (
            <p className="mt-1 text-slate-500">Guide: {room.guideName}</p>
          )}
          <p className="mt-1 text-sm text-slate-400">Room ID: {roomId}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Status</p>
              <p className="mt-2 font-semibold capitalize">{room.status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Listeners</p>
              <p className="mt-2 font-semibold">0 connected</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Microphone</p>
              <p className="mt-2 font-semibold">Not connected</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Start speaking</button>
            <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Stop speaking</button>
            <button className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">End room</button>
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
            QR placeholder
          </div>
          <p className="mt-5 text-sm text-slate-600">Listener link</p>
          <Link href={listenUrl} className="mt-2 block break-all text-sm font-semibold text-slate-950">
            {listenUrl}
          </Link>
        </aside>
      </section>
    </main>
  );
}
```

**Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/app/guide/room/\[roomId\]/page.tsx
git commit -m "feat: show real room title and guide name on guide room page"
```

---

### Task 5: Smoke test

**Step 1: Start dev server**

```bash
cd apps/web && npm run dev
```

**Step 2: Verify the flow**

1. Open `http://localhost:3000/guide/create`
2. Submit with empty title → error message appears, no redirect
3. Fill in title "Basel Old Town Tour", submit → URL changes to `/guide/room/<uuid>`
4. Page shows "Basel Old Town Tour" as the heading
5. Open `http://localhost:3000/guide/room/nonexistent` → 404 page

**Step 3: Push**

```bash
git push
```
