"use client";

import { useMemo } from "react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { EmbedMatchFaceoffLayout } from "@/components/embed/LiveEmbedMatchFaceoff";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import type { MatchState } from "@/lib/cricket-types";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import { getMatchResult } from "@/lib/match-result";
import {
  formatOversFromLegalBalls,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "@/lib/spectator-live-stats";

function getTeamScoreLine(
  matchState: MatchState,
  side: 1 | 2
): string | null {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const innings = side === 1 ? matchState.innings1 : matchState.innings2;

  if (!innings?.balls.length) {
    if (side === 2 && matchState.currentInnings === 2) {
      return `0/0 (0.0 ov)`;
    }
    return null;
  }

  const runs = getInningsRuns(innings);
  const wickets = getInningsWickets(innings);
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

  const team1Score = getTeamScoreLine(matchState, 1);
  const team2Score = getTeamScoreLine(matchState, 2);
  const chaseLine = getChaseLine(matchState, view);
  const resultLine =
    view.kind === "complete" ? getMatchResult(matchState).text : null;

  return (
    <EmbedMatchFaceoffLayout
      eyebrow="Live now"
      eyebrowClassName="live-embed-next-match__eyebrow--live"
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
      <div className="live-embed-next-match">
        <EmbedLiveMatchFaceoff matchState={liveMatchState} />
      </div>
    </LiveEmbedPanelShell>
  );
}
