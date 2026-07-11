"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { LiveMatchMeta } from "@/lib/store/match-slice";

export function useEffectiveSpectatorMeta(
  draftMeta: LiveMatchMeta | null | undefined
): LiveMatchMeta | null {
  const searchParams = useSearchParams();
  const urlTournamentId =
    searchParams.get("tournament") ?? searchParams.get("tournamentId") ?? "";
  const urlFixtureId =
    searchParams.get("fixture") ?? searchParams.get("fixtureId") ?? "";

  return useMemo(() => {
    if (draftMeta?.kind === "tournament") return draftMeta;
    if (urlTournamentId) {
      return {
        kind: "tournament",
        tournamentId: urlTournamentId,
        fixtureId: urlFixtureId || undefined,
      };
    }
    return draftMeta ?? null;
  }, [draftMeta, urlTournamentId, urlFixtureId]);
}
