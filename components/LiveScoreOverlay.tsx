"use client";

import { useEffect, useMemo } from "react";
import LiveScoreBar from "@/components/LiveScoreBar";
import LiveScoreBoundaryCelebration from "@/components/LiveScoreBoundaryCelebration";
import CricketLoader from "@/components/CricketLoader";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { useLiveScoreEventHighlight } from "@/hooks/use-live-score-event-highlight";
import { usePreloadLiveScoreCelebrations } from "@/hooks/use-preload-live-score-celebrations";
import { useEffectiveSpectatorMeta } from "@/hooks/use-spectator-meta";
import { useSpectatorTournament } from "@/hooks/use-spectator-tournament";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import {
  formatComingUpNextLabel,
  getNextTournamentFixture,
} from "@/lib/spectator-tournament-next";
import { cn } from "@/lib/utils";

interface LiveScoreOverlayProps {
  preview?: boolean;
}

export default function LiveScoreOverlay({ preview = false }: LiveScoreOverlayProps) {
  usePreloadLiveScoreCelebrations();
  const { draft, loading, error } = useLiveMatchSnapshot();
  const meta = useEffectiveSpectatorMeta(draft?.meta ?? null);
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const finishedFixtureId =
    meta?.kind === "tournament" ? meta.fixtureId : undefined;
  const persistedUpcoming =
    meta?.kind === "tournament" ? meta.comingUpNextLabel : undefined;

  const view = useMemo(() => {
    if (!draft?.matchState) {
      return {
        kind: "empty" as const,
        message: error ?? "No live match",
      };
    }
    const derived = deriveLiveScoreView(draft.matchState);
    if (derived.kind === "none") {
      return {
        kind: "empty" as const,
        message: error ?? "No live match",
      };
    }
    return derived;
  }, [draft, error]);

  const matchComplete = view.kind === "complete";
  const { data: tournamentData, refresh: refreshTournament } =
    useSpectatorTournament(tournamentId, matchComplete ? 4_000 : 12_000);

  useEffect(() => {
    if (!matchComplete || !tournamentId) return;
    void refreshTournament();
  }, [matchComplete, tournamentId, refreshTournament, finishedFixtureId]);

  const upcomingLabel = useMemo(() => {
    if (!matchComplete) return null;

    // Prefer label written when the result was saved (authoritative schedule).
    if (persistedUpcoming) return persistedUpcoming;
    if (persistedUpcoming === null) return null;

    if (!tournamentData) return null;
    const upcoming = getNextTournamentFixture(tournamentData, {
      afterFixtureId: finishedFixtureId,
      excludeFixtureId: finishedFixtureId,
    });
    if (!upcoming) return null;
    return formatComingUpNextLabel(upcoming.teamA, upcoming.teamB);
  }, [
    matchComplete,
    persistedUpcoming,
    tournamentData,
    finishedFixtureId,
  ]);

  const eventHighlight = useLiveScoreEventHighlight(view);

  const rootClassName = cn(
    "live-embed-root",
    preview && "live-embed-root--preview",
    loading && "live-embed-root--loading"
  );

  if (loading) {
    return (
      <div className={rootClassName}>
        <CricketLoader size="sm" label="Loading live score…" />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <LiveScoreBoundaryCelebration
        event={eventHighlight.event}
        phase={eventHighlight.phase}
        playKey={eventHighlight.playKey}
      />
      <LiveScoreBar
        view={view}
        eventHighlight={eventHighlight}
        upcomingLabel={upcomingLabel}
      />
    </div>
  );
}
