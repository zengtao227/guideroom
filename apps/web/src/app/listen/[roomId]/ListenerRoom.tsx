'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useRemoteParticipants,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useTranslation } from '@/contexts/LanguageContext';

type ListenerRoomProps = {
  roomId: string;
  wsUrl: string;
  roomTitle: string;
  guideName?: string;
};

const GUIDE_GONE_DELAY_MS = 30_000;

function ActiveListener() {
  const connectionState = useConnectionState();
  const remoteParticipants = useRemoteParticipants();
  const { t } = useTranslation();
  const { listenerRoom: l } = t;
  const [guideGone, setGuideGone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isConnected = connectionState === ConnectionState.Connected;
    const noGuide = remoteParticipants.length === 0;

    if (isConnected && noGuide) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => setGuideGone(true), GUIDE_GONE_DELAY_MS);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setGuideGone(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connectionState, remoteParticipants.length]);

  if (connectionState === ConnectionState.Disconnected) {
    return (
      <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
        <p className="font-semibold">{l.roomEnded}</p>
        <p className="mt-2 text-sm text-slate-300">{l.guideClosedSession}</p>
      </div>
    );
  }

  if (guideGone) {
    return (
      <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
        <p className="font-semibold">{l.roomEnded}</p>
        <p className="mt-2 text-sm text-slate-300">{l.guideLeft}</p>
      </div>
    );
  }

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
            {isConnected ? l.connectedLive : l.connecting}
          </p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">{l.audioPlaying}</p>
      </div>
    </>
  );
}

export function ListenerRoom({ roomId, wsUrl, roomTitle, guideName }: ListenerRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { listenerRoom: l } = t;

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-3xl bg-white/10 p-8 shadow-sm ring-1 ring-white/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          {l.tag}
        </p>
        <h1 className="mt-5 text-3xl font-bold">{roomTitle}</h1>
        {guideName && (
          <p className="mt-1 text-slate-300">
            {l.guide} {guideName}
          </p>
        )}

        {error && (
          <div className="mt-8">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                handleStart();
              }}
              className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              {l.retry}
            </button>
          </div>
        )}

        {!error && !token && (
          <>
            <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
              <p className="font-semibold">{l.putOnEarphones}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{l.tapToJoin}</p>
            </div>
            <button
              onClick={handleStart}
              className="mt-8 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950"
            >
              {l.startListening}
            </button>
          </>
        )}

        {!error && token && (
          <LiveKitRoom
            serverUrl={wsUrl}
            token={token}
            connect
            audio={false}
            video={false}
          >
            <ActiveListener />
          </LiveKitRoom>
        )}
      </section>
    </main>
  );
}
