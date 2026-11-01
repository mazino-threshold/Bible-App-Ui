import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/button';
import { colors, spacing } from '@/constants/theme';

/** Full-screen spinner, or the error with a retry button. */
export function QueryState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      {error ? (
        <>
          <Text style={styles.error}>{errorMessage(error)}</Text>
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  error: { color: colors.error, fontSize: 15, textAlign: 'center' },
});
