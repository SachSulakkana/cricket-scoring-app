"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { InningsData } from "@/lib/cricket-types";
import type { TournamentMatchSnapshot } from "@/lib/roster-storage";
import { hasPersistedSuperOver } from "@/lib/match-snapshot";
import {
  calculateBatting,
  calculateBowling,
  calculateExtras,
  calculateInningsTotal,
  calculateOvers,
  formatDismissalShort,
  getBowlerBallByBall,
  getLegalBallCount,
  resolveBattingBowlingTeams,
} from "@/lib/scorecard-stats";

interface TournamentMatchScorecardViewProps {
  snapshot: TournamentMatchSnapshot;
}

export default function TournamentMatchScorecardView({
  snapshot,
}: TournamentMatchScorecardViewProps) {
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<
    Record<string, boolean>
  >({});
  const ballsPerOver = snapshot.config.ballsPerOver;

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInningsScorecard = (
    innings: InningsData | null,
    ballsPerOverOverride?: number,
    titleSuffix?: string
  ) => {
    if (!innings) return null;

    const ballsPerOverForInnings = ballsPerOverOverride ?? ballsPerOver;
    const useBallCount = Boolean(ballsPerOverOverride);

    const { battingTeam, bowlingTeam } = resolveBattingBowlingTeams(
      innings,
      snapshot.team1,
      snapshot.team2
    );
    const totals = calculateInningsTotal(innings);
    const battingRows = calculateBatting(innings, battingTeam).filter(
      (row) => row.balls > 0 || row.dismissal !== "not out"
    );
    const bowlingRows = calculateBowling(
      innings,
      bowlingTeam,
      ballsPerOverForInnings
    );
    const extras = calculateExtras(innings);
    const legalBalls = getLegalBallCount(innings.balls);
    const overs = useBallCount
      ? `${legalBalls}/${ballsPerOverForInnings} balls`
      : calculateOvers(innings.balls, ballsPerOverForInnings);
    const runRate =
      legalBalls > 0
        ? (totals.runs / (legalBalls / ballsPerOverForInnings)).toFixed(2)
        : "0.00";
    const title = titleSuffix ?? `${innings.teamName} innings`;

    return (
      <div key={innings.teamId} className="cricket-scorecard-sheet">
        <div className="cricket-scorecard-innings-header">
          <span className="truncate">{title}</span>
          <span className="cricket-scorecard-innings-header__score">
            {totals.runs}-{totals.wickets} (
            {useBallCount ? overs : `${overs} Ov`})
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
              {battingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-[oklch(0.58_0.03_255)]">
                    No batting data
                  </td>
                </tr>
              ) : (
                battingRows.map((row) => {
                  const dismissalBall = innings.balls.find(
                    (ball) =>
                      ball.dismissal !== "none" &&
                      ball.dismissedPlayer === row.name
                  );
                  const dismissalShort = dismissalBall
                    ? formatDismissalShort(dismissalBall)
                    : null;

                  return (
                    <tr key={row.name}>
                      <td>
                        <div className="cricket-scorecard-batter-name">
                          {row.name}
                        </div>
                        {dismissalShort ? (
                          <div className="cricket-scorecard-batter-meta">
                            {dismissalShort}
                          </div>
                        ) : row.dismissal === "not out" ? (
                          <div className="cricket-scorecard-batter-meta">
                            not out
                          </div>
                        ) : null}
                      </td>
                      <td className="cricket-scorecard-stat-bold">
                        {row.runs}
                      </td>
                      <td>{row.balls}</td>
                      <td>{row.fours}</td>
                      <td>{row.sixes}</td>
                      <td>{row.strikeRate}</td>
                    </tr>
                  );
                })
              )}
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
                  {useBallCount
                    ? `${overs} (RR : ${runRate})`
                    : `${overs} Ov (RR : ${runRate})`}
                </td>
              </tr>
            </tbody>
          </table>
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
              {bowlingRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-[oklch(0.58_0.03_255)]">
                    No bowling data
                  </td>
                </tr>
              ) : (
                bowlingRows.map((row) => {
                  const bowlerKey = `${title}-${row.name}`;
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
                          {useBallCount
                            ? row.balls
                            : `${Math.floor(row.balls / ballsPerOverForInnings)}.${row.balls % ballsPerOverForInnings}`}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="text-center sm:text-left">
          <p className="cricket-eyebrow mb-1">Original match</p>
          {snapshot.mainMatchTied ? (
            <p className="text-sm font-semibold text-[var(--cricket-gold)]">
              Scores tied — match level on runs
            </p>
          ) : (
            <p className="text-sm text-[oklch(0.58_0.03_255)]">
              Main innings scorecard
            </p>
          )}
        </div>
        {renderInningsScorecard(
          snapshot.innings1,
          undefined,
          `${snapshot.team1.name} · 1st innings`
        )}
        {renderInningsScorecard(
          snapshot.innings2,
          undefined,
          `${snapshot.team2.name} · 2nd innings`
        )}
      </section>

      {hasPersistedSuperOver(snapshot.superOver) && snapshot.superOver ? (
        <section className="space-y-4 pt-2 border-t border-[oklch(0.32_0.04_255)]">
          <div className="text-center sm:text-left">
            <p className="cricket-eyebrow mb-1">Super over</p>
            <p className="text-sm text-[oklch(0.58_0.03_255)]">
              Tie-breaker · {snapshot.superOver.ballsPerOver} balls per team
            </p>
          </div>
          {renderInningsScorecard(
            snapshot.superOver.innings1,
            snapshot.superOver.ballsPerOver,
            `${snapshot.superOver.innings1?.teamName ?? "Team"} · super over`
          )}
          {renderInningsScorecard(
            snapshot.superOver.innings2,
            snapshot.superOver.ballsPerOver,
            `${snapshot.superOver.innings2?.teamName ?? "Team"} · super over`
          )}
        </section>
      ) : null}
    </div>
  );
}
