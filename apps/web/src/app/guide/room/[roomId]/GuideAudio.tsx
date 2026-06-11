'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import { ConnectionState, MediaDeviceFailure } from 'livekit-client';
import { endRoomAction } from './actions';
import { useTranslation } from '@/contexts/LanguageContext';

type GuideAudioProps = {
  roomId: string;
  wsUrl: string;
};

type MicPermissionState = PermissionState | 'unsupported' | 'unknown';
type GuideRoomTranslations = ReturnType<typeof useTranslation>['t']['guideRoom'];

function explainMicStartupError(error: unknown, guideRoom: GuideRoomTranslations): string | null {
  const errorName = error instanceof Error ? error.name : '';
  const errorMessage = error instanceof Error ? error.message : String(error ?? '');
  const normalizedError = `${errorName} ${errorMessage}`.toLowerCase();

  if (normalizedError.includes('permission') || normalizedError.includes('notallowed')) {
    return guideRoom.micPermissionDenied;
  }

  if (normalizedError.includes('notfound') || normalizedError.includes('devicesnotfound')) {
    return guideRoom.micNotFound;
  }

  if (
    normalizedError.includes('notreadable') ||
    normalizedError.includes('trackstart') ||
    normalizedError.includes('deviceinuse') ||
    normalizedError.includes('in use')
  ) {
    return guideRoom.micNotReadable;
  }

  return null;
}

function GuideControls({ roomId, startupMicError }: { roomId: string; startupMicError: string | null }) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(startupMicError);
  const [micPermissionState, setMicPermissionState] = useState<MicPermissionState>('unknown');
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const { t } = useTranslation();
  const { guideRoom: g } = t;

  const isConnected = connectionState === ConnectionState.Connected;
  const listenerCount = participants.filter((p) => !p.isLocal).length;

  useEffect(() => {
    setMicError(startupMicError);
  }, [startupMicError]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.isSecureContext) {
      setMicError(g.micInsecureContext);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(g.micUnsupportedBrowser);
      return;
    }

    if (!navigator.permissions?.query) {
      setMicPermissionState('unsupported');
      return;
    }

    let isMounted = true;

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        if (!isMounted) return;
        permissionStatusRef.current = status;
        setMicPermissionState(status.state);
        status.onchange = () => setMicPermissionState(status.state);
      })
      .catch(() => {
        if (isMounted) setMicPermissionState('unsupported');
      });

    return () => {
      isMounted = false;
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
    };
  }, [g.micInsecureContext, g.micUnsupportedBrowser]);

  function explainMicError(error: unknown): string {
    const name = error instanceof Error ? error.name : String(error ?? '');

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return g.micPermissionDenied;
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return g.micNotFound;
    }

    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return g.micNotReadable;
    }

    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return g.micAccessFailed;
    }

    return g.micAccessFailed;
  }

  function permissionLabel(): string {
    if (micPermissionState === 'granted') return g.micPermissionGranted;
    if (micPermissionState === 'prompt') return g.micPermissionPrompt;
    if (micPermissionState === 'denied') return g.micPermissionDenied;
    if (micPermissionState === 'unsupported') return g.micPermissionUnsupported;
    return g.micPermissionUnknown;
  }

  async function toggleMic() {
    setIsRequestingMic(true);
    setMicError(null);

    try {
      if (!isMicrophoneEnabled && typeof window !== 'undefined') {
        if (!window.isSecureContext) {
          throw new DOMException(g.micInsecureContext, 'NotAllowedError');
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException(g.micUnsupportedBrowser, 'NotFoundError');
        }
      }

      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      setMicError(explainMicError(error));
    } finally {
      setIsRequestingMic(false);
    }
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
          <p className="mt-1 text-xs text-slate-500">{permissionLabel()}</p>
        </div>
      </div>

      {micError && (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm leading-6 text-red-700 ring-1 ring-red-200">
          <p className="font-semibold">{micError}</p>
          <p className="mt-2">{g.micEnableHelp}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={toggleMic}
          disabled={!isConnected || isRequestingMic}
          className={`w-full rounded-full px-5 py-4 text-sm font-semibold disabled:opacity-40 ${
            isMicrophoneEnabled
              ? 'bg-slate-950 text-white'
              : 'bg-slate-200 text-slate-800'
          }`}
        >
          {isRequestingMic
            ? g.micRequesting
            : isMicrophoneEnabled
              ? g.stopSpeaking
              : g.startSpeaking}
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
  const [startupMicError, setStartupMicError] = useState<string | null>(null);
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
      audio
      video={false}
      onError={(liveKitError) => {
        const micStartupError = explainMicStartupError(liveKitError, g);

        if (micStartupError) {
          setStartupMicError(micStartupError);
          return;
        }

        setError(liveKitError.message || g.failedToConnect);
      }}
      onMediaDeviceFailure={(failure, kind) => {
        if (!kind || kind === 'audioinput') {
          if (failure === MediaDeviceFailure.PermissionDenied) {
            setStartupMicError(g.micPermissionDenied);
          } else if (failure === MediaDeviceFailure.NotFound) {
            setStartupMicError(g.micNotFound);
          } else if (failure === MediaDeviceFailure.DeviceInUse) {
            setStartupMicError(g.micNotReadable);
          } else {
            setStartupMicError(g.micAccessFailed);
          }
        }
      }}
    >
      <GuideControls roomId={roomId} startupMicError={startupMicError} />
    </LiveKitRoom>
  );
}
