'use server';

import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/room-store';

export type CreateRoomState = {
  error?: string;
};

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const duration = formData.get('duration');
  if (duration !== '1h' && duration !== '4h') {
    return { error: 'Please choose a session duration.' };
  }

  const title = formData.get('title');
  const guideName = formData.get('guideName');
  const room = createRoom({
    title: typeof title === 'string' ? title : '',
    guideName: typeof guideName === 'string' ? guideName : undefined,
    durationHours: duration === '4h' ? 4 : 1,
  });

  redirect(`/guide/room/${room.id}?guideToken=${encodeURIComponent(room.guideToken)}`);
}
