'use server';

import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/room-store';

const DURATION_MAP: Record<string, number> = {
  '1h': 1,
  '3h': 3,
  'half-day': 4,
};

export type CreateRoomState = {
  error?: string;
};

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const duration = (formData.get('duration') as string | null) ?? '3h';
  const guideName = (formData.get('guideName') as string | null)?.trim() || undefined;

  if (!title) {
    return { error: 'Room title is required.' };
  }

  const durationHours = DURATION_MAP[duration] ?? 3;
  const room = createRoom({ title, guideName, durationHours });

  redirect(`/guide/room/${room.id}`);
}
