# GuideRoom MVP Requirements

## Goal

The first MVP should prove one thing:

> A guide can create a temporary live audio room, show a QR code, and visitors can scan the code to listen with their own phones.

## User roles

### Guide

The guide should be able to:

- create a temporary room
- allow microphone access
- see a QR code and shareable listener link
- start and stop speaking
- see the number of connected listeners
- end the room

### Listener

The listener should be able to:

- scan the QR code
- open the listener page in a mobile browser
- tap a button to start listening
- listen with their own earphones
- see room status and connection status

Listeners should not need to register or install an app.

## Core pages

### Home page `/`

Content:

- product name and one-line value proposition
- simple three-step explanation
- button to create a room

### Create room page `/guide/create`

Fields:

- room title
- duration
- optional guide name

Action:

- create room

### Guide room page `/guide/room/[roomId]`

Content:

- QR code
- listener link
- room title
- current listener count
- microphone status
- start speaking button
- stop speaking button
- end room button

### Listener page `/listen/[roomId]`

Content:

- room title
- connection status
- headphone reminder
- start listening button
- room ended message

## Room rules

- Each room has a unique `roomId`.
- Each room has a creation time.
- Each room has an expiry time.
- A room can be active or ended.
- Expired or ended rooms should not accept new listeners.

## Real-time audio requirements

- Guide publishes microphone audio.
- Listeners subscribe to the room audio.
- Audio should be optimized for speech.
- Target delay: below 1 second.
- Ideal delay: below 500 ms.
- MVP test target: 5 to 10 listeners.

## Mobile requirements

Must test:

- iPhone Safari
- Android Chrome
- Bluetooth earphones
- wired earphones if available
- mobile network
- Wi-Fi
- screen lock behavior
- switching away from browser and returning

## Out of scope for stage 1

- AI translation
- subtitles
- payments
- guide account management
- organization dashboard
- native iOS app
- native Android app
- offline local network mode
- recording
- replay
- multiple guides speaking in the same room

## Acceptance checklist

- [ ] Guide can create a room.
- [ ] QR code is generated.
- [ ] Listener can scan and open the listener page.
- [ ] Listener can start listening after a user gesture.
- [ ] Guide can publish microphone audio.
- [ ] Listener can hear live audio.
- [ ] Listener count is visible.
- [ ] Guide can end the room.
- [ ] Ended room shows a clear message.
- [ ] Tested with at least 5 phones.
