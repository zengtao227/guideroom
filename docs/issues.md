# Suggested GitHub Issues

Create these issues in `zengtao227/guideroom`.

## 1. Initialize and verify Next.js web app

Make sure the `apps/web` Next.js app can run locally.

Tasks:

- [ ] Install dependencies
- [ ] Run the development server
- [ ] Verify `/` loads
- [ ] Verify `/guide/create` loads
- [ ] Verify `/guide/room/demo-room` loads
- [ ] Verify `/listen/demo-room` loads
- [ ] Fix any missing generated files or config issues

## 2. Create room data model and room creation action

Tasks:

- [ ] Define Room type
- [ ] Generate unique room IDs
- [ ] Store room title, guide name, creation time, expiry time, status
- [ ] Redirect guide to `/guide/room/[roomId]` after creation

## 3. Generate real QR code for listener link

Tasks:

- [ ] Add QR code component
- [ ] Generate QR from `NEXT_PUBLIC_APP_URL + /listen/[roomId]`
- [ ] Show text listener link under QR code
- [ ] Test QR scanning from another phone

## 4. Integrate LiveKit audio room

Tasks:

- [ ] Create LiveKit token endpoint
- [ ] Guide joins as publisher
- [ ] Listener joins as subscriber
- [ ] Publish microphone audio from guide
- [ ] Play audio on listener page after user taps Start Listening

## 5. Add listener count and room state

Tasks:

- [ ] Show connected listener count on guide page
- [ ] Show connection status on listener page
- [ ] Add end room action
- [ ] Prevent joining ended or expired rooms

## 6. Mobile test with 5 phones

Tasks:

- [ ] Test iPhone Safari
- [ ] Test Android Chrome
- [ ] Test Bluetooth earphones
- [ ] Test mobile network
- [ ] Test Wi-Fi
- [ ] Record delay and connection issues
