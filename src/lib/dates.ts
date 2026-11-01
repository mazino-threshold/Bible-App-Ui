// Dates from the API are 'YYYY-MM-DD' days in Nigeria time. They are handled as UTC midnight
// so the phone's own time zone can never shift them to the day before or after.

function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function format(date: string, options: Intl.DateTimeFormatOptions) {
  return toDate(date).toLocaleDateString('en-GB', { timeZone: 'UTC', ...options });
}

export function addDays(date: string, days: number): string {
  const d = toDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 'Monday 2 November' */
export function formatLongDay(date: string) {
  return format(date, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** '2 Nov' */
export function formatShortDate(date: string) {
  return format(date, { day: 'numeric', month: 'short' });
}

/** '26 – 31 Oct 2026', or '27 Oct – 1 Nov 2026' across months */
export function formatWeekRange(start: string, end: string) {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const from = sameMonth ? format(start, { day: 'numeric' }) : formatShortDate(start);
  return `${from} – ${format(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
