"use client";

import { useCricket } from "@/lib/cricket-context";
import { InningsData, BallData, countsAsDelivery, countsAsLegalBall, countsAsWicket } from "@/lib/cricket-types";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import { cn } from "@/lib/utils";

interface ScoresheetProps {
  innings: InningsData | null;
}

export default function Scoresheet({ innings }: ScoresheetProps) {
  const { matchState } = useCricket();

  if (!innings) return null;

  const calculateStats = () => {
    let totalRuns = 0;
    let wickets = 0;
    let legalBalls = 0;

    innings.balls.forEach((ball) => {
      totalRuns += ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
      if (countsAsWicket(ball.dismissal)) wickets++;
      if (countsAsLegalBall(ball)) legalBalls++;
    });

    return { totalRuns, wickets, legalBalls };
  };

  const stats = calculateStats();
  const overs =
    Math.floor(stats.legalBalls / (matchState.config?.ballsPerOver || 6)) +
    "." +
    (stats.legalBalls % (matchState.config?.ballsPerOver || 6));

  const groupBallsByOver = () => {
    const overs: { [key: number]: BallData[] } = {};
    innings.balls.forEach((ball) => {
      if (!countsAsDelivery(ball)) return;
      if (!overs[ball.overNumber]) {
        overs[ball.overNumber] = [];
      }
      overs[ball.overNumber].push(ball);
    });
    return overs;
  };

  const overGroups = groupBallsByOver();

  const getDismissalText = (ball: BallData) => {
    if (ball.dismissal === "none") return "";
    const dismissalMap: { [key: string]: string } = {
      bowled: "b",
      lbw: "lbw",
      caught: "c",
      stumped: "st",
      "run-out": "run out",
    };
    return `${dismissalMap[ball.dismissal]} ${ball.dismissedPlayer || ""}`;
  };

  return (
    <div className="space-y-4">
      <CricketBroadcastCard accent>
        <div className="cricket-score-strip">
          <div>
            <CricketEyebrow className="mb-1">Batting</CricketEyebrow>
            <p className="cricket-display text-sm font-semibold text-[var(--cricket-cream)]">
              {innings.teamName}
            </p>
          </div>
          <CricketScoreDisplay size="xl">
            {stats.totalRuns}/{stats.wickets}
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
              {stats.legalBalls}
            </p>
          </div>
        </div>
      </CricketBroadcastCard>

      <CricketBroadcastCard className="p-4">
        <CricketEyebrow className="mb-3">Ball by ball</CricketEyebrow>
        <div className="space-y-4">
          {Object.entries(overGroups)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([overNum, balls]) => (
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
                        {ball.dismissal === "run-out"
                          ? ball.runs > 0
                            ? `${ball.runs}W`
                            : "W"
                          : ball.extra === "overthrow"
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
                      <div className="text-[0.55rem] text-[oklch(0.5_0.03_255)] mt-0.5 leading-tight truncate">
                        {ball.bowlerName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </CricketBroadcastCard>
    </div>
  );
}
