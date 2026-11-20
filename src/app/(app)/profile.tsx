import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/client';
import { updateMe } from '@/api/users';
import { useSession, useUser } from '@/auth/session';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { DELETION_PRIVACY_NOTICE } from '@/constants/privacy';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const user = useUser();
  const { setUser, signOut } = useSession();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [signingOut, setSigningOut] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      setUser(updated);
      setName(updated.name);
      setPhone(updated.phone);
      setSaved(true);
    },
  });

  const fields = save.error instanceof ApiError ? save.error.fields : {};
  const formError = save.error && Object.keys(fields).length === 0 ? errorMessage(save.error) : null;
  const detailsChanged = name.trim() !== user.name || phone.trim() !== user.phone;
  // Show the new position while it saves, so the switch doesn't jump back
  const pendingReminders = save.isPending ? save.variables?.remindersEnabled : undefined;
  const remindersOn = pendingReminders ?? user.remindersEnabled;

  function saveDetails() {
    setSaved(false);
    save.mutate({ name: name.trim(), phone: phone.trim() });
  }

  function setReminders(enabled: boolean) {
    if (save.isPending) return;
    setSaved(false);
    save.mutate({ remindersEnabled: enabled });
  }

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your details</Text>
          <TextField
            label="Full name"
            value={name}
            onChangeText={setName}
            error={fields.name}
            autoCapitalize="words"
            autoComplete="name"
          />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            error={fields.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user.email}</Text>
          </View>
          {detailsChanged ? (
            <Button
              title="Save changes"
              onPress={saveDetails}
              loading={save.isPending}
              disabled={!name.trim() || !phone.trim()}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.toggle}>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Reading reminders</Text>
              <Text style={styles.optionDetail}>
                A reminder at 6 AM and a last call at 9 PM on reading days (Monday to Saturday), unless you&apos;ve
                already read.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Reading reminders"
              value={remindersOn}
              onValueChange={setReminders}
              disabled={save.isPending}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <FormError message={formError} />
        {saved && !save.isPending ? <Text style={styles.saved}>Saved</Text> : null}

        <Button title="Sign out" variant="secondary" onPress={onSignOut} loading={signingOut} />

        <View style={styles.danger}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/delete-account')}
            disabled={signingOut}
            style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed]}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteAccountLabel}>Delete my account</Text>
          </Pressable>
          <Text style={styles.privacy}>{DELETION_PRIVACY_NOTICE}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  readOnly: { gap: spacing.xs },
  readOnlyLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  readOnlyValue: { fontSize: 16, color: colors.textMuted },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: 13, color: colors.textMuted },
  saved: { color: colors.success, fontSize: 14, textAlign: 'center' },
  danger: { gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  deleteAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  deleteAccountLabel: { fontSize: 16, fontWeight: '600', color: colors.error },
  privacy: { fontSize: 13, lineHeight: 19, color: colors.textMuted, textAlign: 'center' },
});
