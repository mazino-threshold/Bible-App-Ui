import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError, errorMessage } from '@/api/client';
import type { DayName, SaveWeekInput, Week } from '@/api/types';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import { useSaveWeek, useWeekSchedule } from '@/hooks/use-admin';
import { useMyWeek } from '@/hooks/use-my-week';
import { formatLongDay, formatWeekRange } from '@/lib/dates';

type Draft = Record<DayName, { passage: string; notes: string }>;

export default function EditWeekScreen() {
  const { weekStart } = useLocalSearchParams<{ weekStart: string }>();
  const schedule = useWeekSchedule(weekStart);
  const current = useMyWeek(null);

  if (!schedule.data || !current.data) {
    return (
      <QueryState
        error={schedule.error ?? current.error}
        onRetry={() => {
          schedule.refetch();
          current.refetch();
        }}
      />
    );
  }

  const locked = schedule.data.weekEnd < current.data.today;
  // Keyed by week so the form resets if the route changes to another week
  return <WeekForm key={weekStart} week={schedule.data} locked={locked} />;
}

function WeekForm({ week, locked }: { week: Week; locked: boolean }) {
  const save = useSaveWeek(week.weekStart);
  const [draft, setDraft] = useState<Draft>(() => toDraft(week));
  const [saved, setSaved] = useState<Draft>(() => toDraft(week));
  const [justSaved, setJustSaved] = useState(false);

  const fields = save.error instanceof ApiError ? save.error.fields : {};
  const formError = save.error && Object.keys(fields).length === 0 ? errorMessage(save.error) : null;
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const missing = week.days.filter((d) => !draft[d.day].passage.trim()).length;

  function update(day: DayName, field: 'passage' | 'notes', value: string) {
    setJustSaved(false);
    setDraft((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function submit() {
    setJustSaved(false);
    const input = Object.fromEntries(
      week.days.map(({ day }) => {
        const notes = draft[day].notes.trim();
        return [day, { passage: draft[day].passage.trim(), ...(notes ? { notes } : {}) }];
      }),
    ) as SaveWeekInput;
    save.mutate(input, {
      onSuccess: (updated) => {
        const next = toDraft(updated);
        setDraft(next);
        setSaved(next);
        setJustSaved(true);
      },
    });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: formatWeekRange(week.weekStart, week.weekEnd) }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {locked ? (
          <Text style={styles.locked}>This week has ended, so its readings can no longer be changed.</Text>
        ) : (
          <Text style={styles.hint}>
            Enter a passage for every day, e.g. &quot;John 3:1-21&quot;. Notes are optional and shown under the passage.
          </Text>
        )}

        {week.days.map((day) => (
          <View key={day.day} style={styles.day}>
            <Text style={styles.dayTitle}>{formatLongDay(day.date)}</Text>
            <TextField
              label="Passage"
              value={draft[day.day].passage}
              onChangeText={(v) => update(day.day, 'passage', v)}
              error={fields[`${day.day}.passage`] ?? fields[day.day]}
              editable={!locked}
              placeholder={locked ? 'Not set' : 'e.g. Psalm 23'}
              autoCapitalize="words"
              maxLength={500}
            />
            <TextField
              label="Notes (optional)"
              value={draft[day.day].notes}
              onChangeText={(v) => update(day.day, 'notes', v)}
              error={fields[`${day.day}.notes`]}
              editable={!locked}
              multiline
              maxLength={2000}
              style={styles.notes}
            />
          </View>
        ))}

        {!locked ? (
          <>
            <FormError message={formError} />
            {justSaved && !changed ? <Text style={styles.saved}>Saved. Members can see these readings now.</Text> : null}
            {missing > 0 ? (
              <Text style={styles.hint}>
                {missing} {missing === 1 ? 'day still needs' : 'days still need'} a passage.
              </Text>
            ) : null}
            <Button title="Save week" onPress={submit} loading={save.isPending} disabled={!changed || missing > 0} />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function toDraft(week: Week): Draft {
  return Object.fromEntries(
    week.days.map((d) => [d.day, { passage: d.passage ?? '', notes: d.notes ?? '' }]),
  ) as Draft;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  locked: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  day: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  notes: { minHeight: 70, paddingTop: spacing.sm, textAlignVertical: 'top' },
  saved: { color: colors.success, fontSize: 14, textAlign: 'center' },
});
