import { api } from './client';
import type { AccountDeletion, User } from './types';

export async function updateMe(input: { name?: string; phone?: string; remindersEnabled?: boolean }) {
  return (await api<{ user: User }>('/me', { method: 'PATCH', body: input })).user;
}

/** Deletes the signed-in user's account. Their token stops working straight away, on every device. */
export async function deleteMe(reason?: string) {
  return (await api<{ deletion: AccountDeletion }>('/me', { method: 'DELETE', body: { reason } })).deletion;
}
