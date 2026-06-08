# Room Creation Design

Date: 2026-06-08
Issue: #2 — Create room data model and room creation action

## Goal

When a guide fills in the create-room form and submits, the app generates a unique room ID, stores the room in server memory, and redirects the guide to `/guide/room/[roomId]`.

## Data Model

```ts
type RoomStatus = 'active' | 'ended' | 'expired';

type Room = {
  id: string;
  title: string;
  guideName?: string;
  createdAt: string;   // ISO 8601
  expiresAt: string;   // ISO 8601
  status: RoomStatus;
  livekitRoomName: string;
};
```

`livekitRoomName` mirrors `id` for now. It becomes relevant in Issue #4 when LiveKit is integrated.

Duration options map to expiry offsets:

| Form value | Expiry offset |
|------------|---------------|
| `1h`       | +1 hour       |
| `3h`       | +3 hours      |
| `half-day` | +4 hours      |

## Storage

A module-level `Map<string, Room>` in `apps/web/src/lib/room-store.ts`.

```ts
// apps/web/src/lib/room-store.ts
const rooms = new Map<string, Room>();

export function createRoom(data: CreateRoomInput): Room { ... }
export function getRoom(id: string): Room | undefined { ... }
export function endRoom(id: string): void { ... }
```

Data lives in the Next.js server process. Rooms are lost on server restart, which is acceptable for the MVP stage. The database migration path in Stage 2 only requires changing this file — callers stay the same.

## Server Action

A Server Action in `apps/web/src/app/guide/create/actions.ts` handles form submission:

1. Parse and validate form fields (title, duration, guideName).
2. Call `createRoom(...)` from `room-store`.
3. Call `redirect('/guide/room/' + room.id)`.

No API route is needed. The Server Action runs on the server and redirects directly.

## Form Wiring

`/guide/create/page.tsx` becomes a Client Component so the form can call the Server Action via `useActionState` or a plain `action={...}` attribute. A basic loading state (button disabled while submitting) is sufficient for MVP.

## File Plan

```
apps/web/src/
  lib/
    room-store.ts        ← Room type + in-memory store
  app/
    guide/
      create/
        actions.ts       ← Server Action: createRoom + redirect
        page.tsx         ← wire form to action
      room/
        [roomId]/
          page.tsx       ← read room from store, display title
```

## Out of Scope for Issue #2

- Room expiry enforcement (rooms stay active even after `expiresAt` for now)
- End-room action (Issue #5)
- QR code generation (Issue #3)
- LiveKit integration (Issue #4)
- Listener count (Issue #5)

## Acceptance Criteria

- [ ] Guide fills in title (required), duration, optional name and submits.
- [ ] URL changes to `/guide/room/<uuid>`.
- [ ] Guide room page shows the room title.
- [ ] Submitting an empty title shows a validation message, does not redirect.
