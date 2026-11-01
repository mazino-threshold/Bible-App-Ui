import { api } from './client';
import type { ReportFilters, SaveWeekInput, Week, WeekSummary, WeeklyReport } from './types';

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
