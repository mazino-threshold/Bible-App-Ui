import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { registerPushToken } from '@/api/push';
import type { User } from '@/api/types';
import { getPushToken, savePushToken } from './push';

/**
 * Registers this device for reminders once someone is signed in, and opens the readings when a reminder is tapped.
 * Doesn't ask for notification permission while reminders are turned off in the profile.
 */
export function usePushRegistration(user: User) {
  const client = useQueryClient();
  const wantsReminders = user.reminderFrequency !== 'off';

  useEffect(() => {
    if (!wantsReminders) return;
    let cancelled = false;

    (async () => {
      const result = await getPushToken();
      if (cancelled || result.status !== 'registered') {
        if (result.status === 'unsupported' && __DEV__) console.info(`Push reminders unavailable: ${result.reason}`);
        return;
      }
      try {
        await registerPushToken(result.token);
        await savePushToken(result.token);
      } catch {
        // Not worth bothering the user; it is retried the next time the app opens
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id, wantsReminders]);

  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (response?.notification.request.content.data?.type !== 'reading_reminder') return;
    // Opened from a reminder: show today's reading, freshly loaded
    client.invalidateQueries({ queryKey: ['my-week'] });
    router.navigate('/');
  }, [response, client]);
}
