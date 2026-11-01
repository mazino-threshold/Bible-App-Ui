import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // ApiErrors like 401/404 won't fix themselves; only retry once for flaky connections
      retry: 1,
    },
  },
});

// Refetch when the app comes back to the foreground, e.g. the next morning (web does this by itself)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}
