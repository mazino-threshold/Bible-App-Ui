import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/client';
import type { ReminderFrequency } from '@/api/types';
import { updateMe } from '@/api/users';
import { useSession, useUser } from '@/auth/session';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// Matches the backend's reminder slots (Nigeria time, Monday to Saturday)
const REMINDER_OPTIONS: { value: ReminderFrequency; label: string; detail: string }[] = [
  { value: 'high', label: 'Often', detail: '6 times a day: 6am, 9am, 12pm, 3pm, 6pm and 9pm' },
  { value: 'mid', label: 'Regular', detail: '4 times a day: 6am, 12pm, 6pm and 9pm' },
  { value: 'low', label: 'Light', detail: 'Twice a day: 6am and 9pm' },
  { value: 'off', label: 'Off', detail: 'No reminders' },
];

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

  function saveDetails() {
    setSaved(false);
    save.mutate({ name: name.trim(), phone: phone.trim() });
  }

  function chooseReminders(value: ReminderFrequency) {
    if (value === user.reminderFrequency || save.isPending) return;
    setSaved(false);
    save.mutate({ reminderFrequency: value });
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
          <Text style={styles.sectionHint}>
            We remind you on reading days until you&apos;ve ticked off the day&apos;s reading.
          </Text>
          <View accessibilityRole="radiogroup" style={styles.options}>
            {REMINDER_OPTIONS.map((option) => {
              const selected = option.value === user.reminderFrequency;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: save.isPending }}
                  onPress={() => chooseReminders(option.value)}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormError message={formError} />
        {saved && !save.isPending ? <Text style={styles.saved}>Saved</Text> : null}

        <Button title="Sign out" variant="secondary" onPress={onSignOut} loading={signingOut} />
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
  sectionHint: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: -spacing.sm },
  readOnly: { gap: spacing.xs },
  readOnlyLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  readOnlyValue: { fontSize: 16, color: colors.textMuted },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  pressed: { opacity: 0.8 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: 13, color: colors.textMuted },
  saved: { color: colors.success, fontSize: 14, textAlign: 'center' },
});
