import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DayStatus, MyDay } from '@/api/types';
import { colors, radius, spacing } from '@/constants/theme';
import { formatShortDate } from '@/lib/dates';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STATUS: Record<DayStatus, { label: string; icon: IconName; color: string }> = {
  read: { label: 'Read', icon: 'checkmark-circle', color: colors.success },
  pending: { label: 'Today', icon: 'ellipse-outline', color: colors.accent },
  missed: { label: 'Missed', icon: 'close-circle-outline', color: colors.error },
  upcoming: { label: 'Upcoming', icon: 'time-outline', color: colors.textMuted },
  no_reading: { label: 'No reading', icon: 'remove-circle-outline', color: colors.textMuted },
};

export function DayRow({ day, isToday }: { day: MyDay; isToday: boolean }) {
  const status = STATUS[day.status];

  return (
    <View
      style={[styles.row, isToday && styles.today]}
      accessible
      accessibilityLabel={`${day.day}, ${formatShortDate(day.date)}: ${day.passage ?? 'not set yet'}. ${status.label}`}>
      <View style={styles.date}>
        <Text style={styles.weekday}>{day.day.slice(0, 3).toUpperCase()}</Text>
        <Text style={styles.dayNumber}>{formatShortDate(day.date)}</Text>
      </View>
      <Text style={[styles.passage, !day.passage && styles.unset]} numberOfLines={2}>
        {day.passage ?? 'Not set yet'}
      </Text>
      <View style={styles.status}>
        <Ionicons name={status.icon} size={22} color={status.color} />
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  today: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  date: { width: 52 },
  weekday: { fontSize: 13, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  dayNumber: { fontSize: 13, color: colors.textMuted },
  passage: { flex: 1, fontSize: 16, color: colors.text },
  unset: { color: colors.textMuted, fontStyle: 'italic' },
  status: { alignItems: 'center', width: 72 },
  statusLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
