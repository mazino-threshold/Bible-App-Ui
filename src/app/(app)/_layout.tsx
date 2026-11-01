import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useUser } from '@/auth/session';
import { colors } from '@/constants/theme';
import { usePushRegistration } from '@/notifications/use-push-registration';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Filled icon for the selected tab, outline for the others. */
function tabIcon(name: IconName, outline: IconName) {
  function TabIcon({ color, size, focused }: { color: unknown; size: number; focused: boolean }) {
    return <Ionicons name={focused ? name : outline} size={size} color={color as string} />;
  }
  return TabIcon;
}

export default function AppLayout() {
  const user = useUser();
  usePushRegistration(user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Readings', tabBarIcon: tabIcon('book', 'book-outline') }} />
      <Tabs.Protected guard={user.role === 'admin'}>
        <Tabs.Screen name="admin" options={{ title: 'Admin', tabBarIcon: tabIcon('shield', 'shield-outline') }} />
      </Tabs.Protected>
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
