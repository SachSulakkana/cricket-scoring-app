"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import type { LiveMatchDraft } from "@/lib/live-match-draft";
import { useLiveMatchPoll } from "@/hooks/use-live-match-poll";

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

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

function useFirestoreLiveDraft() {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "live_match_draft", "current");
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
  }, []);

  return { draft, loading, error, realtime: true as const };
}

export function useLiveMatchSnapshot() {
  const firebaseEnabled = isFirebaseConfigured();
  const firestore = useFirestoreLiveDraft();
  const polled = useLiveMatchPoll(3000, !firebaseEnabled);

  if (firebaseEnabled) {
    return {
      draft: firestore.draft,
      loading: firestore.loading,
      error: firestore.error,
      refresh: polled.refresh,
      source: "firestore" as const,
    };
  }

  return {
    draft: polled.draft,
    loading: polled.loading,
    error: polled.error,
    refresh: polled.refresh,
    source: "poll" as const,
  };
}
