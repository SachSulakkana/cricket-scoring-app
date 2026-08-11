"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase-client";
import type { LiveMatchDraft } from "@/lib/live-match-draft";
import { useLiveMatchPoll } from "@/hooks/use-live-match-poll";
import { usePublicLiveMatchPoll } from "@/hooks/use-public-live-match-poll";
import { useLiveShareKeyFromUrl } from "@/hooks/use-live-share-key";
import { useAuth } from "@/components/AuthProvider";
import { isSqliteBackendClient } from "@/lib/client-flags";

function parseDraft(data: unknown): LiveMatchDraft | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (!record.matchState || typeof record.updatedAt !== "string") return null;
  return {
    matchState: record.matchState as LiveMatchDraft["matchState"],
    meta: (record.meta as LiveMatchDraft["meta"]) ?? null,
    updatedAt: record.updatedAt,
  };
}

function useFirestoreLiveDraft(uid: string | null, enabled: boolean) {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured() || !uid) {
      setDraft(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(getClientDb(), "users", uid, "live_match_draft", "current");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDraft(null);
        } else {
          setDraft(parseDraft(snapshot.data()));
        }
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Could not connect to live feed");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, enabled]);

  return { draft, loading, error, realtime: true as const };
}

export function useLiveMatchSnapshot() {
  const { user, loading: authLoading } = useAuth();
  const shareKey = useLiveShareKeyFromUrl();
  // Data lives in SQLite (not Firestore) when DB_BACKEND=sqlite, so fall back
  // to polling the API even if Firebase client credentials are still set.
  const firebaseEnabled = isFirebaseConfigured() && !isSqliteBackendClient();
  const usePublic = Boolean(shareKey);
  const useOwnerRealtime = firebaseEnabled && Boolean(user) && !usePublic;

  const firestore = useFirestoreLiveDraft(user?.uid ?? null, useOwnerRealtime);
  const publicPoll = usePublicLiveMatchPoll(usePublic ? shareKey : null);
  const polled = useLiveMatchPoll(
    1000,
    !usePublic && (!firebaseEnabled || !user)
  );

  if (usePublic) {
    return {
      draft: publicPoll.draft,
      loading: publicPoll.loading,
      error: publicPoll.error,
      refresh: publicPoll.refresh,
      source: "share" as const,
    };
  }

  if (firebaseEnabled) {
    return {
      draft: firestore.draft,
      loading: authLoading || firestore.loading,
      error: firestore.error,
      refresh: polled.refresh,
      source: "firestore" as const,
    };
  }

  return {
    draft: polled.draft,
    loading: authLoading || polled.loading,
    error: polled.error,
    refresh: polled.refresh,
    source: "poll" as const,
  };
}
