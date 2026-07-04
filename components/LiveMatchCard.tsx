"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import LiveMatchShareDialog from "@/components/LiveMatchShareDialog";
import { CricketBroadcastCard, CricketLivePill } from "@/components/cricket-shell";
import { getMatchResult, isMatchComplete } from "@/lib/match-result";
import type { MatchState } from "@/lib/cricket-types";
import type { LiveMatchMeta } from "@/lib/store/match-slice";
import { getInningsRuns, getInningsWickets } from "@/lib/spectator-live-stats";

interface LiveMatchCardProps {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  onWatch: () => void;
}

function getMetaLabel(meta: LiveMatchMeta | null): string | null {
  if (!meta) return null;
  if (meta.kind === "quick") return "Quick match";
  return meta.label ?? "Tournament match";
}

export default function LiveMatchCard({
  matchState,
  meta,
  onWatch,
}: LiveMatchCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const complete = isMatchComplete(matchState);
  const result = complete ? getMatchResult(matchState) : null;
  const innings1Score = matchState.innings1
    ? `${getInningsRuns(matchState.innings1)}/${getInningsWickets(matchState.innings1)}`
    : "—";
  const innings2Score = matchState.innings2?.balls.length
    ? `${getInningsRuns(matchState.innings2)}/${getInningsWickets(matchState.innings2)}`
    : "—";
  const metaLabel = getMetaLabel(meta);

  return (
    <>
      <CricketBroadcastCard className="live-match-card overflow-hidden">
        <div className="live-match-card__header">
          <div className="live-match-card__status">
            {complete ? (
              <span className="live-match-card__badge live-match-card__badge--done">
                Full time
              </span>
            ) : (
              <CricketLivePill />
            )}
            {metaLabel ? (
              <span className="live-match-card__meta">{metaLabel}</span>
            ) : null}
          </div>
          {matchState.config ? (
            <p className="live-match-card__format">
              {matchState.config.totalOvers} overs
              {!complete ? ` · Innings ${matchState.currentInnings}` : ""}
            </p>
          ) : null}
        </div>

        <div className="live-match-card__teams">
          <div className="live-match-card__team">
            <p className="live-match-card__team-name">{matchState.team1.name}</p>
            <p className="live-match-card__team-score">{innings1Score}</p>
          </div>
          <span className="live-match-card__vs">vs</span>
          <div className="live-match-card__team live-match-card__team--right">
            <p className="live-match-card__team-name">{matchState.team2.name}</p>
            <p className="live-match-card__team-score">{innings2Score}</p>
          </div>
        </div>

        {result ? (
          <p className="live-match-card__result">{result.text}</p>
        ) : null}

        <div className="live-match-card__actions">
          <button
            type="button"
            className="live-match-card__watch-btn"
            onClick={onWatch}
          >
            {complete ? "View scorecard" : "Watch live"}
          </button>
          <button
            type="button"
            className="live-match-card__share-btn"
            onClick={() => setShareOpen(true)}
            aria-label="Share live link"
            title="Share link"
          >
            <Share2 size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </CricketBroadcastCard>

      <LiveMatchShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        team1Name={matchState.team1.name}
        team2Name={matchState.team2.name}
      />
    </>
  );
}
