import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import BibleText from '@/components/bible-text';
import { QueryState } from '@/components/query-state';
import { colors, radius, spacing } from '@/constants/theme';
import { useMyWeek, useToggleToday } from '@/hooks/use-my-week';
import { useTodayPassage } from '@/hooks/use-today-passage';

/** Today's reading in full, with the "I've read it" checkbox at the bottom. */
export default function ReadScreen() {
  const week = useMyWeek(null);
  const today = week.data?.days.find((d) => d.date === week.data?.today);
  const passage = useTodayPassage(week.data?.today, today?.passage);
  const toggle = useToggleToday();

  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        title: today?.passage ?? "Today's reading",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        // Opened straight from a link (e.g. on web) there's nothing to go back to
        headerLeft: router.canGoBack() ? undefined : () => <BackToReadings />,
      }}
    />
  );

  if (week.data && !today?.passage) {
    return (
      <>
        {header}
        <QueryState
          error={new Error(today ? "Today's reading hasn't been posted yet. Check back later" : "There's no reading on Sundays")}
          onRetry={() => week.refetch()}
        />
      </>
    );
  }

  if (!week.data || !today || !passage.data) {
    return (
      <>
        {header}
        <QueryState
          error={week.error ?? passage.error}
          onRetry={() => {
            week.refetch();
            passage.refetch();
          }}
        />
      </>
    );
  }

  const { chapters, version } = passage.data;
  const text = <BibleText chapters={chapters} versionTitle={version.title} copyright={version.copyright} />;
  const read = today.status === 'read';

  return (
    <View style={styles.flex}>
      {header}
      {Platform.OS === 'web' ? (
        // On web the component renders into the page, so it needs a native scroll container
        <ScrollView style={styles.flex}>{text}</ScrollView>
      ) : (
        <BibleText
          chapters={chapters}
          versionTitle={version.title}
          copyright={version.copyright}
          dom={{ style: styles.flex, containerStyle: styles.flex }}
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {toggle.error ? <Text style={styles.error}>{errorMessage(toggle.error)}</Text> : null}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: read, disabled: !today.canToggle }}
          disabled={!today.canToggle}
          onPress={() => toggle.mutate(!read)}
          style={({ pressed }) => [styles.check, read && styles.checkDone, pressed && styles.pressed]}>
          <Ionicons name={read ? 'checkbox' : 'square-outline'} size={26} color={read ? colors.primaryText : colors.primary} />
          <Text style={[styles.checkLabel, read && styles.checkLabelDone]}>
            {read ? 'Read today. Well done!' : "I've read today's passage"}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function BackToReadings() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to readings"
      onPress={() => router.replace('/')}
      hitSlop={12}
      style={styles.back}>
      <Ionicons name="chevron-back" size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  pressed: { opacity: 0.8 },
  checkLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.primary },
  checkLabelDone: { color: colors.primaryText },
  error: { fontSize: 14, color: colors.error, textAlign: 'center' },
  back: { paddingHorizontal: spacing.sm },
});
