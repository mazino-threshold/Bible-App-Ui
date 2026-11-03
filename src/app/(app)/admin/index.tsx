import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/query-state';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useScheduledWeeks } from '@/hooks/use-admin';
import { useMyWeek } from '@/hooks/use-my-week';
import { addDays, formatWeekRange } from '@/lib/dates';

interface WeekItem {
  weekStart: string;
  weekEnd: string;
  daysScheduled: number;
}

export default function AdminScreen() {
  // The member's own week tells us "today" and this week's Monday, as decided by the server
  const current = useMyWeek(null);
  const weeks = useScheduledWeeks();

  function refresh() {
    current.refetch();
    weeks.refetch();
  }

  if (!current.data || !weeks.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <QueryState error={current.error ?? weeks.error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const { today, weekStart: thisMonday } = current.data;
  const items = weekItems(thisMonday, weeks.data);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={current.isRefetching || weeks.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <Text style={styles.title}>Admin</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin/report')}
          style={({ pressed }) => [styles.card, styles.reportCard, pressed && styles.pressed]}>
          <Ionicons name="stats-chart" size={26} color={colors.accent} />
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Weekly report</Text>
            <Text style={styles.cardDetail}>See who has been reading each week</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin/users')}
          style={({ pressed }) => [styles.card, styles.reportCard, pressed && styles.pressed]}>
          <Ionicons name="people" size={26} color={colors.accent} />
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Members</Text>
            <Text style={styles.cardDetail}>Deactivate or reactivate members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Readings</Text>
          <Text style={styles.sectionHint}>Set the passage for each day, Monday to Saturday. Weeks that have ended are locked.</Text>
          {items.map((item) => (
            <WeekRow key={item.weekStart} item={item} thisMonday={thisMonday} today={today} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekRow({ item, thisMonday, today }: { item: WeekItem; thisMonday: string; today: string }) {
  const ended = item.weekEnd < today;
  const complete = item.daysScheduled >= 6;
  const label =
    item.weekStart === thisMonday ? 'This week' : item.weekStart === addDays(thisMonday, 7) ? 'Next week' : null;

  let status: string;
  let statusColor = colors.textMuted;
  if (ended) status = `Ended · ${item.daysScheduled}/6 set`;
  else if (complete) {
    status = 'All 6 days set';
    statusColor = colors.success;
  } else {
    status = item.daysScheduled === 0 ? 'Not set yet' : `${item.daysScheduled}/6 days set`;
    statusColor = colors.error;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/admin/week/[weekStart]', params: { weekStart: item.weekStart } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.flex}>
        {label ? <Text style={styles.weekLabel}>{label}</Text> : null}
        <Text style={styles.cardTitle}>{formatWeekRange(item.weekStart, item.weekEnd)}</Text>
        <Text style={[styles.cardDetail, { color: statusColor }]}>{status}</Text>
      </View>
      <Ionicons
        name={ended ? 'lock-closed-outline' : 'create-outline'}
        size={22}
        color={ended ? colors.textMuted : colors.primary}
      />
    </Pressable>
  );
}

/** This week and next week always (so they can be filled in), plus every week that has readings, newest first. */
function weekItems(thisMonday: string, scheduled: WeekItem[]): WeekItem[] {
  const byStart = new Map(scheduled.map((w) => [w.weekStart, w]));
  for (const start of [thisMonday, addDays(thisMonday, 7)]) {
    if (!byStart.has(start)) byStart.set(start, { weekStart: start, weekEnd: addDays(start, 5), daysScheduled: 0 });
  }
  return [...byStart.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reportCard: { paddingVertical: spacing.lg },
  pressed: { opacity: 0.8 },
  flex: { flex: 1 },
  weekLabel: { fontSize: 12, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDetail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
