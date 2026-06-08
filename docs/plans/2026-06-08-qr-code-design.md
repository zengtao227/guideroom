# QR Code Generation Design

Date: 2026-06-08
Issue: #3 — Generate real QR code for listener link

## Goal

Replace the QR placeholder on the guide room page with a real scannable QR code that encodes the listener URL.

## URL Strategy

`NEXT_PUBLIC_APP_URL` environment variable controls the base URL:

| Context | Value |
|---------|-------|
| Local WiFi phone test | `http://192.168.x.x:3000` |
| Production | `https://zengsg.dpdns.org` |
| Fallback (unset) | `http://localhost:3000` |

Listener URL format: `${NEXT_PUBLIC_APP_URL}/listen/${roomId}`

## Implementation

Server-side SVG generation using the `qrcode` npm package (already installed).
`QRCode.toString(url, { type: 'svg' })` produces an SVG string which is
base64-encoded and embedded as `<img src="data:image/svg+xml;base64,...">`.
No client-side JS required — runs in the existing Server Component.

## Files

- Create: `apps/web/src/lib/qr.ts` — `generateQrDataUrl(text: string): Promise<string>`
- Modify: `apps/web/src/app/guide/room/[roomId]/page.tsx` — replace QR placeholder with `<img>`
- Modify: `apps/web/.env.example` — add `NEXT_PUBLIC_APP_URL` with comment

## Out of Scope

- Custom QR logo/branding (Stage 4)
- QR color theming
- Download QR button
