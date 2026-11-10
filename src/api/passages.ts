import { api } from './client';
import type { DayPassage } from './types';

/**
 * Today's reading in full (every chapter). Today is decided by the server.
 * 404: Sunday or nothing scheduled. 422: the reading couldn't be understood. 503: YouVersion is down.
 */
export async function getTodayPassage() {
  return (await api<{ passage: DayPassage }>('/passages/today')).passage;
}
