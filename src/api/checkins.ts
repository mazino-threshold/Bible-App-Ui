import { api } from './client';
import type { MyWeek, TodayCheckIn } from './types';

/** The current week, or the week starting on the given Monday ('YYYY-MM-DD'). */
export async function getMyWeek(weekStart?: string) {
  const path = weekStart ? `/check-ins/weeks/${weekStart}` : '/check-ins/week';
  return (await api<{ week: MyWeek }>(path)).week;
}

export function checkInToday() {
  return api<TodayCheckIn>('/check-ins/today', { method: 'POST' });
}

export function undoCheckInToday() {
  return api<TodayCheckIn>('/check-ins/today', { method: 'DELETE' });
}
