import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '@/auth/session';
import { colors } from '@/constants/theme';

// Keep the splash screen up until we know whether someone is signed in
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { isLoading, user } = useSession();

  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
