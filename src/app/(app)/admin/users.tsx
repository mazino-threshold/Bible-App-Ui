import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { errorMessage } from '@/api/client';
import type { AdminUser, UserStatusFilter } from '@/api/types';
import { useUser } from '@/auth/session';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import { useSetUserActive, useUsers } from '@/hooks/use-admin';
import { formatTimestampDate } from '@/lib/dates';

const FILTERS: { key: UserStatusFilter; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'active', label: 'Active' },
  { key: 'deactivated', label: 'Deactivated' },
];

export default function UsersScreen() {
  const me = useUser();
  const [filter, setFilter] = useState<UserStatusFilter>('all');
  const [search, setSearch] = useState('');
  // The member whose status is being changed; the confirm sheet is open while this is set
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const users = useUsers(filter);

  if (!users.data) {
    return <QueryState error={users.error} onRetry={() => users.refetch()} />;
  }

  const query = search.trim().toLowerCase();
  const shown = users.data.filter(
    (u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={users.isRefetching}
            onRefresh={() => {
              users.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <Text style={styles.hint}>
          Deactivated members are signed out, can&apos;t sign in and get no reminders. Their readings are kept.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f.key }}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipSelected]}>
              <Text style={[styles.chipLabel, filter === f.key && styles.chipLabelSelected]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.search}
          accessibilityLabel="Search members"
        />

        {shown.length === 0 ? (
          <Text style={styles.empty}>{users.data.length === 0 ? emptyText(filter) : 'Nobody matches.'}</Text>
        ) : (
          <View style={styles.list}>
            {shown.map((u) => (
              <MemberRow key={u.id} user={u} isMe={u.id === me.id} onChange={() => setSelected(u)} />
            ))}
          </View>
        )}
      </ScrollView>

      {selected ? <ConfirmSheet user={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function emptyText(filter: UserStatusFilter) {
  if (filter === 'active') return 'No active members.';
  if (filter === 'deactivated') return 'No deactivated members.';
  return 'No members yet.';
}

function MemberRow({ user, isMe, onChange }: { user: AdminUser; isMe: boolean; onChange: () => void }) {
  return (
    <View style={[styles.row, !user.active && styles.rowInactive]}>
      <View style={styles.rowInfo}>
        <View style={styles.nameLine}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {user.role === 'admin' ? <Text style={styles.adminTag}>Admin</Text> : null}
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        {user.active ? (
          <Text style={[styles.status, styles.statusActive]}>Active</Text>
        ) : (
          <>
            <Text style={[styles.status, styles.statusInactive]}>
              Deactivated{user.deactivatedAt ? ` · ${formatTimestampDate(user.deactivatedAt)}` : ''}
            </Text>
            {user.deactivationReason ? <Text style={styles.reason}>“{user.deactivationReason}”</Text> : null}
          </>
        )}
      </View>
      {isMe ? (
        <Text style={styles.you}>You</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${user.active ? 'Deactivate' : 'Reactivate'} ${user.name}`}
          onPress={onChange}
          style={({ pressed }) => [
            styles.action,
            user.active ? styles.actionDeactivate : styles.actionReactivate,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.actionLabel, user.active ? styles.actionLabelDeactivate : styles.actionLabelReactivate]}>
            {user.active ? 'Deactivate' : 'Reactivate'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** Asks the admin to confirm, with an optional reason that is saved with the change. */
function ConfirmSheet({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const setActive = useSetUserActive();
  const deactivating = user.active;

  function confirm() {
    setActive.mutate({ id: user.id, active: !deactivating, reason: reason.trim() || undefined }, { onSuccess: onClose });
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cancel" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.sheetTitle}>
            {deactivating ? 'Deactivate' : 'Reactivate'} {user.name}?
          </Text>
          <Text style={styles.sheetBody}>
            {deactivating
              ? 'They will be signed out on every device, won’t be able to sign in and will stop getting reminders. Their readings are kept, and you can reactivate them at any time.'
              : 'They will be able to sign in and get reminders again.'}
          </Text>
          <TextField
            label="Reason (optional)"
            value={reason}
            onChangeText={setReason}
            placeholder={deactivating ? 'e.g. Missed 3 weeks' : 'e.g. Back from travel'}
            maxLength={500}
            returnKeyType="done"
            onSubmitEditing={confirm}
          />
          <FormError message={setActive.error ? errorMessage(setActive.error) : null} />
          <Button title={deactivating ? 'Deactivate' : 'Reactivate'} onPress={confirm} loading={setActive.isPending} />
          <Button title="Cancel" variant="secondary" onPress={onClose} disabled={setActive.isPending} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 15, paddingVertical: spacing.lg },
  chips: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, color: colors.text },
  chipLabelSelected: { color: colors.primaryText, fontWeight: '600' },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowInactive: { backgroundColor: 'transparent' },
  rowInfo: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  adminTag: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  email: { fontSize: 13, color: colors.textMuted },
  status: { fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  statusActive: { color: colors.success },
  statusInactive: { color: colors.error },
  reason: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted },
  you: { fontSize: 13, color: colors.textMuted },
  action: { minHeight: 40, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1.5 },
  actionDeactivate: { borderColor: colors.error },
  actionReactivate: { borderColor: colors.primary, backgroundColor: colors.primary },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  actionLabelDeactivate: { color: colors.error },
  actionLabelReactivate: { color: colors.primaryText },
  pressed: { opacity: 0.75 },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(62, 36, 16, 0.45)' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  sheetBody: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
});
