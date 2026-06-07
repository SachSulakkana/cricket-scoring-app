"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadLiveMatchDraftRemote,
  type LiveMatchDraft,
} from "@/lib/live-match-draft";

const DEFAULT_INTERVAL_MS = 3000;

export function useLiveMatchPoll(intervalMs = DEFAULT_INTERVAL_MS) {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<LiveMatchDraft | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await loadLiveMatchDraftRemote();
      draftRef.current = next;
      setDraft(next);
      setError(null);
    } catch {
      setError("Could not refresh live score");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh]);

  return { draft, loading, error, refresh };
}
