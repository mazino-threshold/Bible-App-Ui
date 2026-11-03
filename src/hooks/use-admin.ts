import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deactivateUser, getWeek, getWeeklyReport, listUsers, listWeeks, reactivateUser, saveWeek } from '@/api/admin';
import type { ReportFilters, SaveWeekInput, UserStatusFilter } from '@/api/types';

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

export function useUsers(status: UserStatusFilter) {
  return useQuery({
    queryKey: ['admin', 'users', status],
    queryFn: () => listUsers(status),
    placeholderData: keepPreviousData,
  });
}

export function useSetUserActive() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active, reason }: { id: string; active: boolean; reason?: string }) =>
      active ? reactivateUser(id, reason) : deactivateUser(id, reason),
    onSuccess: () => {
      // The member moves between the Active and Deactivated lists, and reports show who is active
      client.invalidateQueries({ queryKey: ['admin', 'users'] });
      client.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
}
