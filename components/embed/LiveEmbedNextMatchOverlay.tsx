"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import type { MatchState, Team } from "@/lib/cricket-types";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import { getMatchResult } from "@/lib/match-result";
import {
  formatOversFromLegalBalls,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "@/lib/spectator-live-stats";

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

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

function TeamLogoContent({ team }: { team: Team }) {
  const initials = teamInitials(team.name);

  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className="live-embed-next-match__disc-img"
      />
    );
  }

  return (
    <span className="live-embed-next-match__disc-fallback">
      {initials || (
        <Users className="live-embed-next-match__disc-icon" aria-hidden />
      )}
    </span>
  );
}

function EmbedTeamLogoFlip({
  team,
  scoreLine,
}: {
  team: Team;
  scoreLine?: string | null;
}) {
  return (
    <div className="live-embed-next-match__team">
      <div className="live-embed-next-match__flip">
        <div className="live-embed-next-match__flip-inner">
          <div className="live-embed-next-match__disc live-embed-next-match__disc--front">
            <TeamLogoContent team={team} />
          </div>
          <div
            className="live-embed-next-match__disc live-embed-next-match__disc--back"
            aria-hidden
          >
            <TeamLogoContent team={team} />
          </div>
        </div>
      </div>
      <p className="live-embed-next-match__team-name">{team.name}</p>
      {scoreLine ? (
        <p className="live-embed-next-match__team-score">{scoreLine}</p>
      ) : null}
    </div>
  );
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
    <div className="live-embed-next-match__section">
      <p className="live-embed-next-match__eyebrow live-embed-next-match__eyebrow--live">
        Live now
      </p>
      <div className="live-embed-next-match__faceoff">
        <EmbedTeamLogoFlip team={matchState.team1} scoreLine={team1Score} />
        <p className="live-embed-next-match__vs" aria-hidden>
          Vs
        </p>
        <EmbedTeamLogoFlip team={matchState.team2} scoreLine={team2Score} />
      </div>
      {chaseLine ? (
        <p className="live-embed-next-match__chase">{chaseLine}</p>
      ) : resultLine ? (
        <p className="live-embed-next-match__chase">{resultLine}</p>
      ) : null}
    </div>
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
