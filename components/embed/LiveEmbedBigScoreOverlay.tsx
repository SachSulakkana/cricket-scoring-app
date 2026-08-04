"use client";

import { useMemo } from "react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { useLocalLiveMatchDraft } from "@/hooks/use-local-live-match-draft";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import {
  formatOversFromLegalBalls,
  getLegalBalls,
} from "@/lib/spectator-live-stats";

type BigScore = {
  runs: number;
  wickets: number;
  overs: string;
};

function getBigScore(
  view: ReturnType<typeof deriveLiveScoreView>
): BigScore | null {
  if (view.kind === "live") {
    return {
      runs: view.currentRuns,
      wickets: view.currentWickets,
      overs: view.currentOvers,
    };
  }

  if (view.kind === "inningsBreak") {
    return {
      runs: view.innings1Runs,
      wickets: view.innings1Wickets,
      overs: view.innings1Overs,
    };
  }

  if (view.kind === "complete") {
    const ballsPerOver = view.matchState.config?.ballsPerOver ?? 6;
    const innings = view.matchState.innings2 ?? view.matchState.innings1;
    const overs = innings
      ? formatOversFromLegalBalls(getLegalBalls(innings), ballsPerOver)
      : "0.0";

    return {
      runs: view.innings2Runs,
      wickets: view.innings2Wickets,
      overs,
    };
  }

  if (view.kind === "waiting") {
    return { runs: 0, wickets: 0, overs: "0.0" };
  }

  return null;
}

/** Scoring-device companion window — reads local draft only (no DB / share poll). */
export default function LiveEmbedBigScoreOverlay() {
  const { draft: liveDraft, loading } = useLocalLiveMatchDraft();

  const liveMatchState = liveDraft?.matchState?.matchStarted
    ? liveDraft.matchState
    : null;

  const score = useMemo(() => {
    if (!liveMatchState) return null;
    return getBigScore(deriveLiveScoreView(liveMatchState));
  }, [liveMatchState]);

  if (loading && !liveMatchState) {
    return <LiveEmbedPanelShell centered loading />;
  }

  if (!liveMatchState || !score) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage="No live match on this device"
      />
    );
  }

  return (
    <LiveEmbedPanelShell centered>
      <div className="live-embed-big-score" aria-live="polite">
        <p className="live-embed-big-score__rw">
          <span className="live-embed-big-score__runs">{score.runs}</span>
          <span className="live-embed-big-score__slash">/</span>
          <span className="live-embed-big-score__wickets">{score.wickets}</span>
        </p>
        <p className="live-embed-big-score__overs">{score.overs}</p>
      </div>
    </LiveEmbedPanelShell>
  );
}
