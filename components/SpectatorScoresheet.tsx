"use client";

import type { InningsData, BallData } from "@/lib/cricket-types";
import { countsAsWicket } from "@/lib/cricket-types";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import {
  formatOversFromLegalBalls,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "@/lib/spectator-live-stats";
import { cn } from "@/lib/utils";

interface SpectatorScoresheetProps {
  innings: InningsData;
  ballsPerOver: number;
  compact?: boolean;
}

function getDismissalText(ball: BallData) {
  if (ball.dismissal === "none") return "";
  const dismissalMap: Record<string, string> = {
    bowled: "b",
    lbw: "lbw",
    caught: "c",
    stumped: "st",
    "run-out": "run out",
    "retired-hurt": "retired hurt",
  };
  return `${dismissalMap[ball.dismissal]} ${ball.dismissedPlayer || ""}`;
}

export default function SpectatorScoresheet({
  innings,
  ballsPerOver,
  compact = false,
}: SpectatorScoresheetProps) {
  const totalRuns = getInningsRuns(innings);
  const wickets = getInningsWickets(innings);
  const legalBalls = getLegalBalls(innings);
  const overs = formatOversFromLegalBalls(legalBalls, ballsPerOver);

  const overGroups: Record<number, BallData[]> = {};
  innings.balls.forEach((ball) => {
    if (!overGroups[ball.overNumber]) overGroups[ball.overNumber] = [];
    overGroups[ball.overNumber].push(ball);
  });

  const sortedOvers = Object.entries(overGroups).sort(
    ([a], [b]) => parseInt(a, 10) - parseInt(b, 10)
  );

  const displayOvers = compact ? sortedOvers.slice(-3) : sortedOvers;

  return (
    <div className="space-y-3">
      {!compact && (
        <CricketBroadcastCard accent>
          <div className="cricket-score-strip">
            <div>
              <CricketEyebrow className="mb-1">Batting</CricketEyebrow>
              <p className="cricket-display text-sm font-semibold text-[var(--cricket-cream)]">
                {innings.teamName}
              </p>
            </div>
            <CricketScoreDisplay size="xl">
              {totalRuns}/{wickets}
            </CricketScoreDisplay>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 text-sm border-t border-[oklch(0.3_0.04_255)]">
            <div>
              <p className="cricket-eyebrow mb-1">Overs</p>
              <p className="cricket-score text-lg text-[var(--cricket-cream)]">
                {overs}
              </p>
            </div>
            <div className="text-right">
              <p className="cricket-eyebrow mb-1">Legal balls</p>
              <p className="cricket-score text-lg text-[var(--cricket-cream)]">
                {legalBalls}
              </p>
            </div>
          </div>
        </CricketBroadcastCard>
      )}

      <CricketBroadcastCard className="p-3 sm:p-4">
        <CricketEyebrow className="mb-3">
          {compact ? "Recent overs" : "Ball by ball"}
        </CricketEyebrow>
        {displayOvers.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0.03_255)]">No balls bowled yet.</p>
        ) : (
          <div className="space-y-4">
            {displayOvers.map(([overNum, balls]) => (
              <div key={overNum}>
                <p className="cricket-display text-xs font-semibold text-[var(--cricket-gold-dim)] mb-2">
                  Over {overNum}
                </p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {balls.map((ball) => (
                    <div
                      key={ball.id}
                      className={cn(
                        "cricket-ball-chip",
                        countsAsWicket(ball.dismissal) && "cricket-ball-chip--wicket",
                        ball.extra !== "none" && "cricket-ball-chip--extra"
                      )}
                    >
                      <div className="cricket-score text-base text-[var(--cricket-cream)]">
                        {ball.extra === "overthrow"
                          ? ball.runs + ball.extraRuns
                          : ball.runs}
                      </div>
                      {ball.extra !== "none" && (
                        <div className="text-[0.6rem] font-bold text-[var(--cricket-gold)]">
                          {ball.extra === "wide"
                            ? "W"
                            : ball.extra === "no-ball"
                              ? "NB"
                              : ball.extra === "bye"
                                ? "B"
                                : ball.extra === "overthrow"
                                  ? "OT"
                                  : "LB"}
                        </div>
                      )}
                      {ball.dismissal !== "none" && (
                        <div className="text-[0.55rem] text-[oklch(0.7_0.15_25)] leading-tight">
                          {getDismissalText(ball)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CricketBroadcastCard>
    </div>
  );
}
