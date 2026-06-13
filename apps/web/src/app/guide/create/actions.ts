'use server';

import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/room-store';

const DURATION_MAP: Record<string, number> = {
  '1h': 1,
  '4h': 4,
};

const MAX_TITLE_LENGTH = 120;
const MAX_GUIDE_NAME_LENGTH = 80;

export type CreateRoomState = {
  error?: string;
};

function readBoundedFormString(formData: FormData, key: string, maxLength: number): string | undefined {
  const value = (formData.get(key) as string | null)?.trim().slice(0, maxLength);
  return value || undefined;
}

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const title = readBoundedFormString(formData, 'title', MAX_TITLE_LENGTH) || 'GuideRoom session';
  const duration = (formData.get('duration') as string | null) ?? '';
  const guideName = readBoundedFormString(formData, 'guideName', MAX_GUIDE_NAME_LENGTH);

  const durationHours = DURATION_MAP[duration];

  if (!durationHours) {
    return { error: 'Please choose a session duration.' };
  }

  const room = createRoom({ title, guideName, durationHours });

  redirect(`/guide/room/${room.id}?guideToken=${encodeURIComponent(room.guideToken)}`);
}
