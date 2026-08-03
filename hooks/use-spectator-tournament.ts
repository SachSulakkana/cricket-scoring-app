"use client";

import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/lib/cricket-types";
import type { SavedTournament } from "@/lib/roster-types";
import { LIVE_SHARE_QUERY_PARAM } from "@/lib/live-share-constants";
import { useLiveShareKeyFromUrl } from "@/hooks/use-live-share-key";

export interface SpectatorTournamentData {
  tournament: SavedTournament;
  teams: Team[];
}

export function useSpectatorTournament(
  tournamentId: string | undefined,
  pollMs = 12_000
) {
  const shareKey = useLiveShareKeyFromUrl();
  const [data, setData] = useState<SpectatorTournamentData | null>(null);
  const [loading, setLoading] = useState(Boolean(tournamentId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tournamentId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (shareKey) params.set(LIVE_SHARE_QUERY_PARAM, shareKey);
      const qs = params.toString();
      const res = await fetch(
        `/api/tournaments/${encodeURIComponent(tournamentId)}${qs ? `?${qs}` : ""}`
      );
      if (!res.ok) {
        throw new Error("Could not load tournament");
      }
      const body = (await res.json()) as SpectatorTournamentData;
      setData(body);
      setError(null);
    } catch {
      setError("Could not load tournament data");
    } finally {
      setLoading(false);
    }
  }, [tournamentId, shareKey]);

  useEffect(() => {
    if (!tournamentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void refresh();
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(timer);
  }, [tournamentId, pollMs, refresh]);

  return { data, loading, error, refresh };
}
