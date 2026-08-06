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
import { onAuthStateChanged, type User } from "firebase/auth";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getClientAuth(), (next) => {
      setUser(next);
      setLoading(false);

      // Keep the httpOnly session cookie aligned with Firebase Auth.
      // Do not block UI on this — roster APIs can use the Bearer ID token.
      if (next) {
        void next
          .getIdToken()
          .then((token) => createSessionCookie(token))
          .catch((err: unknown) => {
            console.error("Failed to refresh auth session cookie", err);
          });
      } else {
        void clearSessionCookie().catch((err: unknown) => {
          console.error("Failed to clear auth session cookie", err);
        });
      }
    });
    return unsubscribe;
  }, []);

  const getAccessToken = useCallback(async (forceRefresh = false) => {
    return getIdToken(forceRefresh);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmail(email, password);
    const token = await cred.user.getIdToken();
    await createSessionCookie(token);
  }, []);

  const registerWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const cred = await registerWithEmail(email, password);
      const token = await cred.user.getIdToken();
      await createSessionCookie(token);
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithGoogle();
    // false = redirect flow started; session cookie is created on return via onAuthStateChanged
    if (!cred) return false;
    const token = await cred.user.getIdToken();
    await createSessionCookie(token);
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
