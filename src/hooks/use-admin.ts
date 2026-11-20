import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkEmailDomain,
  deactivateUser,
  deleteUser,
  getWeek,
  getWeeklyReport,
  listDeletedUsers,
  listEmailDomainRules,
  listUsers,
  listWeeks,
  reactivateUser,
  removeEmailDomainRule,
  restoreDeletedUser,
  saveEmailDomainRule,
  saveWeek,
  setUserRole,
} from '@/api/admin';
import type { AdminUser, EmailDomainRule, ReportFilters, Role, SaveWeekInput, UserStatusFilter } from '@/api/types';

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

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => deleteUser(id, reason),
    onSuccess: (_deleted, { id }) => {
      // Take them off the lists straight away, then refresh everything they appeared in
      client.setQueriesData<AdminUser[]>({ queryKey: ['admin', 'users'] }, (users) => users?.filter((u) => u.id !== id));
      client.invalidateQueries({ queryKey: ['admin', 'users'] });
      client.invalidateQueries({ queryKey: ['admin', 'report'] });
      client.invalidateQueries({ queryKey: ['admin', 'deleted-users'] });
    },
  });
}

export function useDeletedUsers() {
  return useQuery({ queryKey: ['admin', 'deleted-users'], queryFn: listDeletedUsers });
}

export function useRestoreUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDeletedUser(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'deleted-users'] });
      client.invalidateQueries({ queryKey: ['admin', 'users'] });
      client.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
}

export function useSetUserRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => setUserRole(id, role),
    onSuccess: () => {
      // Lists and reports both show who is an admin
      client.invalidateQueries({ queryKey: ['admin', 'users'] });
      client.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
}

export function useEmailDomainRules() {
  return useQuery({ queryKey: ['admin', 'email-domains'], queryFn: listEmailDomainRules });
}

export function useSaveEmailDomainRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ domain, action, reason }: { domain: string; action: EmailDomainRule['action']; reason?: string }) =>
      saveEmailDomainRule(domain, action, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'email-domains'] }),
  });
}

export function useRemoveEmailDomainRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => removeEmailDomainRule(domain),
    onSuccess: (_result, domain) => {
      client.setQueryData<EmailDomainRule[]>(['admin', 'email-domains'], (rules) => rules?.filter((r) => r.domain !== domain));
      client.invalidateQueries({ queryKey: ['admin', 'email-domains'] });
    },
  });
}

/** A one-off check, so a mutation (run on button press) rather than a cached query. */
export function useCheckEmailDomain() {
  return useMutation({ mutationFn: (emailOrDomain: string) => checkEmailDomain(emailOrDomain) });
}
