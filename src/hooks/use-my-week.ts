import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkInToday, getMyWeek, undoCheckInToday } from '@/api/checkins';
import type { MyWeek } from '@/api/types';

const CURRENT = 'current';

/** null = the current week (the server decides which that is). */
export function useMyWeek(weekStart: string | null) {
  return useQuery({
    queryKey: ['my-week', weekStart ?? CURRENT],
    queryFn: () => getMyWeek(weekStart ?? undefined),
    placeholderData: (previous) => previous,
  });
}

/** Marks today as read (or not), updating the screen straight away and undoing that if the server refuses. */
export function useToggleToday() {
  const client = useQueryClient();
  const key = ['my-week', CURRENT];

  return useMutation({
    mutationFn: (read: boolean) => (read ? checkInToday() : undoCheckInToday()),
    onMutate: async (read) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<MyWeek>(key);
      if (previous) client.setQueryData(key, withToday(previous, read));
      return { previous };
    },
    onError: (_err, _read, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSuccess: (result) => {
      client.setQueryData<MyWeek>(key, (week) => week && { ...withToday(week, result.checkedIn), streak: result.streak });
    },
    // The same week may also be cached under its Monday (browsing back and forth)
    onSettled: () => client.invalidateQueries({ queryKey: ['my-week'], refetchType: 'none' }),
  });
}

function withToday(week: MyWeek, read: boolean): MyWeek {
  let daysRead = week.daysRead;
  const days = week.days.map((day) => {
    if (day.date !== week.today || !day.canToggle) return day;
    const wasRead = day.status === 'read';
    if (wasRead !== read) daysRead += read ? 1 : -1;
    return { ...day, status: read ? ('read' as const) : ('pending' as const) };
  });
  return { ...week, days, daysRead };
}
