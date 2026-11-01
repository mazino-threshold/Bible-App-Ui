import { api } from './client';

/** Tells the server to send reminders to this device. Safe to call again with the same token. */
export function registerPushToken(token: string) {
  return api<void>('/me/push-tokens', { method: 'POST', body: { token } });
}

export function removePushToken(token: string) {
  return api<void>('/me/push-tokens', { method: 'DELETE', body: { token } });
}
