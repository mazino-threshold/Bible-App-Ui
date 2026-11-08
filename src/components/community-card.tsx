import Ionicons from '@expo/vector-icons/Ionicons';
import { openURL } from 'expo-linking';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommunityLink } from '@/api/types';
import { Button } from '@/components/button';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const PLATFORM_ICONS: Record<string, IconName> = {
  whatsapp: 'logo-whatsapp',
  telegram: 'paper-plane',
  discord: 'logo-discord',
};

/** An invitation to join one of the club's community groups. The text and link come from the server. */
export function CommunityCard({ link }: { link: CommunityLink }) {
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    try {
      await openURL(link.url);
    } catch {
      setError("Couldn't open the link. Please try again");
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={PLATFORM_ICONS[link.platform.toLowerCase()] ?? 'people'} size={24} color={colors.accent} />
        <Text style={styles.title}>{link.title}</Text>
      </View>
      <Text style={styles.body}>{link.description}</Text>
      <Button title={link.buttonLabel} variant="secondary" onPress={join} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', color: colors.primary },
  body: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: spacing.xs },
  error: { fontSize: 14, color: colors.error },
});
