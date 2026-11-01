import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getMe, logout } from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { queryClient } from '@/api/query-client';
import type { User } from '@/api/types';
import { getSavedPushToken, savePushToken } from '@/notifications/push';
import { getItem, setItem } from './storage';

const TOKEN_KEY = 'session.token';
// The user is kept too, so the app opens straight away (and offline) before /me answers
const USER_KEY = 'session.user';

interface Session {
  isLoading: boolean;
  user: User | null;
  /** The most recent signed-in user, still set while the app moves away from signed-in screens. */
  lastUser: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  /** Replace the stored user, e.g. after the profile is edited. */
  setUser: (user: User) => void;
}

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

/** The signed-in user. Only use inside screens that require sign-in. */
export function useUser(): User {
  const { user, lastUser } = useSession();
  const current = user ?? lastUser;
  if (!current) throw new Error('useUser called while signed out');
  return current;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);
  // Kept after sign-out, so screens still on their way out can render once more without crashing
  const [lastUser, setLastUser] = useState<User | null>(null);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setUserState(null);
    // Don't leave one person's readings cached for the next person to sign in on this device
    queryClient.clear();
    await Promise.all([setItem(TOKEN_KEY, null), setItem(USER_KEY, null)]);
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    setLastUser(next);
    setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const signIn = useCallback(
    async (token: string, next: User) => {
      setAuthToken(token);
      await setItem(TOKEN_KEY, token);
      setUser(next);
    },
    [setUser],
  );

  const signOut = useCallback(async () => {
    // Tell the server (with this device's push token, so its reminders stop),
    // but sign out on this device even if that fails (e.g. offline)
    const pushToken = await getSavedPushToken().catch(() => null);
    await logout(pushToken ?? undefined).catch(() => {});
    await savePushToken(null).catch(() => {});
    await clear();
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear().catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  // Restore the session saved on this device, then refresh the user in the background
  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);
        if (!token || !savedUser) return;
        setAuthToken(token);
        const saved = JSON.parse(savedUser) as User;
        setUserState(saved);
        setLastUser(saved);
        // A 401 signs out via the unauthorized handler; any other failure (e.g. offline) keeps the saved user
        getMe()
          .then(setUser)
          .catch(() => {});
      } catch {
        await clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clear, setUser]);

  const value = useMemo(
    () => ({ isLoading, user, lastUser, signIn, signOut, setUser }),
    [isLoading, user, lastUser, signIn, signOut, setUser],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
