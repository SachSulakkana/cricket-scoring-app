"use client";

import { useMemo } from "react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { EmbedMatchFaceoffLayout } from "@/components/embed/LiveEmbedMatchFaceoff";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import type { MatchState, Team } from "@/lib/cricket-types";
import { getTeamInningsTotalsFromMatch } from "@/lib/fixture-team-scores";
import { getBattingInningsForTeam } from "@/lib/fixture-team-scores";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import { getMatchResult } from "@/lib/match-result";
import {
  formatOversFromLegalBalls,
  getInningsRuns,
  getLegalBalls,
} from "@/lib/spectator-live-stats";

function getTeamScoreLine(matchState: MatchState, team: Team): string | null {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const innings = getBattingInningsForTeam(
    {
      innings1: matchState.innings1,
      innings2: matchState.innings2,
      team1: matchState.team1,
      team2: matchState.team2,
    },
    team
  );

  if (!innings?.balls.length) return null;

  const { runs, wickets } = getTeamInningsTotalsFromMatch(matchState, team);
  const overs = formatOversFromLegalBalls(getLegalBalls(innings), ballsPerOver);
  return `${runs}/${wickets} (${overs} ov)`;
}

function getChaseLine(
  matchState: MatchState,
  view: ReturnType<typeof deriveLiveScoreView>
): string | null {
  if (view.kind === "live" && view.chaseInfo) {
    return `Need ${view.chaseInfo.runsNeeded} from ${view.chaseInfo.oversRemaining} ov`;
  }

  if (view.kind === "inningsBreak" && matchState.innings1) {
    const target = getInningsRuns(matchState.innings1) + 1;
    return `Need ${target} to win`;
  }

  return null;
}

function EmbedLiveMatchFaceoff({ matchState }: { matchState: MatchState }) {
  const view = useMemo(
    () => deriveLiveScoreView(matchState),
    [matchState]
  );

  if (view.kind === "none" || view.kind === "empty") {
    return null;
  }

  const team1Score = getTeamScoreLine(matchState, matchState.team1);
  const team2Score = getTeamScoreLine(matchState, matchState.team2);
  const chaseLine = getChaseLine(matchState, view);
  const resultLine =
    view.kind === "complete" ? getMatchResult(matchState).text : null;

  return (
    <EmbedMatchFaceoffLayout
      eyebrow="Live now"
      teamA={matchState.team1}
      teamB={matchState.team2}
      teamAScoreLine={team1Score}
      teamBScoreLine={team2Score}
      footer={chaseLine ?? resultLine}
    />
  );
}

export default function LiveEmbedNextMatchOverlay() {
  const { draft: liveDraft, loading, error } = useLiveMatchSnapshot();

  const liveMatchState = liveDraft?.matchState?.matchStarted
    ? liveDraft.matchState
    : null;

  if (loading && !liveMatchState) {
    return <LiveEmbedPanelShell centered loading />;
  }

  if (!liveMatchState) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage={error ?? "No live match"}
      />
    );
  }

  return (
    <LiveEmbedPanelShell centered>
      <EmbedLiveMatchFaceoff matchState={liveMatchState} />
    </LiveEmbedPanelShell>
  );
}
