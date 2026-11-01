import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

/** A message about the whole form, e.g. from the server. Renders nothing when there's no message. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.errorSurface, borderRadius: radius.sm, padding: spacing.md },
  text: { color: colors.error, fontSize: 14 },
});
