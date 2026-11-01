/** Shapes returned by the Bible App API (see the backend's *.types.ts files). */

export type Role = 'user' | 'admin';
export type ReminderFrequency = 'high' | 'mid' | 'low' | 'off';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  reminderFrequency: ReminderFrequency;
  createdAt: string;
}

export interface SignInResult {
  token: string;
  user: User;
}

export interface MessageResult {
  message: string;
}
