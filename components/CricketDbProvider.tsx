"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  initRosterStorage,
  resetRosterStorageState,
} from "@/lib/roster-storage";

/** Kicks off roster hydration once the user is signed in. */
export default function CricketDbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (lastUid.current) {
        resetRosterStorageState();
        lastUid.current = null;
      }
      return;
    }

    if (lastUid.current && lastUid.current !== user.uid) {
      resetRosterStorageState();
    }
    lastUid.current = user.uid;

    // Defer so ApiAuthBridge can register the token provider in this commit.
    const timer = window.setTimeout(() => {
      void initRosterStorage().catch((err: unknown) => {
        console.error("Failed to load roster from Firestore", err);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, loading]);

  return <>{children}</>;
}
