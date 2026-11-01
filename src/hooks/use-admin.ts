import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWeek, getWeeklyReport, listWeeks, saveWeek } from '@/api/admin';
import type { ReportFilters, SaveWeekInput } from '@/api/types';

export function useScheduledWeeks() {
  return useQuery({ queryKey: ['admin', 'weeks'], queryFn: listWeeks });
}

export function useWeekSchedule(weekStart: string) {
  return useQuery({ queryKey: ['schedule', weekStart], queryFn: () => getWeek(weekStart) });
}

export function useSaveWeek(weekStart: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWeekInput) => saveWeek(weekStart, input),
    onSuccess: (week) => {
      client.setQueryData(['schedule', weekStart], week);
      // Members' week views and the weeks list now show the new readings
      client.invalidateQueries({ queryKey: ['admin', 'weeks'] });
      client.invalidateQueries({ queryKey: ['my-week'] });
      client.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
}

/** null = the current week. */
export function useWeeklyReport(weekStart: string | null, filters: ReportFilters) {
  return useQuery({
    queryKey: ['admin', 'report', weekStart ?? 'current', filters],
    queryFn: () => getWeeklyReport(weekStart, filters),
    placeholderData: keepPreviousData,
  });
}
