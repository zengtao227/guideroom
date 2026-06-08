'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';

type GuideAudioProps = {
  roomId: string;
  wsUrl: string;
};

function GuideControls() {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();

  const isConnected = connectionState === ConnectionState.Connected;
  const listenerCount = participants.filter((p) => !p.isLocal).length;

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">Status</p>
          <p className="mt-2 font-semibold capitalize">
            {isConnected ? 'Active' : connectionState}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">Listeners</p>
          <p className="mt-2 font-semibold">{listenerCount} connected</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">Microphone</p>
          <p className="mt-2 font-semibold">
            {isMicrophoneEnabled ? 'On' : 'Off'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40 ${
            isMicrophoneEnabled
              ? 'bg-slate-950 text-white'
              : 'bg-slate-200 text-slate-800'
          }`}
        >
          {isMicrophoneEnabled ? 'Stop speaking' : 'Start speaking'}
        </button>
        <button
          disabled
          className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 opacity-40"
          title="End room — coming in Issue #5"
        >
          End room
        </button>
      </div>
    </>
  );
}

export function GuideAudio({ roomId, wsUrl }: GuideAudioProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/livekit-token?roomId=${encodeURIComponent(roomId)}&role=guide`)
      .then((r) => r.json())
      .then((data: { token?: string; error?: string }) => {
        if (data.token) setToken(data.token);
        else setError(data.error ?? 'Failed to get token');
      })
      .catch(() => setError('Failed to connect to room'));
  }, [roomId]);

  if (error) {
    return <p className="mt-8 text-sm text-red-600">{error}</p>;
  }

  if (!token) {
    return <p className="mt-8 text-sm text-slate-400">Connecting to room…</p>;
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect
      audio={false}
      video={false}
    >
      <GuideControls />
    </LiveKitRoom>
  );
}
