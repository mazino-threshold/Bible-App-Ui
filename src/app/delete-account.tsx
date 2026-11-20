import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import { deleteMe } from '@/api/users';
import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { DELETION_PRIVACY_NOTICE } from '@/constants/privacy';
import { colors, radius, spacing } from '@/constants/theme';
import { formatTimestampLongDate } from '@/lib/dates';

const WHAT_HAPPENS = [
  'You’ll be signed out on every device straight away.',
  'Your account and your reading history will be removed from the app, including from past weekly reports.',
  'We keep a copy for 30 days only, so an admin can restore your account if you ask. After that it is erased for good.',
];

/** Explains what deleting means before doing it. */
export default function DeleteAccountScreen() {
  const { signOutLocally } = useSession();
  const [reason, setReason] = useState('');

  const remove = useMutation({
    mutationFn: () => deleteMe(reason.trim() || undefined),
    onSuccess: async ({ purgeAfter }) => {
      await signOutLocally(
        `Your account has been deleted. It will be erased for good on ${formatTimestampLongDate(purgeAfter)}.`,
      );
    },
  });

  function cancel() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Delete my account',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          headerLeft: router.canGoBack() ? undefined : () => <BackToProfile />,
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={28} color={colors.error} />
            <Text style={styles.warningTitle}>Delete your account?</Text>
          </View>

          <View style={styles.list}>
            <Text style={styles.listTitle}>If you continue:</Text>
            {WHAT_HAPPENS.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.privacy}>{DELETION_PRIVACY_NOTICE}</Text>

          <TextField
            label="Why are you leaving? (optional)"
            value={reason}
            onChangeText={setReason}
            placeholder="Anything you'd like us to know"
            maxLength={500}
            multiline
            style={styles.reason}
          />

          <FormError message={remove.error ? errorMessage(remove.error) : null} />

          <DeleteButton onPress={() => remove.mutate()} loading={remove.isPending || remove.isSuccess} />
          <Button title="Keep my account" variant="secondary" onPress={cancel} disabled={remove.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Red, so it can't be mistaken for the safe choice. */
function DeleteButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.delete, pressed && styles.pressed, loading && styles.inactive]}>
      <Text style={styles.deleteLabel}>{loading ? 'Deleting…' : 'Delete my account'}</Text>
    </Pressable>
  );
}

function BackToProfile() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to profile"
      onPress={() => router.replace('/profile')}
      hitSlop={12}
      style={styles.back}>
      <Ionicons name="chevron-back" size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  warningTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  list: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  listTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  bulletDot: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.text },
  privacy: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  reason: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  delete: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  deleteLabel: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  pressed: { opacity: 0.75 },
  inactive: { opacity: 0.5 },
  back: { paddingRight: spacing.sm },
});
