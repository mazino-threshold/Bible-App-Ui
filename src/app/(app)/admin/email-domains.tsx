import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, errorMessage } from '@/api/client';
import type { EmailDomainCheck, EmailDomainRule } from '@/api/types';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import { useCheckEmailDomain, useEmailDomainRules, useRemoveEmailDomainRule, useSaveEmailDomainRule } from '@/hooks/use-admin';
import { formatTimestampDate } from '@/lib/dates';

type Action = EmailDomainRule['action'];

/** Which email providers may be used to sign up. Sign-in for existing members is never affected. */
export default function EmailDomainsScreen() {
  const rules = useEmailDomainRules();
  const [removing, setRemoving] = useState<EmailDomainRule | null>(null);

  if (!rules.data) {
    return <QueryState error={rules.error} onRetry={() => rules.refetch()} />;
  }

  return (
    <>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={rules.isRefetching}
              onRefresh={() => {
                rules.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          <Text style={styles.hint}>
            Sign-ups from disposable email providers (like mailinator.com) are refused automatically. Block a domain to
            refuse it too, or allow one that is on the disposable list by mistake. A rule covers the domain and its
            subdomains.
          </Text>
          <Text style={styles.hint}>
            Blocking only stops new sign-ups. Members who already use that domain can still sign in; to remove them,
            deactivate or delete them in Members.
          </Text>

          <CheckBox />
          <AddRuleForm />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules</Text>
            {rules.data.length === 0 ? (
              <Text style={styles.empty}>No rules yet. Only the disposable list applies.</Text>
            ) : (
              <View style={styles.list}>
                {rules.data.map((rule) => (
                  <RuleRow key={rule.domain} rule={rule} onRemove={() => setRemoving(rule)} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {removing ? <RemoveSheet rule={removing} onClose={() => setRemoving(null)} /> : null}
    </>
  );
}

/** Try an address to see whether it could sign up, and which rule decides. */
function CheckBox() {
  const [value, setValue] = useState('');
  const check = useCheckEmailDomain();
  const field = check.error instanceof ApiError ? Object.values(check.error.fields)[0] : undefined;

  function run() {
    if (value.trim()) check.mutate(value);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Check an email</Text>
      <TextField
        label="Email or domain"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          check.reset();
        }}
        placeholder="someone@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={run}
        error={field}
      />
      {check.error && !field ? <FormError message={errorMessage(check.error)} /> : null}
      {check.data ? <CheckResult check={check.data} /> : null}
      <Button title="Check" variant="secondary" onPress={run} loading={check.isPending} disabled={!value.trim()} />
    </View>
  );
}

function CheckResult({ check }: { check: EmailDomainCheck }) {
  let text: string;
  if (check.source === 'disposable_list') text = `Blocked: on the disposable list (${check.matched ?? check.domain})`;
  else if (check.source === 'admin_block') text = `Blocked by an admin rule (${check.matched ?? check.domain})`;
  else if (check.source === 'admin_allow') text = `Allowed by an admin rule (${check.matched ?? check.domain})`;
  else text = check.blocked ? 'Blocked' : 'Allowed';

  return (
    <View accessibilityRole="alert" style={[styles.result, check.blocked ? styles.resultBlocked : styles.resultAllowed]}>
      <Text style={[styles.resultText, { color: check.blocked ? colors.error : colors.success }]}>{text}</Text>
    </View>
  );
}

function AddRuleForm() {
  const [domain, setDomain] = useState('');
  const [action, setAction] = useState<Action>('block');
  const [reason, setReason] = useState('');
  const [savedDomain, setSavedDomain] = useState<string | null>(null);
  const save = useSaveEmailDomainRule();
  const fields = save.error instanceof ApiError ? save.error.fields : {};
  const formError = save.error && !fields.domain && !fields.action && !fields.reason ? errorMessage(save.error) : null;

  function submit() {
    if (!domain.trim()) return;
    setSavedDomain(null);
    save.mutate(
      { domain: domain.trim(), action, reason: reason.trim() || undefined },
      {
        onSuccess: (rule) => {
          setSavedDomain(rule.domain);
          setDomain('');
          setReason('');
        },
      },
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Add a rule</Text>
      <TextField
        label="Domain"
        value={domain}
        onChangeText={(text) => {
          setDomain(text);
          setSavedDomain(null);
        }}
        placeholder="example.com"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        error={fields.domain}
      />
      <View accessibilityRole="radiogroup" style={styles.segment}>
        {(['block', 'allow'] as const).map((option) => {
          const selected = action === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setAction(option)}
              style={[styles.segmentItem, selected && (option === 'block' ? styles.segmentBlock : styles.segmentAllow)]}>
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                {option === 'block' ? 'Block' : 'Allow'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="Reason (optional)"
        value={reason}
        onChangeText={setReason}
        placeholder={action === 'block' ? 'e.g. Used for spam sign-ups' : 'e.g. A real provider, listed by mistake'}
        maxLength={500}
        error={fields.reason}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Text style={styles.small}>If this domain already has a rule, it is replaced.</Text>
      <FormError message={formError} />
      {savedDomain && !save.isPending ? <Text style={styles.saved}>Saved the rule for {savedDomain}</Text> : null}
      <Button
        title={action === 'block' ? 'Block domain' : 'Allow domain'}
        onPress={submit}
        loading={save.isPending}
        disabled={!domain.trim()}
      />
    </View>
  );
}

function RuleRow({ rule, onRemove }: { rule: EmailDomainRule; onRemove: () => void }) {
  const blocked = rule.action === 'block';
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <View style={styles.nameLine}>
          <Text style={styles.domain} numberOfLines={1}>
            {rule.domain}
          </Text>
          <Text style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeAllowed]}>
            {blocked ? 'Blocked' : 'Allowed'}
          </Text>
        </View>
        {rule.reason ? <Text style={styles.reason}>“{rule.reason}”</Text> : null}
        <Text style={styles.small}>Since {formatTimestampDate(rule.updatedAt)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove the rule for ${rule.domain}`}
        onPress={onRemove}
        hitSlop={6}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
        <Text style={styles.removeLabel}>Remove</Text>
      </Pressable>
    </View>
  );
}

function RemoveSheet({ rule, onClose }: { rule: EmailDomainRule; onClose: () => void }) {
  const remove = useRemoveEmailDomainRule();

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cancel" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.sheetTitle}>Remove the rule for {rule.domain}?</Text>
          <Text style={styles.sheetBody}>
            {rule.domain} goes back to the default: allowed, unless it is on the disposable email list.
          </Text>
          <FormError message={remove.error ? errorMessage(remove.error) : null} />
          <Button title="Remove rule" onPress={() => remove.mutate(rule.domain, { onSuccess: onClose })} loading={remove.isPending} />
          <Button title="Cancel" variant="secondary" onPress={onClose} disabled={remove.isPending} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  empty: { color: colors.textMuted, fontSize: 15, paddingVertical: spacing.md },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  result: { borderRadius: radius.sm, padding: spacing.md },
  resultBlocked: { backgroundColor: colors.errorSurface },
  resultAllowed: { backgroundColor: colors.background },
  resultText: { fontSize: 14, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  segmentBlock: { backgroundColor: colors.error, borderColor: colors.error },
  segmentAllow: { backgroundColor: colors.success, borderColor: colors.success },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  segmentLabelSelected: { color: colors.primaryText },
  small: { fontSize: 13, color: colors.textMuted },
  saved: { color: colors.success, fontSize: 14 },
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
  domain: { flexShrink: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    color: colors.primaryText,
  },
  badgeBlocked: { backgroundColor: colors.error },
  badgeAllowed: { backgroundColor: colors.success },
  reason: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted },
  remove: { minHeight: 40, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.error },
  removeLabel: { fontSize: 14, fontWeight: '600', color: colors.error },
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
