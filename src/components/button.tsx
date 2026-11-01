import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        inactive && variant !== 'link' && styles.inactive,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.primary} />
      ) : (
        <Text style={[styles.label, labelStyles[variant], disabled && variant === 'link' && styles.inactive]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1.5, borderColor: colors.primary },
  link: { minHeight: 44, paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.75 },
  inactive: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.primaryText },
  secondary: { color: colors.primary },
  link: { color: colors.primary, textDecorationLine: 'underline' },
});
