import { Image } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
}

/** Layout for the signed-out screens: club logo, title, then the form. */
export function AuthScreen({ title, subtitle, children }: PropsWithChildren<Props>) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image source={require('@/assets/images/emblem.png')} style={styles.emblem} contentFit="contain" />
            <Text style={styles.club}>BRETHREN</Text>
            <Text style={styles.clubSub}>Bible Reading Club</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: { alignItems: 'center' },
  emblem: { width: 120, height: 120, marginBottom: spacing.sm },
  club: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', letterSpacing: 1.5, color: colors.primary },
  clubSub: { fontFamily: fonts.serif, fontSize: 18, color: colors.primary },
  heading: { gap: spacing.xs },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  form: { gap: spacing.md },
});
