'use server';

import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/room-store';

const DURATION_MAP: Record<string, number> = {
  '1h': 1,
  '4h': 4,
};

export type CreateRoomState = {
  error?: string;
};

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const title = (formData.get('title') as string | null)?.trim() || 'GuideRoom session';
  const duration = (formData.get('duration') as string | null) ?? '';
  const guideName = (formData.get('guideName') as string | null)?.trim() || undefined;

  const durationHours = DURATION_MAP[duration];

  if (!durationHours) {
    return { error: 'Please choose a session duration.' };
  }

  const room = createRoom({ title, guideName, durationHours });

  redirect(`/guide/room/${room.id}`);
}
