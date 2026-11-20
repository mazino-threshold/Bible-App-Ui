import { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import type { DeletedUser } from '@/api/types';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { QueryState } from '@/components/query-state';
import { colors, radius, spacing } from '@/constants/theme';
import { useDeletedUsers, useRestoreUser } from '@/hooks/use-admin';
import { daysUntil, formatTimestampDate } from '@/lib/dates';

/** Accounts deleted in the last 30 days, which can still be restored before they are erased for good. */
export default function DeletedUsersScreen() {
  const users = useDeletedUsers();
  const [restoring, setRestoring] = useState<DeletedUser | null>(null);

  if (!users.data) {
    return <QueryState error={users.error} onRetry={() => users.refetch()} />;
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
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
          Deleted accounts are kept for 30 days so they can be restored if someone asks, then erased for good.
        </Text>

        {users.data.length === 0 ? (
          <Text style={styles.empty}>No deleted accounts.</Text>
        ) : (
          <View style={styles.list}>
            {users.data.map((u) => (
              <DeletedRow key={u.id} user={u} onRestore={() => setRestoring(u)} />
            ))}
          </View>
        )}
      </ScrollView>

      {restoring ? <RestoreSheet user={restoring} onClose={() => setRestoring(null)} /> : null}
    </>
  );
}

function DeletedRow({ user, onRestore }: { user: DeletedUser; onRestore: () => void }) {
  const daysLeft = daysUntil(user.purgeAfter);

  return (
    <View style={styles.row}>
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
        <Text style={styles.detail}>
          {user.requestedBy === 'user' ? 'Deleted by themselves' : 'Deleted by an admin'} ·{' '}
          {formatTimestampDate(user.deletedAt)}
        </Text>
        {user.deletionReason ? <Text style={styles.reason}>“{user.deletionReason}”</Text> : null}
        <Text style={[styles.detail, daysLeft <= 7 && styles.urgent]}>
          Erased on {formatTimestampDate(user.purgeAfter)} ·{' '}
          {daysLeft === 1 ? '1 day left' : daysLeft === 0 ? 'less than a day left' : `${daysLeft} days left`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Restore ${user.name}`}
        onPress={onRestore}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Text style={styles.actionLabel}>Restore</Text>
      </Pressable>
    </View>
  );
}

function RestoreSheet({ user, onClose }: { user: DeletedUser; onClose: () => void }) {
  const restore = useRestoreUser();

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cancel" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.sheetTitle}>Restore {user.name}&apos;s account?</Text>
          <Text style={styles.sheetBody}>
            Their account and reading history come back, including in weekly reports. They&apos;ll need to sign in again
            with the code we email them. If they were deactivated when the account was deleted, they come back
            deactivated.
          </Text>
          <FormError message={restore.error ? errorMessage(restore.error) : null} />
          <Button title="Restore" onPress={() => restore.mutate(user.id, { onSuccess: onClose })} loading={restore.isPending} />
          <Button title="Cancel" variant="secondary" onPress={onClose} disabled={restore.isPending} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 15, paddingVertical: spacing.lg },
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
  rowInfo: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  adminTag: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  email: { fontSize: 13, color: colors.textMuted },
  detail: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  urgent: { color: colors.error, fontWeight: '600' },
  reason: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted },
  action: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: colors.primaryText },
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
