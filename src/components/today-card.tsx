import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MyDay } from '@/api/types';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { formatLongDay } from '@/lib/dates';

interface Props {
  today: string;
  /** Today's entry in the week, or undefined on Sunday. */
  day: MyDay | undefined;
  onToggle: (read: boolean) => void;
  error?: string | null;
}

/** Today's reading with the big "I've read it" checkbox. */
export function TodayCard({ today, day, onToggle, error }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{formatLongDay(today)}</Text>
      <Content day={day} onToggle={onToggle} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Content({ day, onToggle }: Pick<Props, 'day' | 'onToggle'>) {
  if (!day) {
    return (
      <>
        <Text style={styles.title}>Sunday rest</Text>
        <Text style={styles.body}>There&apos;s no reading on Sundays. The next one is on Monday.</Text>
      </>
    );
  }

  if (!day.passage) {
    return (
      <>
        <Text style={styles.title}>Reading coming soon</Text>
        <Text style={styles.body}>Today&apos;s reading hasn&apos;t been posted yet. Check back later.</Text>
      </>
    );
  }

  const read = day.status === 'read';

  return (
    <>
      <Text style={styles.label}>Today&apos;s reading</Text>
      <Text style={styles.passage}>{day.passage}</Text>
      {day.notes ? <Text style={styles.body}>{day.notes}</Text> : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: read, disabled: !day.canToggle }}
        disabled={!day.canToggle}
        onPress={() => onToggle(!read)}
        style={({ pressed }) => [styles.check, read && styles.checkDone, pressed && styles.pressed]}>
        <Ionicons
          name={read ? 'checkbox' : 'square-outline'}
          size={28}
          color={read ? colors.primaryText : colors.primary}
        />
        <Text style={[styles.checkLabel, read && styles.checkLabelDone]}>
          {read ? 'Read today. Well done!' : "I've read today's passage"}
        </Text>
      </Pressable>
      {read ? <Text style={styles.hint}>Tap again to undo.</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: { fontSize: 13, fontWeight: '600', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  label: { fontSize: 14, color: colors.textMuted },
  title: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.primary },
  passage: { fontFamily: fonts.serif, fontSize: 30, fontWeight: '700', color: colors.primary },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  check: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  pressed: { opacity: 0.8 },
  checkLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.primary },
  checkLabelDone: { color: colors.primaryText },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  error: { fontSize: 14, color: colors.error },
});
