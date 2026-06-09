import { AccessToken } from 'livekit-server-sdk';
import { NextRequest } from 'next/server';
import { getRemainingRoomSeconds, getRoom } from '@/lib/room-store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const roomId = searchParams.get('roomId');
  const role = searchParams.get('role') as 'guide' | 'listener' | null;

  if (!roomId || !role) {
    return Response.json({ error: 'roomId and role are required' }, { status: 400 });
  }

  const room = getRoom(roomId);
  const remainingSeconds = getRemainingRoomSeconds(roomId);

  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.status !== 'active' || !remainingSeconds) {
    return Response.json({ error: 'Room is no longer active' }, { status: 410 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `${role}-${Date.now()}`,
    name: role === 'guide' ? 'Guide' : 'Visitor',
    ttl: Math.max(60, remainingSeconds),
  });

  at.addGrant({
    room: roomId,
    roomJoin: true,
    canPublish: role === 'guide',
    canSubscribe: role === 'listener',
  });

  const token = await at.toJwt();
  return Response.json({ token, expiresIn: remainingSeconds });
}
