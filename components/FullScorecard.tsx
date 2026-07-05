"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BallData,
  InningsData,
  Team,
  countsAsBowlerWicket,
  countsAsWicket,
} from "@/lib/cricket-types";
import { useCricket } from "@/lib/cricket-context";
import { hasPersistedSuperOver } from "@/lib/match-snapshot";
import { isRegularInningsTied } from "@/lib/super-over";
import { cn } from "@/lib/utils";

interface FullScorecardProps {
  onBack: () => void;
  showStartSecondInnings?: boolean;
  onStartSecondInnings?: () => void;
}

interface BattingRow {
  playerId: string;
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

function abbreviateTeamName(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

function formatDismissalShort(ball: BallData): string {
  if (ball.dismissal === "bowled") return `b ${ball.bowlerName}`;
  if (ball.dismissal === "lbw") return `lbw b ${ball.bowlerName}`;
  if (ball.dismissal === "caught")
    return `c ${ball.fielderName || "?"} b ${ball.bowlerName}`;
  if (ball.dismissal === "stumped")
    return `st ${ball.fielderName || "?"} b ${ball.bowlerName}`;
  if (ball.dismissal === "run-out")
    return `run out (${ball.fielderName || "?"})`;
  if (ball.dismissal === "retired-hurt") return "retired hurt";
  return ball.dismissal;
}

export default function FullScorecard({
  onBack,
  showStartSecondInnings = false,
  onStartSecondInnings,
}: FullScorecardProps) {
  const { matchState } = useCricket();
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<
    Record<string, boolean>
  >({});
  const innings2Available = Boolean(matchState.innings2);
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(() =>
    matchState.currentInnings === 2 && matchState.innings2 ? 2 : 1
  );

  useEffect(() => {
    if (matchState.currentInnings === 2 && matchState.innings2) {
      setActiveInningsTab(2);
    }
  }, [matchState.currentInnings, matchState.innings2]);

  const ballsPerOver = matchState.config?.ballsPerOver || 6;

  const calculateInningsTotal = (innings: InningsData | null) => {
    if (!innings) return { runs: 0, wickets: 0 };

    const runs = innings.balls.reduce(
      (total, ball) =>
        total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0),
      0
    );
    const wickets = innings.balls.filter((ball) =>
      countsAsWicket(ball.dismissal)
    ).length;

    return { runs, wickets };
  };

  const calculateOvers = (balls: BallData[]) => {
    const legalBalls = balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
    return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
  };

  const getLegalBallCount = (balls: BallData[]) =>
    balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;

  const calculateRunRate = (balls: BallData[], runs: number) => {
    const legalBalls = getLegalBallCount(balls);
    if (legalBalls === 0) return "0.00";
    return (runs / (legalBalls / ballsPerOver)).toFixed(2);
  };

  const buildBattingRows = (
    innings: InningsData,
    battingTeam: Team
  ): BattingRow[] => {
    return battingTeam.players.map((player) => {
      let runs = 0;
      let balls = 0;
      let fours = 0;
      let sixes = 0;
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

      const dismissalBall = innings.balls.find(
        (ball) =>
          ball.dismissal !== "none" && ball.dismissedPlayer === player.name
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

      const strikeRate =
        balls > 0 ? ((runs * 100) / balls).toFixed(2) : "0.00";

      return {
        playerId: player.id,
        name: player.name,
        runs,
        balls,
        fours,
        sixes,
        strikeRate,
        dismissal,
      };
    });
  };

  const getBattingDisplay = (innings: InningsData, battingTeam: Team) => {
    const allRows = buildBattingRows(innings, battingTeam);
    const atCrease = new Set([
      innings.strikerPlayerId,
      innings.nonStrikerPlayerId,
    ]);

    const displayed = allRows.filter(
      (row) =>
        row.balls > 0 ||
        row.dismissal !== "not out" ||
        atCrease.has(row.playerId)
    );

    const yetToBat = allRows
      .filter(
        (row) =>
          row.balls === 0 &&
          row.dismissal === "not out" &&
          !atCrease.has(row.playerId)
      )
      .map((row) => row.name);

    return { displayed, yetToBat, atCrease };
  };

  const calculateBowling = (
    innings: InningsData | null,
    bowlingTeam: Team,
    bpo: number = ballsPerOver
  ) => {
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
          byOver[ball.overNumber] =
            (byOver[ball.overNumber] || 0) + ball.extraRuns;
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

      const maidens = Object.values(byOver).filter(
        (overRuns) => overRuns === 0
      ).length;
      const economy =
        balls > 0 ? (runs / (balls / bpo)).toFixed(2) : "0.00";

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
        if (countsAsWicket(ball.dismissal)) return "W";
        if (ball.dismissal === "retired-hurt") return "RH";
        if (ball.extra === "wide") return `${ball.extraRuns}Wd`;
        if (ball.extra === "no-ball") return `${ball.extraRuns}Nb`;
        if (ball.extra === "bye") return `${ball.extraRuns}B`;
        if (ball.extra === "leg-bye") return `${ball.extraRuns}Lb`;
        if (ball.extra === "overthrow")
          return `${ball.runs + ball.extraRuns}OT`;
        return `${ball.runs}`;
      });
  };

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getInningsRuns = (innings: InningsData | null) => {
    if (!innings) return 0;
    return innings.balls.reduce(
      (total, ball) =>
        total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0),
      0
    );
  };

  const getLegalBalls = (innings: InningsData | null) => {
    if (!innings) return 0;
    return getLegalBallCount(innings.balls);
  };

  const getOversTextFromBalls = (balls: number) => {
    return `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
  };

  const renderInningsScorecard = (
    inningsNumber: 1 | 2,
    innings: InningsData | null,
    battingTeam: Team,
    bowlingTeam: Team,
    options?: {
      label?: string;
      ballsPerOverOverride?: number;
      useBallCount?: boolean;
    }
  ) => {
    if (!innings) return null;

    const inningsBallsPerOver = options?.ballsPerOverOverride ?? ballsPerOver;
    const totals = calculateInningsTotal(innings);
    const { displayed: battingRows, yetToBat, atCrease } = getBattingDisplay(
      innings,
      battingTeam
    );
    const bowlingRows = calculateBowling(innings, bowlingTeam, inningsBallsPerOver);
    const extras = calculateExtras(innings);
    const legalBalls = getLegalBallCount(innings.balls);
    const overs = options?.useBallCount
      ? `${legalBalls}/${inningsBallsPerOver} balls`
      : calculateOvers(innings.balls);
    const runRate =
      legalBalls > 0
        ? (totals.runs / (legalBalls / inningsBallsPerOver)).toFixed(2)
        : "0.00";
    const inningsLabel =
      options?.label ??
      `${battingTeam.name} ${inningsNumber === 1 ? "1st" : "2nd"} Innings`;

    return (
      <div className="cricket-scorecard-sheet">
        <div className="cricket-scorecard-innings-header">
          <span className="truncate">{inningsLabel}</span>
          <span className="cricket-scorecard-innings-header__score">
            {totals.runs}-{totals.wickets} (
            {options?.useBallCount ? overs : `${overs} Ov`})
          </span>
        </div>

        <div className="cricket-scorecard-section">
          <table className="cricket-scorecard-table">
            <thead>
              <tr>
                <th>Batter</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              {battingRows.map((row) => {
                const dismissalBall = innings.balls.find(
                  (ball) =>
                    ball.dismissal !== "none" &&
                    ball.dismissedPlayer === row.name
                );
                const isAtCrease =
                  atCrease.has(row.playerId) && row.dismissal === "not out";
                const dismissalShort = isAtCrease
                  ? null
                  : dismissalBall
                    ? formatDismissalShort(dismissalBall)
                    : null;

                return (
                  <tr key={row.playerId}>
                    <td>
                      <div className="cricket-scorecard-batter-name">
                        {row.name}
                      </div>
                      {isAtCrease ? (
                        <div className="cricket-scorecard-batter-meta cricket-scorecard-batter-meta--live">
                          batting
                        </div>
                      ) : dismissalShort ? (
                        <div className="cricket-scorecard-batter-meta">
                          {dismissalShort}
                        </div>
                      ) : null}
                    </td>
                    <td className="cricket-scorecard-stat-bold">{row.runs}</td>
                    <td>{row.balls}</td>
                    <td>{row.fours}</td>
                    <td>{row.sixes}</td>
                    <td>{row.strikeRate}</td>
                  </tr>
                );
              })}
              <tr className="cricket-scorecard-summary-row">
                <td>Extras</td>
                <td className="cricket-scorecard-stat-bold">{extras.total}</td>
                <td
                  colSpan={4}
                  className="cricket-scorecard-summary-detail"
                >
                  (b {extras.bye}, lb {extras.legBye}, w {extras.wide}, nb{" "}
                  {extras.noBall}, p 0)
                </td>
              </tr>
              <tr className="cricket-scorecard-summary-row">
                <td>Total</td>
                <td className="cricket-scorecard-stat-bold">
                  {totals.runs}-{totals.wickets}
                </td>
                <td colSpan={4} className="cricket-scorecard-summary-detail">
                  {options?.useBallCount
                    ? `${overs} (RR : ${runRate})`
                    : `${overs} Ov (RR : ${runRate})`}
                </td>
              </tr>
            </tbody>
          </table>

          {yetToBat.length > 0 && (
            <div className="cricket-scorecard-yet-to-bat">
              <p className="cricket-scorecard-yet-to-bat__label">Yet to bat</p>
              {yetToBat.map((name) => (
                <span
                  key={name}
                  className="cricket-scorecard-yet-to-bat__player"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="cricket-scorecard-section">
          <table className="cricket-scorecard-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>O</th>
                <th>M</th>
                <th>R</th>
                <th>W</th>
                <th>NB</th>
                <th>WD</th>
                <th>ECO</th>
                <th aria-hidden></th>
              </tr>
            </thead>
            <tbody>
              {bowlingRows.map((row) => {
                const bowlerKey = `${inningsLabel}-${row.name}`;
                const isExpanded = !!expandedBowlerKeys[bowlerKey];
                const ballByBall = getBowlerBallByBall(innings, row.name);

                return (
                  <Fragment key={row.name}>
                    <tr>
                      <td>
                        <span className="cricket-scorecard-bowler-name">
                          {row.name}
                        </span>
                      </td>
                      <td>
                        {options?.useBallCount
                          ? row.balls
                          : `${Math.floor(row.balls / inningsBallsPerOver)}.${row.balls % inningsBallsPerOver}`}
                      </td>
                      <td>{row.maidens}</td>
                      <td>{row.runs}</td>
                      <td className="cricket-scorecard-stat-bold">
                        {row.wickets}
                      </td>
                      <td>{row.noBalls}</td>
                      <td>{row.wides}</td>
                      <td>{row.economy}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleBowlerDetails(bowlerKey)}
                          className="cricket-scorecard-expand-btn"
                          aria-label={
                            isExpanded
                              ? "Collapse bowler details"
                              : "Expand bowler details"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9}>
                          <div className="cricket-scorecard-bbb">
                            <p className="cricket-scorecard-bbb__label">
                              Ball by ball
                            </p>
                            <div className="cricket-scorecard-bbb__chips">
                              {ballByBall.map((entry, idx) => (
                                <span
                                  key={`${row.name}-${idx}`}
                                  className="cricket-scorecard-bbb__chip"
                                >
                                  {entry}
                                </span>
                              ))}
                            </div>
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
    );
  };

  const superOver = matchState.superOver;
  const showSuperOverScorecard = Boolean(
    superOver?.innings1 &&
      (superOver.active || superOver.completed || superOver.settledAsDraw)
  );
  const mainMatchTied = isRegularInningsTied(matchState);

  const resolveTeamsForInnings = (innings: InningsData) => {
    const battingTeam =
      innings.teamId === matchState.team1.id
        ? matchState.team1
        : matchState.team2;
    const bowlingTeam =
      battingTeam.id === matchState.team1.id
        ? matchState.team2
        : matchState.team1;
    return { battingTeam, bowlingTeam };
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

        <section className="space-y-3">
          <div>
            <p className="cricket-eyebrow mb-1">Original match</p>
            {mainMatchTied && showSuperOverScorecard ? (
              <p className="text-sm font-semibold text-[var(--cricket-gold)]">
                Scores tied — see super over below
              </p>
            ) : (
              <p className="text-sm text-[oklch(0.58_0.03_255)]">
                Main innings
              </p>
            )}
          </div>

          <div className="cricket-scorecard-tabs">
            <button
              type="button"
              onClick={() => setActiveInningsTab(1)}
              className={cn(
                "cricket-scorecard-inn-tab",
                activeInningsTab === 1 && "cricket-scorecard-inn-tab--active"
              )}
            >
              {abbreviateTeamName(matchState.team1.name)} (1st Inn)
            </button>
            <button
              type="button"
              onClick={() => innings2Available && setActiveInningsTab(2)}
              disabled={!innings2Available}
              className={cn(
                "cricket-scorecard-inn-tab",
                activeInningsTab === 2 && "cricket-scorecard-inn-tab--active",
                !innings2Available && "cricket-scorecard-inn-tab--disabled"
              )}
            >
              {abbreviateTeamName(matchState.team2.name)} (2nd Inn)
            </button>
          </div>

          {activeInningsTab === 1 &&
            renderInningsScorecard(
              1,
              matchState.innings1,
              matchState.team1,
              matchState.team2
            )}

          {activeInningsTab === 2 &&
            innings2Available &&
            renderInningsScorecard(
              2,
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

            const chasingTeam =
              matchState.innings2?.teamName ?? matchState.team2.name;
            const target = innings1Runs + 1;
            const innings2Runs = getInningsRuns(matchState.innings2);
            const runsNeeded = Math.max(target - innings2Runs, 0);

            const totalLegalBalls =
              matchState.config.totalOvers * matchState.config.ballsPerOver;
            const legalBallsBowled = getLegalBalls(matchState.innings2);
            const ballsRemaining = Math.max(
              totalLegalBalls - legalBallsBowled,
              0
            );

            return (
              <div className="cricket-chase-banner">
                {chasingTeam} needs {runsNeeded} runs in{" "}
                {getOversTextFromBalls(ballsRemaining)} overs
              </div>
            );
          })()}
        </section>

        {showSuperOverScorecard && superOver?.innings1 ? (
          <section className="space-y-3 pt-4 border-t border-[oklch(0.32_0.04_255)]">
            <div>
              <p className="cricket-eyebrow mb-1">Super over</p>
              <p className="text-sm text-[oklch(0.58_0.03_255)]">
                Tie-breaker · {superOver.ballsPerOver} balls per team
              </p>
            </div>

            {superOver.innings1 &&
              (() => {
                const { battingTeam, bowlingTeam } =
                  resolveTeamsForInnings(superOver.innings1);
                return renderInningsScorecard(
                  1,
                  superOver.innings1,
                  battingTeam,
                  bowlingTeam,
                  {
                    label: `${battingTeam.name} · super over`,
                    ballsPerOverOverride: superOver.ballsPerOver,
                    useBallCount: true,
                  }
                );
              })()}

            {superOver.innings2 &&
              (() => {
                const { battingTeam, bowlingTeam } =
                  resolveTeamsForInnings(superOver.innings2);
                return renderInningsScorecard(
                  2,
                  superOver.innings2,
                  battingTeam,
                  bowlingTeam,
                  {
                    label: `${battingTeam.name} · super over`,
                    ballsPerOverOverride: superOver.ballsPerOver,
                    useBallCount: true,
                  }
                );
              })()}
          </section>
        ) : null}
      </div>
    </div>
  );
}
