'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { endRoomAction } from './actions';
import { useTranslation } from '@/contexts/LanguageContext';

type GuideAudioProps = {
  roomId: string;
  wsUrl: string;
};

function GuideControls({ roomId }: { roomId: string }) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);
  const { t } = useTranslation();
  const { guideRoom: g } = t;

  const isConnected = connectionState === ConnectionState.Connected;
  const listenerCount = participants.filter((p) => !p.isLocal).length;

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  async function handleEndRoom() {
    setIsEnding(true);
    await endRoomAction(roomId);
    router.push('/guide/create');
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">{g.status}</p>
          <p className="mt-2 font-semibold">
            {isConnected ? g.statusActive : connectionState}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">{g.listeners}</p>
          <p className="mt-2 font-semibold">{listenerCount} {g.listenersConnected}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs uppercase text-slate-500">{g.microphone}</p>
          <p className="mt-2 font-semibold">
            {isMicrophoneEnabled ? g.micOn : g.micOff}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`w-full rounded-full px-5 py-4 text-sm font-semibold disabled:opacity-40 ${
            isMicrophoneEnabled
              ? 'bg-slate-950 text-white'
              : 'bg-slate-200 text-slate-800'
          }`}
        >
          {isMicrophoneEnabled ? g.stopSpeaking : g.startSpeaking}
        </button>
        <button
          onClick={handleEndRoom}
          disabled={isEnding}
          className="w-full rounded-full border border-red-200 px-5 py-4 text-sm font-semibold text-red-700 disabled:opacity-40"
        >
          {isEnding ? g.ending : g.endRoom}
        </button>
      </div>
    </>
  );
}

export function GuideAudio({ roomId, wsUrl }: GuideAudioProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { guideRoom: g } = t;

  useEffect(() => {
    fetch(`/api/livekit-token?roomId=${encodeURIComponent(roomId)}&role=guide`)
      .then((r) => r.json())
      .then((data: { token?: string; error?: string }) => {
        if (data.token) setToken(data.token);
        else setError(data.error ?? g.failedToConnect);
      })
      .catch(() => setError(g.failedToConnect));
  }, [roomId, g.failedToConnect]);

  if (error) {
    return <p className="mt-8 text-sm text-red-600">{error}</p>;
  }

  if (!token) {
    return <p className="mt-8 text-sm text-slate-400">{g.connectingToRoom}</p>;
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect
      audio={false}
      video={false}
    >
      <GuideControls roomId={roomId} />
    </LiveKitRoom>
  );
}
