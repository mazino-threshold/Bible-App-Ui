import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession, useUser } from '@/auth/session';
import { Button } from '@/components/button';
import { colors, fonts, spacing } from '@/constants/theme';

/** Placeholder home until the weekly readings screen is built. */
export default function HomeScreen() {
  const user = useUser();
  const { signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, {user.name.split(' ')[0]}</Text>
        <Text style={styles.body}>
          You&apos;re signed in as {user.email}
          {user.role === 'admin' ? ' (admin)' : ''}.
        </Text>
        <Button title="Sign out" variant="secondary" onPress={onSignOut} loading={signingOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary },
  body: { fontSize: 16, color: colors.text },
});
