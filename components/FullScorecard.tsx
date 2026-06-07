"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BallData, InningsData, Team, countsAsBowlerWicket, countsAsWicket } from "@/lib/cricket-types";
import { useCricket } from "@/lib/cricket-context";

interface FullScorecardProps {
  onBack: () => void;
  showStartSecondInnings?: boolean;
  onStartSecondInnings?: () => void;
}

interface BattingRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  dismissal: string;
}

interface BowlingRow {
  name: string;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
  economy: string;
}

export default function FullScorecard({
  onBack,
  showStartSecondInnings = false,
  onStartSecondInnings,
}: FullScorecardProps) {
  const { matchState } = useCricket();
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<Record<string, boolean>>(
    {}
  );

  const calculateInningsTotal = (innings: InningsData | null) => {
    if (!innings) return { runs: 0, wickets: 0 };

    const runs = innings.balls.reduce((total, ball) => {
      return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    }, 0);
    const wickets = innings.balls.filter((ball) => countsAsWicket(ball.dismissal)).length;

    return { runs, wickets };
  };

  const calculateOvers = (balls: BallData[]) => {
    const legalBalls = balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
    const ballsPerOver = matchState.config?.ballsPerOver || 6;
    return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
  };

  const calculateBatting = (innings: InningsData | null, battingTeam: Team) => {
    if (!innings) return [] as BattingRow[];

    const rows = battingTeam.players.map((player) => {
      let runs = 0;
      let balls = 0;
      let fours = 0;
      let sixes = 0;
      let strikeRate = "0.00";
      let dismissal = "not out";

      innings.balls.forEach((ball) => {
        if (ball.batsmanName !== player.name) return;

        const noBallBatRuns =
          ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
        const overthrowRuns =
          ball.extra === "overthrow" ? ball.extraRuns : 0;
        const batterRuns = ball.runs + noBallBatRuns + overthrowRuns;
        runs += batterRuns;

        if (ball.extra !== "wide" && ball.extra !== "no-ball") balls++;
        if (batterRuns === 4) fours++;
        if (batterRuns === 6) sixes++;
      });

      strikeRate = balls > 0 ? ((runs * 100) / balls).toFixed(2) : "0.00";

      const dismissalBall = innings.balls.find(
        (ball) => ball.dismissal !== "none" && ball.dismissedPlayer === player.name
      );
      if (dismissalBall) {
        if (dismissalBall.dismissal === "bowled")
          dismissal = `Bowled by ${dismissalBall.bowlerName}`;
        else if (dismissalBall.dismissal === "lbw")
          dismissal = `LBW by ${dismissalBall.bowlerName}`;
        else if (dismissalBall.dismissal === "caught")
          dismissal = `Caught by ${dismissalBall.fielderName || "Unknown"}, bowled by ${dismissalBall.bowlerName}`;
        else if (dismissalBall.dismissal === "stumped")
          dismissal = `Stumped by ${dismissalBall.fielderName || "Unknown"}, bowled by ${dismissalBall.bowlerName}`;
        else if (dismissalBall.dismissal === "retired-hurt")
          dismissal = "Retired hurt";
        else dismissal = `Run out by ${dismissalBall.fielderName || "Unknown"}`;
      }

      return {
        name: player.name,
        runs,
        balls,
        fours,
        sixes,
        strikeRate,
        dismissal,
      };
    });

    return rows.filter((row) => row.runs > 0 || row.balls > 0 || row.dismissal !== "not out");
  };

  const calculateBowling = (innings: InningsData | null, bowlingTeam: Team) => {
    if (!innings) return [] as BowlingRow[];

    const rows = bowlingTeam.players.map((player) => {
      let balls = 0;
      let runs = 0;
      let wickets = 0;
      let noBalls = 0;
      let wides = 0;
      const byOver: Record<number, number> = {};

      innings.balls.forEach((ball) => {
        if (ball.bowlerName !== player.name) return;

        const legalBall = ball.extra !== "wide" && ball.extra !== "no-ball";
        if (legalBall) {
          balls++;
          byOver[ball.overNumber] = (byOver[ball.overNumber] || 0) + ball.runs;
        } else {
          byOver[ball.overNumber] = (byOver[ball.overNumber] || 0) + ball.extraRuns;
        }

        const concededFromExtra =
          ball.extra === "wide" || ball.extra === "no-ball" ? ball.extraRuns : 0;
        const overthrowConceded =
          ball.extra === "overthrow" ? ball.extraRuns : 0;
        runs += ball.runs + concededFromExtra + overthrowConceded;
        if (ball.extra === "no-ball") noBalls += ball.extraRuns;
        if (ball.extra === "wide") wides += ball.extraRuns;

        if (countsAsBowlerWicket(ball.dismissal)) wickets++;
      });

      const maidens = Object.values(byOver).filter((overRuns) => overRuns === 0).length;
      const ballsPerOver = matchState.config?.ballsPerOver || 6;
      const economy =
        balls > 0 ? (runs / (balls / ballsPerOver)).toFixed(2) : "0.00";

      return {
        name: player.name,
        balls,
        maidens,
        runs,
        wickets,
        noBalls,
        wides,
        economy,
      };
    });

    return rows.filter((row) => row.balls > 0 || row.runs > 0 || row.wickets > 0);
  };

  const calculateExtras = (innings: InningsData | null) => {
    if (!innings) return { wide: 0, noBall: 0, bye: 0, legBye: 0, total: 0 };

    const extras = innings.balls.reduce(
      (acc, ball) => {
        if (ball.extra === "wide") acc.wide += ball.extraRuns;
        if (ball.extra === "no-ball") acc.noBall += ball.extraRuns;
        if (ball.extra === "bye") acc.bye += ball.extraRuns;
        if (ball.extra === "leg-bye") acc.legBye += ball.extraRuns;
        return acc;
      },
      { wide: 0, noBall: 0, bye: 0, legBye: 0 }
    );

    return {
      ...extras,
      total: extras.wide + extras.noBall + extras.bye + extras.legBye,
    };
  };

  const getBowlerBallByBall = (innings: InningsData, bowlerName: string) => {
    return innings.balls
      .filter((ball) => ball.bowlerName === bowlerName)
      .map((ball) => {
        if (countsAsWicket(ball.dismissal)) return `W`;
        if (ball.dismissal === "retired-hurt") return "RH";
        if (ball.extra === "wide") return `${ball.extraRuns}Wd`;
        if (ball.extra === "no-ball") return `${ball.extraRuns}Nb`;
        if (ball.extra === "bye") return `${ball.extraRuns}B`;
        if (ball.extra === "leg-bye") return `${ball.extraRuns}Lb`;
        if (ball.extra === "overthrow") return `${ball.runs + ball.extraRuns}OT`;
        return `${ball.runs}`;
      });
  };

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getInningsRuns = (innings: InningsData | null) => {
    if (!innings) return 0;
    return innings.balls.reduce((total, ball) => {
      return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    }, 0);
  };

  const getLegalBalls = (innings: InningsData | null) => {
    if (!innings) return 0;
    return innings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
  };

  const getOversTextFromBalls = (balls: number) => {
    const ballsPerOver = matchState.config?.ballsPerOver || 6;
    return `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
  };

  const renderInningsScorecard = (
    title: string,
    innings: InningsData | null,
    battingTeam: Team,
    bowlingTeam: Team
  ) => {
    if (!innings) return null;

    const totals = calculateInningsTotal(innings);
    const battingRows = calculateBatting(innings, battingTeam);
    const bowlingRows = calculateBowling(innings, bowlingTeam);
    const extras = calculateExtras(innings);

    return (
      <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-center">
            <span>{title}</span>
            <span className="text-[var(--cricket-gold)]">
              {totals.runs}/{totals.wickets} ({calculateOvers(innings.balls)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-3">Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-200">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2">Batter</th>
                    <th className="py-2 text-right">R</th>
                    <th className="py-2 text-right">B</th>
                    <th className="py-2 text-right">4s</th>
                    <th className="py-2 text-right">6s</th>
                    <th className="py-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {battingRows.map((row) => (
                    <tr key={row.name} className="border-b border-slate-700/50">
                      <td className="py-2">
                        <div>{row.name}</div>
                        {row.dismissal !== "not out" && (
                          <div className="text-xs text-slate-400">{row.dismissal}</div>
                        )}
                      </td>
                      <td className="py-2 text-right font-semibold">{row.runs}</td>
                      <td className="py-2 text-right">{row.balls}</td>
                      <td className="py-2 text-right">{row.fours}</td>
                      <td className="py-2 text-right">{row.sixes}</td>
                      <td className="py-2 text-right">{row.strikeRate}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-700/50 bg-slate-900/40">
                    <td className="py-2 font-semibold">Extras</td>
                    <td className="py-2 text-right font-semibold">{extras.total}</td>
                    <td className="py-2 text-right text-slate-300" colSpan={5}>
                      b {extras.bye}, lb {extras.legBye}, nb {extras.noBall}, wd {extras.wide}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Bowling</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-200">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2">Bowler</th>
                    <th className="py-2 text-right">O</th>
                    <th className="py-2 text-right">M</th>
                    <th className="py-2 text-right">R</th>
                    <th className="py-2 text-right">W</th>
                    <th className="py-2 text-right">NB</th>
                    <th className="py-2 text-right">WD</th>
                    <th className="py-2 text-right">ECO</th>
                    <th className="py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingRows.map((row) => {
                    const bowlerKey = `${title}-${row.name}`;
                    const isExpanded = !!expandedBowlerKeys[bowlerKey];
                    const ballByBall = getBowlerBallByBall(innings, row.name);

                    return (
                      <Fragment key={row.name}>
                        <tr className="border-b border-slate-700/50">
                          <td className="py-2">{row.name}</td>
                          <td className="py-2 text-right">
                            {Math.floor(row.balls / (matchState.config?.ballsPerOver || 6))}.
                            {row.balls % (matchState.config?.ballsPerOver || 6)}
                          </td>
                          <td className="py-2 text-right">{row.maidens}</td>
                          <td className="py-2 text-right">{row.runs}</td>
                          <td className="py-2 text-right font-semibold">{row.wickets}</td>
                          <td className="py-2 text-right">{row.noBalls}</td>
                          <td className="py-2 text-right">{row.wides}</td>
                          <td className="py-2 text-right">{row.economy}</td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => toggleBowlerDetails(bowlerKey)}
                              className="inline-flex items-center text-slate-100 hover:text-white"
                              aria-label={isExpanded ? "Collapse bowler details" : "Expand bowler details"}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-slate-700/50">
                            <td colSpan={9} className="py-2">
                              <div className="text-xs text-slate-400 mb-2">Ball by ball</div>
                              <div className="flex flex-wrap gap-2">
                                {ballByBall.map((entry, idx) => (
                                  <span
                                    key={`${row.name}-${idx}`}
                                    className="px-2 py-1 rounded bg-slate-700 text-slate-100 text-xs"
                                  >
                                    {entry}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="cricket-page min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="cricket-display text-2xl sm:text-3xl font-bold text-[var(--cricket-cream)]">
            Full Scorecard
          </h1>
          <div className="flex gap-2">
            {showStartSecondInnings && onStartSecondInnings && (
              <button
                type="button"
                className="cricket-btn-play cricket-btn-play--quick !min-h-9 !text-xs px-4"
                onClick={onStartSecondInnings}
              >
                Start 2nd innings
              </button>
            )}
            <button
              type="button"
              className="cricket-btn-back !min-h-9 !w-11 inline-flex items-center justify-center text-lg"
              onClick={onBack}
              aria-label="Go back"
              title="Go back"
            >
              <span aria-hidden>←</span>
            </button>
          </div>
        </div>

        {renderInningsScorecard(
          `${matchState.team1.name} Innings`,
          matchState.innings1,
          matchState.team1,
          matchState.team2
        )}

        {renderInningsScorecard(
          `${matchState.team2.name} Innings`,
          matchState.innings2,
          matchState.team2,
          matchState.team1
        )}

        {(() => {
          const innings1Runs = getInningsRuns(matchState.innings1);
          if (!matchState.innings1 || !matchState.config) return null;

          const showChaseSection =
            showStartSecondInnings || matchState.currentInnings === 2;
          if (!showChaseSection) return null;

          const target = innings1Runs + 1;
          const innings2Runs = getInningsRuns(matchState.innings2);
          const runsNeeded = Math.max(target - innings2Runs, 0);

          const totalLegalBalls =
            matchState.config.totalOvers * matchState.config.ballsPerOver;
          const legalBallsBowled = getLegalBalls(matchState.innings2);
          const ballsRemaining = Math.max(totalLegalBalls - legalBallsBowled, 0);

          return (
            <div className="cricket-chase-banner">
              {matchState.team2.name} needs {runsNeeded} runs in{" "}
              {getOversTextFromBalls(ballsRemaining)} overs
            </div>
          );
        })()}
      </div>
    </div>
  );
}
