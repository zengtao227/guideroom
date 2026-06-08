'use client';

import { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';

type ListenerRoomProps = {
  roomId: string;
  wsUrl: string;
};

function ActiveListener() {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  return (
    <>
      <RoomAudioRenderer />
      <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
          <p className="font-semibold">
            {isConnected ? 'Connected — listening live' : 'Connecting…'}
          </p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Audio is playing. Use your earphones for the best experience.
        </p>
      </div>
    </>
  );
}

export function ListenerRoom({ roomId, wsUrl }: ListenerRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    try {
      const res = await fetch(
        `/api/livekit-token?roomId=${encodeURIComponent(roomId)}&role=listener`,
      );
      const data: { token?: string; error?: string } = await res.json();
      if (data.token) {
        setToken(data.token);
      } else {
        setError(data.error ?? 'Failed to get token');
      }
    } catch {
      setError('Could not connect. Please try again.');
    }
  }

  if (error) {
    return (
      <div className="mt-8">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => { setError(null); handleStart(); }}
          className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <>
        <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
          <p className="font-semibold">Put on your earphones.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Tap the button below to join the live audio room.
          </p>
        </div>
        <button
          onClick={handleStart}
          className="mt-8 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950"
        >
          Start listening
        </button>
      </>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect
      audio={false}
      video={false}
    >
      <ActiveListener />
    </LiveKitRoom>
  );
}
