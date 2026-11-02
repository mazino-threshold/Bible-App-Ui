import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { getItem, setItem } from '@/auth/storage';

// The token this device registered with the server, so sign-out can stop its reminders
const TOKEN_KEY = 'push.token';

// Show reminders even while the app is open (phones only: the web app has no push reminders)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type PushSetupResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string };

/**
 * Asks permission (if needed) and returns this device's Expo push token.
 * Never throws: reminders are a nice-to-have, so failures are reported, not raised.
 */
export async function getPushToken(): Promise<PushSetupResult> {
  if (Platform.OS === 'web') return { status: 'unsupported', reason: 'web' };
  if (!Device.isDevice) return { status: 'unsupported', reason: 'simulator' };
  // Expo Go can't receive push notifications; a development build can
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return { status: 'unsupported', reason: 'expo-go' };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { status: 'unsupported', reason: 'no EAS projectId (run `npx eas-cli@latest init`)' };

  try {
    if (Platform.OS === 'android') {
      // The server's messages don't name a channel, so Android uses 'default'
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reading reminders',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#BB8348',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return { status: 'denied' };

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { status: 'registered', token };
  } catch (err) {
    return { status: 'unsupported', reason: err instanceof Error ? err.message : String(err) };
  }
}

export function getSavedPushToken() {
  return getItem(TOKEN_KEY);
}

export function savePushToken(token: string | null) {
  return setItem(TOKEN_KEY, token);
}
