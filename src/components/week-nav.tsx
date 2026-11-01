import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { formatWeekRange } from '@/lib/dates';

interface Props {
  /** e.g. 'This week' */
  label: string;
  weekStart: string;
  weekEnd: string;
  onBack: () => void;
  onForward: () => void;
  canGoForward: boolean;
}

/** '‹  This week / 26 – 31 Oct 2026  ›' */
export function WeekNav({ label, weekStart, weekEnd, onBack, onForward, canGoForward }: Props) {
  return (
    <View style={styles.row}>
      <Arrow direction="back" onPress={onBack} />
      <View style={styles.title}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.range}>{formatWeekRange(weekStart, weekEnd)}</Text>
      </View>
      <Arrow direction="forward" onPress={onForward} disabled={!canGoForward} />
    </View>
  );
}

/** 'This week', 'Next week', 'Past week' compared with the current week's Monday. */
export function weekLabel(weekStart: string, currentWeekStart: string) {
  if (weekStart === currentWeekStart) return 'This week';
  return weekStart > currentWeekStart ? 'Next week' : 'Past week';
}

function Arrow({ direction, onPress, disabled }: { direction: 'back' | 'forward'; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Previous week' : 'Next week'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed, disabled && styles.disabled]}>
      <Ionicons name={direction === 'back' ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, alignItems: 'center' },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
  range: { fontSize: 14, color: colors.textMuted },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.3 },
});
