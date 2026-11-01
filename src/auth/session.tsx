import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getMe, logout } from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import type { User } from '@/api/types';
import { getItem, setItem } from './storage';

const TOKEN_KEY = 'session.token';
// The user is kept too, so the app opens straight away (and offline) before /me answers
const USER_KEY = 'session.user';

interface Session {
  isLoading: boolean;
  user: User | null;
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
  const { user } = useSession();
  if (!user) throw new Error('useUser called while signed out');
  return user;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setUserState(null);
    await Promise.all([setItem(TOKEN_KEY, null), setItem(USER_KEY, null)]);
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
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
    // Tell the server, but sign out on this device even if that fails (e.g. offline)
    await logout().catch(() => {});
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
        setUserState(JSON.parse(savedUser) as User);
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
    () => ({ isLoading, user, signIn, signOut, setUser }),
    [isLoading, user, signIn, signOut, setUser],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
