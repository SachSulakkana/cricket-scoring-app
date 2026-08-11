"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveMatchDraft } from "@/lib/live-match-draft";
import { LIVE_SHARE_QUERY_PARAM } from "@/lib/live-share-constants";

const DEFAULT_INTERVAL_MS = 1000;

export function usePublicLiveMatchPoll(
  shareKey: string | null,
  intervalMs = DEFAULT_INTERVAL_MS
) {
  const [draft, setDraft] = useState<LiveMatchDraft | null>(null);
  const [loading, setLoading] = useState(Boolean(shareKey));
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<LiveMatchDraft | null>(null);

  const refresh = useCallback(async () => {
    if (!shareKey) {
      setDraft(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/live/draft?${LIVE_SHARE_QUERY_PARAM}=${encodeURIComponent(shareKey)}`
      );
      if (!res.ok) {
        throw new Error("Could not load live score");
      }
      const body = (await res.json()) as { draft: LiveMatchDraft | null };
      draftRef.current = body.draft ?? null;
      setDraft(body.draft ?? null);
      setError(null);
    } catch {
      setError("Could not connect to live feed");
    } finally {
      setLoading(false);
    }
  }, [shareKey]);

  useEffect(() => {
    if (!shareKey) {
      setDraft(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [shareKey, intervalMs, refresh]);

  return { draft, loading, error, refresh };
}
