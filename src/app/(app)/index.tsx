import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import { useUser } from '@/auth/session';
import { Button } from '@/components/button';
import { DayRow } from '@/components/day-row';
import { TodayCard } from '@/components/today-card';
import { WeekNav, weekLabel } from '@/components/week-nav';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useMyWeek, useToggleToday } from '@/hooks/use-my-week';
import { addDays } from '@/lib/dates';

export default function HomeScreen() {
  const user = useUser();
  // null = the current week; otherwise the Monday of the week being viewed
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const current = useMyWeek(null);
  const viewed = useMyWeek(weekStart);
  const toggle = useToggleToday();

  function refresh() {
    current.refetch();
    viewed.refetch();
  }

  const thisWeek = current.data;
  const week = viewed.data;

  if (!thisWeek || !week) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {current.error || viewed.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage(current.error ?? viewed.error)}</Text>
            <Button title="Try again" variant="secondary" onPress={refresh} />
          </View>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  const isCurrent = week.weekStart === thisWeek.weekStart;
  const goTo = (start: string) => setWeekStart(start === thisWeek.weekStart ? null : start);
  // Next week can be peeked at (the admin may have posted it), but no further
  const canGoForward = week.weekStart <= thisWeek.weekStart;
  const scheduledDays = week.days.filter((d) => d.passage).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={current.isRefetching || viewed.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <Text style={styles.greeting}>Hi, {user.name.split(' ')[0]}</Text>

        <View style={styles.stats}>
          <Stat icon="flame" value={thisWeek.streak} label="day streak" />
          <Stat
            icon="book"
            value={`${thisWeek.daysRead}/${thisWeek.days.filter((d) => d.passage).length || 6}`}
            label="read this week"
          />
        </View>

        <TodayCard
          today={thisWeek.today}
          day={thisWeek.days.find((d) => d.date === thisWeek.today)}
          onToggle={(read) => toggle.mutate(read)}
          error={toggle.error ? errorMessage(toggle.error) : null}
        />

        <View style={styles.weekHeader}>
          <WeekNav
            label={weekLabel(week.weekStart, thisWeek.weekStart)}
            weekStart={week.weekStart}
            weekEnd={week.weekEnd}
            onBack={() => goTo(addDays(week.weekStart, -7))}
            onForward={() => goTo(addDays(week.weekStart, 7))}
            canGoForward={canGoForward}
          />
        </View>

        {scheduledDays === 0 ? (
          <Text style={styles.empty}>No readings have been posted for this week yet.</Text>
        ) : (
          <View>
            {week.days.map((day) => (
              <DayRow key={day.date} day={day} isToday={day.date === thisWeek.today} />
            ))}
          </View>
        )}

        {!isCurrent ? (
          <Text style={styles.summary}>
            You read {week.daysRead} of {scheduledDays} {scheduledDays === 1 ? 'day' : 'days'} this week.
          </Text>
        ) : null}
        {!isCurrent ? <Button title="Back to this week" variant="link" onPress={() => setWeekStart(null)} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: 'flame' | 'book'; value: string | number; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  greeting: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted },
  weekHeader: { marginTop: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 15, paddingVertical: spacing.lg },
  summary: { textAlign: 'center', color: colors.text, fontSize: 15 },
  errorBox: { gap: spacing.md, alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 15, textAlign: 'center' },
});
