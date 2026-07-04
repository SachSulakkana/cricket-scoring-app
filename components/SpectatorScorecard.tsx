"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BallData, InningsData, MatchState, Team } from "@/lib/cricket-types";
import {
  calculateBowling,
  calculateExtras,
  calculateInningsTotal,
  getBowlerBallByBall,
} from "@/lib/scorecard-stats";
import { cn } from "@/lib/utils";

interface SpectatorScorecardProps {
  matchState: MatchState;
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

function getLegalBallCount(balls: BallData[]) {
  return balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
}

function calculateOvers(balls: BallData[], ballsPerOver: number) {
  const legalBalls = getLegalBallCount(balls);
  return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
}

function calculateRunRate(balls: BallData[], runs: number, ballsPerOver: number) {
  const legalBalls = getLegalBallCount(balls);
  if (legalBalls === 0) return "0.00";
  return (runs / (legalBalls / ballsPerOver)).toFixed(2);
}

function buildBattingRows(innings: InningsData, battingTeam: Team) {
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
      const overthrowRuns = ball.extra === "overthrow" ? ball.extraRuns : 0;
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

    const strikeRate = balls > 0 ? ((runs * 100) / balls).toFixed(2) : "0.00";

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
}

function getBattingDisplay(innings: InningsData, battingTeam: Team) {
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
}

function InningsScorecard({
  inningsNumber,
  innings,
  battingTeam,
  bowlingTeam,
  ballsPerOver,
  expandedBowlerKeys,
  onToggleBowler,
}: {
  inningsNumber: 1 | 2;
  innings: InningsData;
  battingTeam: Team;
  bowlingTeam: Team;
  ballsPerOver: number;
  expandedBowlerKeys: Record<string, boolean>;
  onToggleBowler: (key: string) => void;
}) {
  const totals = calculateInningsTotal(innings);
  const { displayed: battingRows, yetToBat, atCrease } = getBattingDisplay(
    innings,
    battingTeam
  );
  const bowlingRows = calculateBowling(innings, bowlingTeam, ballsPerOver);
  const extras = calculateExtras(innings);
  const overs = calculateOvers(innings.balls, ballsPerOver);
  const runRate = calculateRunRate(innings.balls, totals.runs, ballsPerOver);
  const inningsLabel = `${battingTeam.name} ${inningsNumber === 1 ? "1st" : "2nd"} Innings`;

  return (
    <div className="cricket-scorecard-sheet">
      <div className="cricket-scorecard-innings-header">
        <span className="truncate">{inningsLabel}</span>
        <span className="cricket-scorecard-innings-header__score">
          {totals.runs}-{totals.wickets} ({overs} Ov)
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
                    <div className="cricket-scorecard-batter-name">{row.name}</div>
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
              <td colSpan={4} className="cricket-scorecard-summary-detail">
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
                {overs} Ov (RR : {runRate})
              </td>
            </tr>
          </tbody>
        </table>

        {yetToBat.length > 0 && (
          <div className="cricket-scorecard-yet-to-bat">
            <p className="cricket-scorecard-yet-to-bat__label">Yet to bat</p>
            {yetToBat.map((name) => (
              <span key={name} className="cricket-scorecard-yet-to-bat__player">
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
                      {Math.floor(row.balls / ballsPerOver)}.
                      {row.balls % ballsPerOver}
                    </td>
                    <td>{row.maidens}</td>
                    <td>{row.runs}</td>
                    <td className="cricket-scorecard-stat-bold">{row.wickets}</td>
                    <td>{row.noBalls}</td>
                    <td>{row.wides}</td>
                    <td>{row.economy}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onToggleBowler(bowlerKey)}
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
}

export default function SpectatorScorecard({ matchState }: SpectatorScorecardProps) {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const innings2Available = Boolean(matchState.innings2);
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(() =>
    matchState.currentInnings === 2 && matchState.innings2 ? 2 : 1
  );
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (matchState.currentInnings === 2 && matchState.innings2) {
      setActiveInningsTab(2);
    }
  }, [matchState.currentInnings, matchState.innings2]);

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInnings = (
    inningsNumber: 1 | 2,
    innings: InningsData | null,
    battingTeam: Team,
    bowlingTeam: Team
  ) => {
    if (!innings) return null;
    return (
      <InningsScorecard
        inningsNumber={inningsNumber}
        innings={innings}
        battingTeam={battingTeam}
        bowlingTeam={bowlingTeam}
        ballsPerOver={ballsPerOver}
        expandedBowlerKeys={expandedBowlerKeys}
        onToggleBowler={toggleBowlerDetails}
      />
    );
  };

  return (
    <div className="space-y-3">
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
        renderInnings(
          1,
          matchState.innings1,
          matchState.team1,
          matchState.team2
        )}

      {activeInningsTab === 2 &&
        innings2Available &&
        renderInnings(
          2,
          matchState.innings2,
          matchState.team2,
          matchState.team1
        )}
    </div>
  );
}
