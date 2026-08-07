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
  /** Resolves true when sign-in finished in-page (popup). False if redirect started. */
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

async function syncSessionForUser(user: User): Promise<void> {
  console.log("[auth] syncing session cookie for", user.uid);
  const token = await user.getIdToken();
  await createSessionCookie(token);
  console.log("[auth] session cookie created");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.warn("[auth] Firebase not configured");
      setUser(null);
      setLoading(false);
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;
    let epoch = 0;
    let redirectSignedIn = false;

    // Must resolve before treating "null" as signed-out, or we wipe the session
    // while Google redirect completion is still pending.
    const redirectReady = getRedirectResult(auth)
      .then(async (result) => {
        console.log(
          "[auth] getRedirectResult",
          result?.user ? { uid: result.user.uid, email: result.user.email } : null
        );
        if (!result?.user || cancelled) return result;
        redirectSignedIn = true;
        await syncSessionForUser(result.user);
        if (!cancelled) {
          setUser(result.user);
          setLoading(false);
        }
        return result;
      })
      .catch((err: unknown) => {
        console.error("[auth] getRedirectResult failed", err);
        return null;
      });

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      const myEpoch = ++epoch;
      console.log("[auth] onAuthStateChanged", {
        uid: next?.uid ?? null,
        email: next?.email ?? null,
        epoch: myEpoch,
      });

      if (next) {
        setLoading(true);
      }

      void (async () => {
        try {
          if (!next) {
            await redirectReady;
            if (cancelled || myEpoch !== epoch) return;
            if (auth.currentUser || redirectSignedIn) {
              console.log("[auth] ignore signed-out event; user present after redirect");
              return;
            }
            console.log("[auth] clearing session (signed out)");
            await clearSessionCookie().catch((err: unknown) => {
              console.error("[auth] Failed to clear auth session cookie", err);
            });
            if (cancelled || myEpoch !== epoch) return;
            setUser(null);
            setLoading(false);
            return;
          }

          await syncSessionForUser(next);
          if (cancelled || myEpoch !== epoch) return;
          setUser(next);
          setLoading(false);
        } catch (err) {
          console.error("[auth] Failed to sync auth session cookie", err);
          if (cancelled || myEpoch !== epoch) return;
          try {
            await firebaseSignOut();
            await clearSessionCookie();
          } catch {
            /* ignore */
          }
          if (cancelled || myEpoch !== epoch) return;
          setUser(null);
          setLoading(false);
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
    setUser(cred.user);
    setLoading(false);
  }, []);

  const registerWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const cred = await registerWithEmail(email, password);
      await syncSessionForUser(cred.user);
      setUser(cred.user);
      setLoading(false);
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithGoogle();
    if (!cred) {
      console.log("[auth] redirect started; waiting for return");
      return false;
    }
    console.log("[auth] popup completed", cred.user.uid);
    await syncSessionForUser(cred.user);
    setUser(cred.user);
    setLoading(false);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await clearSessionCookie();
    await firebaseSignOut();
    setUser(null);
    setLoading(false);
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
