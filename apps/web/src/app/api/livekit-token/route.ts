import { AccessToken } from 'livekit-server-sdk';
import { NextRequest } from 'next/server';
import { getRemainingRoomSeconds, getRoomByListenerToken, getRoomForGuide, Room } from '@/lib/room-store';

export const runtime = 'nodejs';

function getRoomForRole(req: NextRequest, role: string | null): Room | undefined {
  const { searchParams } = req.nextUrl;

  if (role === 'guide') {
    const roomId = searchParams.get('roomId') ?? '';
    const guideToken = searchParams.get('guideToken') ?? '';
    return getRoomForGuide(roomId, guideToken);
  }

  if (role === 'listener') {
    const listenerToken = searchParams.get('listenerToken') ?? '';
    return getRoomByListenerToken(listenerToken);
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');

  if (role !== 'guide' && role !== 'listener') {
    return Response.json({ error: 'valid role is required' }, { status: 400 });
  }

  const room = getRoomForRole(req, role);

  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 });
  }

  const remainingSeconds = getRemainingRoomSeconds(room.id);

  if (room.status !== 'active' || !remainingSeconds) {
    return Response.json({ error: 'Room is no longer active' }, { status: 410 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `${role}-${crypto.randomUUID()}`,
    name: role === 'guide' ? 'Guide' : 'Visitor',
    ttl: Math.max(60, remainingSeconds),
  });

  at.addGrant({
    room: room.livekitRoomName,
    roomJoin: true,
    canPublish: role === 'guide',
    canSubscribe: role === 'listener',
  });

  const token = await at.toJwt();
  return Response.json({ token, expiresIn: remainingSeconds });
}
