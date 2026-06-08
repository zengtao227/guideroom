# GuideRoom Architecture

## Recommended MVP stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- LiveKit for real-time audio rooms
- QR code generation with an npm package such as `qrcode`

## Why LiveKit for stage 1

The product risk is whether guides and visitors want this workflow. The biggest technical risk is real-time one-to-many browser audio.

Using LiveKit helps avoid spending too much time on low-level WebRTC signaling, NAT traversal, reconnection, and multi-listener audio distribution.

## High-level flow

1. Guide creates a GuideRoom room in the web app.
2. App creates or references a matching LiveKit room.
3. App generates a listener URL.
4. QR code displays the listener URL.
5. Guide joins as publisher.
6. Listener joins as subscriber.
7. Guide microphone audio is published into the LiveKit room.
8. Listeners subscribe to the audio track.
9. When the guide ends the session, the room is marked as ended.

## Proposed routes

```text
/
/guide/create
/guide/room/[roomId]
/listen/[roomId]
```

## Proposed data model

```ts
type Room = {
  id: string;
  title: string;
  guideName?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'ended' | 'expired';
  livekitRoomName: string;
};
```

## Environment variables

```text
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
NEXT_PUBLIC_APP_URL=
```

## Later-stage services

Stage 2:

- Stripe Checkout
- database persistence
- guide sessions and usage history

Stage 3:

- speech-to-text
- translation
- text-to-speech
- multilingual listener channels

Stage 4:

- organization accounts
- usage reporting
- invoices
- branding
