"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadLiveMatchDraftRemote,
  type LiveMatchDraft,
} from "@/lib/live-match-draft";

const DEFAULT_INTERVAL_MS = 1000;

export function useLiveMatchPoll(intervalMs = DEFAULT_INTERVAL_MS, enabled = true) {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<LiveMatchDraft | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh, enabled]);

  return { draft, loading, error, refresh };
}
