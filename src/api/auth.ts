import { api } from './client';
import type { MessageResult, SignInResult, User } from './types';

export function register(input: { name: string; email: string; phone: string }) {
  return api<MessageResult>('/auth/register', { method: 'POST', body: input });
}

export function requestCode(email: string) {
  return api<MessageResult>('/auth/request-code', { method: 'POST', body: { email } });
}

export function verifyCode(email: string, code: string) {
  return api<SignInResult>('/auth/verify-code', { method: 'POST', body: { email, code } });
}

export function logout(pushToken?: string) {
  return api<void>('/auth/logout', { method: 'POST', body: pushToken ? { pushToken } : {} });
}

export async function getMe() {
  return (await api<{ user: User }>('/me')).user;
}
