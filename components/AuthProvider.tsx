"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getRedirectResult, onAuthStateChanged, type User } from "firebase/auth";
import {
  getClientAuth,
  getIdToken,
  isFirebaseConfigured,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
} from "@/lib/firebase-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function createSessionCookie(idToken: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Could not create session");
  }
}

async function clearSessionCookie() {
  await fetch("/api/auth/session", { method: "DELETE" });
}

/** Ensure server `__session` cookie exists before treating the user as signed in. */
async function syncSessionForUser(user: User): Promise<void> {
  const token = await user.getIdToken();
  await createSessionCookie(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;

    // Complete Google redirect sign-in (if any) before listening, so the
    // session cookie exists before AuthForm navigates away from /login.
    void getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncSessionForUser(result.user);
        }
      })
      .catch((err: unknown) => {
        console.error("Google redirect sign-in failed", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      void (async () => {
        try {
          if (next) {
            await syncSessionForUser(next);
            if (!cancelled) {
              setUser(next);
              setLoading(false);
            }
          } else {
            await clearSessionCookie().catch((err: unknown) => {
              console.error("Failed to clear auth session cookie", err);
            });
            if (!cancelled) {
              setUser(null);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Failed to sync auth session cookie", err);
          // Firebase client may be signed in, but without a session cookie
          // middleware will bounce protected routes back to /login.
          try {
            await firebaseSignOut();
            await clearSessionCookie();
          } catch {
            /* ignore */
          }
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const getAccessToken = useCallback(async (forceRefresh = false) => {
    return getIdToken(forceRefresh);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmail(email, password);
    await syncSessionForUser(cred.user);
  }, []);

  const registerWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const cred = await registerWithEmail(email, password);
      await syncSessionForUser(cred.user);
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithGoogle();
    // false = redirect flow started; session is synced on return
    if (!cred) return false;
    await syncSessionForUser(cred.user);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await clearSessionCookie();
    await firebaseSignOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      getAccessToken,
      loginWithEmail,
      registerWithEmailPassword,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      loading,
      getAccessToken,
      loginWithEmail,
      registerWithEmailPassword,
      loginWithGoogle,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
