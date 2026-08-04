"use client";

import { useEffect, useState } from "react";
import {
  loadLiveMatchDraftLocal,
  subscribeLiveMatchDraftLocal,
  type LiveMatchDraft,
} from "@/lib/live-match-draft";

/**
 * Live match draft from this device only (localStorage + BroadcastChannel).
 * Used by scoring-device companion windows so they do not hit Firestore/API again.
 */
export function useLocalLiveMatchDraft() {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDraft(loadLiveMatchDraftLocal());
    setLoading(false);
    return subscribeLiveMatchDraftLocal((next) => {
      setDraft(next);
      setLoading(false);
    });
  }, []);

  return {
    draft,
    loading,
    error: null as string | null,
    source: "local" as const,
  };
}
