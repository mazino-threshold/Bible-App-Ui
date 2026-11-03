import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReportFilters, ReportUser, WeeklyReport } from '@/api/types';
import { QueryState } from '@/components/query-state';
import { WeekNav, weekLabel } from '@/components/week-nav';
import { colors, radius, spacing } from '@/constants/theme';
import { useWeeklyReport } from '@/hooks/use-admin';
import { useMyWeek } from '@/hooks/use-my-week';
import { addDays } from '@/lib/dates';

type FilterKey = 'all' | 'every' | 'some' | 'none';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'every', label: 'Read every day' },
  { key: 'some', label: 'Missed some' },
  { key: 'none', label: 'Read none' },
];

/** The API filters by days read; "every day" depends on how many days were scheduled that week. */
function toApiFilters(key: FilterKey, daysScheduled: number): ReportFilters {
  switch (key) {
    case 'every':
      return { minDays: daysScheduled };
    case 'some':
      return { minDays: 1, maxDays: Math.max(daysScheduled - 1, 0) };
    case 'none':
      return { maxDays: 0 };
    default:
      return {};
  }
}

export default function ReportScreen() {
  const current = useMyWeek(null);
  // null = the current week
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  // daysScheduled comes from the unfiltered report, which is also what the summary uses
  const unfiltered = useWeeklyReport(weekStart, {});
  const daysScheduled = unfiltered.data?.daysScheduled ?? 6;
  const filtered = useWeeklyReport(weekStart, toApiFilters(filter, daysScheduled));

  function refresh() {
    current.refetch();
    unfiltered.refetch();
    filtered.refetch();
  }

  if (!current.data || !unfiltered.data || !filtered.data) {
    return <QueryState error={current.error ?? unfiltered.error ?? filtered.error} onRetry={refresh} />;
  }

  const report = unfiltered.data;
  const thisMonday = current.data.weekStart;
  const goTo = (start: string) => setWeekStart(start === thisMonday ? null : start);
  const query = search.trim().toLowerCase();
  const users = filtered.data.users.filter(
    (u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={unfiltered.isRefetching || filtered.isRefetching}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }>
      <WeekNav
        label={weekLabel(report.weekStart, thisMonday)}
        weekStart={report.weekStart}
        weekEnd={report.weekEnd}
        onBack={() => goTo(addDays(report.weekStart, -7))}
        onForward={() => goTo(addDays(report.weekStart, 7))}
        canGoForward={report.weekStart < thisMonday}
      />

      {report.daysScheduled === 0 ? (
        <Text style={styles.empty}>No readings were scheduled this week.</Text>
      ) : (
        <>
          <Summary report={report} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.filter((f) => f.key !== 'some' || report.daysScheduled > 1).map((f) => (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f.key }}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, filter === f.key && styles.chipSelected]}>
                <Text style={[styles.chipLabel, filter === f.key && styles.chipLabelSelected]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
            accessibilityLabel="Search members"
          />

          {users.length === 0 ? (
            <Text style={styles.empty}>Nobody matches.</Text>
          ) : (
            <View style={styles.list}>
              {users.map((u) => (
                <UserRow key={u.id} user={u} report={report} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Summary({ report }: { report: WeeklyReport }) {
  const { totalUsers, readEveryDay, averageDaysRead } = report.summary;
  return (
    <View style={styles.summary}>
      <SummaryItem value={String(totalUsers)} label="members" />
      <SummaryItem value={String(readEveryDay)} label="read every day" />
      <SummaryItem value={`${averageDaysRead}/${report.daysScheduled}`} label="average" />
    </View>
  );
}

function SummaryItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function UserRow({ user, report }: { user: ReportUser; report: WeeklyReport }) {
  const read = new Set(user.checkedInDates);
  const days = Array.from({ length: 6 }, (_, i) => addDays(report.weekStart, i));
  const all = user.daysRead >= report.daysScheduled;

  return (
    <View
      style={styles.userRow}
      accessible
      accessibilityLabel={`${user.name}${user.active ? '' : ' (deactivated)'}: read ${user.daysRead} of ${report.daysScheduled} days`}>
      <View style={styles.userInfo}>
        <View style={styles.nameLine}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          {user.active ? null : <Text style={styles.inactiveTag}>Deactivated</Text>}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.dots}>
          {days.map((date, i) => (
            <View key={date} style={styles.dotWrap}>
              <View style={[styles.dot, read.has(date) && styles.dotRead]} />
              <Text style={styles.dotLabel}>{'MTWTFS'[i]}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={[styles.userCount, all && styles.userCountAll]}>
        {user.daysRead}/{report.daysScheduled}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 15, paddingVertical: spacing.lg },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  summaryLabel: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  chips: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, color: colors.text },
  chipLabelSelected: { color: colors.primaryText, fontWeight: '600' },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  list: { gap: spacing.sm },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName: { flexShrink: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  inactiveTag: { fontSize: 11, fontWeight: '700', color: colors.error, textTransform: 'uppercase', letterSpacing: 0.6 },
  userEmail: { fontSize: 13, color: colors.textMuted },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  dotWrap: { alignItems: 'center', gap: 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border },
  dotRead: { backgroundColor: colors.success, borderColor: colors.success },
  dotLabel: { fontSize: 10, color: colors.textMuted },
  userCount: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  userCountAll: { color: colors.success },
});
