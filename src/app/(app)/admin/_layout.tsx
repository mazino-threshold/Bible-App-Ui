import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="report" options={{ title: 'Weekly report' }} />
      <Stack.Screen name="users" options={{ title: 'Members' }} />
      <Stack.Screen name="deleted" options={{ title: 'Deleted accounts' }} />
      <Stack.Screen name="email-domains" options={{ title: 'Email domains' }} />
      <Stack.Screen name="week/[weekStart]" options={{ title: 'Week readings' }} />
    </Stack>
  );
}
