import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { getTodayPassage } from '@/api/passages';

/**
 * Today's Bible text. Keyed by the day and its passage (from the week), so it's fetched again
 * on a new day or if the admin changes today's reading. The text itself never changes, so it isn't refetched otherwise.
 */
export function useTodayPassage(today: string | undefined, passage: string | null | undefined) {
  return useQuery({
    queryKey: ['today-passage', today, passage],
    queryFn: getTodayPassage,
    enabled: Boolean(today && passage),
    staleTime: Infinity,
    // 404/422 won't fix themselves; a 503 (YouVersion busy) or lost connection is worth one more try
    retry: (failures, err) => failures < 1 && !(err instanceof ApiError && err.status >= 400 && err.status < 500),
  });
}
