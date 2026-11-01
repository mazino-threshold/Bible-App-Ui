import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore doesn't work on web, so the browser build uses localStorage instead.
const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string | null): Promise<void> {
  if (isWeb) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
