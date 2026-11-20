import { api } from './client';
import type {
  AdminUser,
  DeletedUser,
  EmailDomainCheck,
  EmailDomainRule,
  Role,
  ReportFilters,
  SaveWeekInput,
  UserStatusFilter,
  Week,
  WeekSummary,
  WeeklyReport,
} from './types';

/** Any signed-in user can read a week's schedule; the admin editor uses it to load the form. */
export async function getWeek(weekStart: string) {
  return (await api<{ week: Week }>(`/schedule/weeks/${weekStart}`)).week;
}

/** Weeks with at least one reading, newest first. */
export async function listWeeks() {
  return (await api<{ weeks: WeekSummary[] }>('/admin/schedule/weeks')).weeks;
}

/** Creates or replaces all six days of a week. */
export async function saveWeek(weekStart: string, input: SaveWeekInput) {
  return (await api<{ week: Week }>(`/admin/schedule/weeks/${weekStart}`, { method: 'PUT', body: input })).week;
}

/** null = the current week. */
export async function getWeeklyReport(weekStart: string | null, filters: ReportFilters) {
  // Built by hand: React Native's URLSearchParams is incomplete on some versions
  const params: string[] = [];
  if (filters.minDays !== undefined) params.push(`minDays=${filters.minDays}`);
  if (filters.maxDays !== undefined) params.push(`maxDays=${filters.maxDays}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return (await api<{ report: WeeklyReport }>(`/admin/reports/weekly/${weekStart ?? 'current'}${query}`)).report;
}

/** Everyone, or only active / only deactivated members, by name. */
export async function listUsers(status: UserStatusFilter) {
  return (await api<{ users: AdminUser[] }>(`/admin/users?status=${status}`)).users;
}

/** Signs the member out everywhere and stops their sign-in and reminders. Safe to call twice. */
export async function deactivateUser(id: string, reason?: string) {
  return (await api<{ user: AdminUser }>(`/admin/users/${id}/deactivate`, { method: 'POST', body: { reason } })).user;
}

/** Lets a deactivated member sign in and get reminders again. Safe to call twice. */
export async function reactivateUser(id: string, reason?: string) {
  return (await api<{ user: AdminUser }>(`/admin/users/${id}/reactivate`, { method: 'POST', body: { reason } })).user;
}

/** Signs the member out and removes them from the app and all reports. Restorable for 30 days. */
export async function deleteUser(id: string, reason?: string) {
  return (await api<{ user: DeletedUser }>(`/admin/users/${id}`, { method: 'DELETE', body: { reason } })).user;
}

/** Deleted accounts that can still be restored, most recently deleted first. */
export async function listDeletedUsers() {
  return (await api<{ users: DeletedUser[] }>('/admin/deleted-users')).users;
}

/** Brings a deleted account back (deactivated if it was deactivated when deleted). They sign in again as usual. */
export async function restoreDeletedUser(id: string) {
  return (await api<{ user: AdminUser }>(`/admin/deleted-users/${id}/restore`, { method: 'POST' })).user;
}

/** Makes a member an admin, or takes admin access away. Takes effect straight away. Not for your own account. */
export async function setUserRole(id: string, role: Role) {
  return (await api<{ user: AdminUser }>(`/admin/users/${id}/role`, { method: 'PUT', body: { role } })).user;
}

/** Blocks first, then by domain. */
export async function listEmailDomainRules() {
  return (await api<{ rules: EmailDomainRule[] }>('/admin/email-domains')).rules;
}

/** Adds a rule, or replaces the one already there for this domain. A leading '@' and any case are accepted. */
export async function saveEmailDomainRule(domain: string, action: EmailDomainRule['action'], reason?: string) {
  return (
    await api<{ rule: EmailDomainRule }>(`/admin/email-domains/${encodeURIComponent(domain)}`, {
      method: 'PUT',
      body: { action, reason },
    })
  ).rule;
}

/** The domain goes back to the default (allowed, unless it's on the disposable list). */
export function removeEmailDomainRule(domain: string) {
  return api<void>(`/admin/email-domains/${encodeURIComponent(domain)}`, { method: 'DELETE' });
}

/** Pass a full email address or just a domain. */
export async function checkEmailDomain(emailOrDomain: string) {
  const value = emailOrDomain.trim();
  const param = value.includes('@') ? 'email' : 'domain';
  return (await api<{ check: EmailDomainCheck }>(`/admin/email-domains/check?${param}=${encodeURIComponent(value)}`)).check;
}
