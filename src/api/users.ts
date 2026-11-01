import { api } from './client';
import type { ReminderFrequency, User } from './types';

export async function updateMe(input: { name?: string; phone?: string; reminderFrequency?: ReminderFrequency }) {
  return (await api<{ user: User }>('/me', { method: 'PATCH', body: input })).user;
}
