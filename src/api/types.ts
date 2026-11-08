/** Shapes returned by the Bible App API (see the backend's *.types.ts files). */

export type Role = 'user' | 'admin';
export type ReminderFrequency = 'high' | 'mid' | 'low' | 'off';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  reminderFrequency: ReminderFrequency;
  createdAt: string;
}

/** A user as shown on the admin's member list. */
export interface AdminUser extends User {
  active: boolean;
  /** null while the account is active. */
  deactivatedAt: string | null;
  deactivationReason: string | null;
}

export type UserStatusFilter = 'active' | 'deactivated' | 'all';

export interface SignInResult {
  token: string;
  user: User;
}

export interface MessageResult {
  message: string;
}

export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/**
 * read        - checked in
 * pending     - today, has a reading, not checked in yet
 * missed      - past day with a reading, not checked in
 * upcoming    - future day
 * no_reading  - today or a past day with nothing scheduled
 */
export type DayStatus = 'read' | 'pending' | 'missed' | 'upcoming' | 'no_reading';

export interface MyDay {
  date: string;
  day: DayName;
  /** null when the admin hasn't set this day's reading yet */
  passage: string | null;
  notes: string | null;
  status: DayStatus;
  /** True only for today when there is a reading. */
  canToggle: boolean;
}

/** A week (Monday to Saturday) with the signed-in user's status for each day. Dates are 'YYYY-MM-DD'. */
export interface MyWeek {
  /** Today in Nigeria time, decided by the server. */
  today: string;
  weekStart: string;
  weekEnd: string;
  daysRead: number;
  streak: number;
  days: MyDay[];
}

export interface TodayCheckIn {
  date: string;
  checkedIn: boolean;
  streak: number;
}

/** One day of a week's schedule. passage is null if the admin hasn't set it yet. */
export interface Day {
  date: string;
  day: DayName;
  passage: string | null;
  notes: string | null;
}

export interface Week {
  weekStart: string;
  weekEnd: string;
  days: Day[];
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  daysScheduled: number;
}

export interface ReportUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Whether the account is active now (someone deactivated mid-week still appears for that week). */
  active: boolean;
  daysRead: number;
  checkedInDates: string[];
}

export interface ReportFilters {
  minDays?: number;
  maxDays?: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  /** Days with a reading this week (normally 6). */
  daysScheduled: number;
  /** Totals over everyone, before filters. */
  summary: { totalUsers: number; readEveryDay: number; averageDaysRead: number };
  filters: { minDays: number | null; maxDays: number | null };
  /** Most days read first, then by name. */
  users: ReportUser[];
}

export type SaveWeekInput = Record<DayName, { passage: string; notes?: string }>;

/** A link to one of the club's community groups (e.g. WhatsApp). Managed on the server so it can change without an app update. */
export interface CommunityLink {
  id: string;
  /** e.g. 'whatsapp' or 'telegram'. Only used to pick an icon; unknown platforms get a generic one. */
  platform: string;
  title: string;
  description: string;
  buttonLabel: string;
  url: string;
}
