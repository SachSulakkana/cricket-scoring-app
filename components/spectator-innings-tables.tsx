"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { InningsData, Team } from "@/lib/cricket-types";
import {
  calculateExtras,
  calculateInningsTotal,
  formatDismissalShort,
  getBowlerBallByBall,
  getEffectiveDismissalBall,
} from "@/lib/scorecard-stats";
import {
  calculateOvers,
  calculateRunRate,
  getBattingDisplay,
  getInningsHeader,
  getBowlingRows,
  type InningsViewContext,
} from "@/lib/spectator-scorecard-innings";

interface InningsHeaderProps {
  ctx: InningsViewContext;
}

export function SpectatorInningsHeader({ ctx }: InningsHeaderProps) {
  const { label, score } = getInningsHeader(ctx);
  return (
    <div className="cricket-scorecard-innings-header">
      <span className="truncate">{label}</span>
      <span className="cricket-scorecard-innings-header__score">{score}</span>
    </div>
  );
}

interface BattingTableProps {
  ctx: InningsViewContext;
  embedMode?: boolean;
}

export function SpectatorInningsBattingTable({
  ctx,
  embedMode = false,
}: BattingTableProps) {
  const { innings, battingTeam, ballsPerOver } = ctx;
  const totals = calculateInningsTotal(innings);
  const { displayed: battingRows, yetToBat, atCrease } = getBattingDisplay(
    innings,
    battingTeam
  );
  const extras = calculateExtras(innings);
  const overs = calculateOvers(innings.balls, ballsPerOver);
  const runRate = calculateRunRate(innings.balls, totals.runs, ballsPerOver);

  return (
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
            const dismissalBall = getEffectiveDismissalBall(
              innings,
              row.name,
              row.playerId
            );
            const isAtCrease =
              atCrease.has(row.playerId) && row.dismissal === "not out";
            const dismissalShort = isAtCrease
              ? null
              : dismissalBall
                ? formatDismissalShort(dismissalBall)
                : null;
            const batterMeta = isAtCrease ? "batting" : dismissalShort;

            return (
              <tr key={row.playerId}>
                <td>
                  {embedMode ? (
                    <div className="cricket-scorecard-batter-line">
                      <span className="cricket-scorecard-batter-name">
                        {row.name}
                      </span>
                      {batterMeta ? (
                        <span
                          className={[
                            "cricket-scorecard-batter-meta",
                            isAtCrease
                              ? "cricket-scorecard-batter-meta--live"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {batterMeta}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </td>
                <td className="cricket-scorecard-stat-bold">{row.runs}</td>
                <td>{row.balls}</td>
                <td>{row.fours}</td>
                <td>{row.sixes}</td>
                <td>{row.strikeRate}</td>
              </tr>
            );
          })}
          {embedMode && yetToBat.length > 0 ? (
            <>
              <tr className="cricket-scorecard-did-not-bat-banner">
                <td colSpan={6}>Did not bat yet</td>
              </tr>
              {yetToBat.map((name) => (
                <tr key={name} className="cricket-scorecard-did-not-bat-player">
                  <td>
                    <span className="cricket-scorecard-batter-name">{name}</span>
                  </td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              ))}
            </>
          ) : null}
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

      {yetToBat.length > 0 && !embedMode && (
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
  );
}

interface BowlingTableProps {
  ctx: InningsViewContext;
  embedMode?: boolean;
  expandedBowlerKeys?: Record<string, boolean>;
  onToggleBowler?: (key: string) => void;
}

export function SpectatorInningsBowlingTable({
  ctx,
  embedMode = false,
  expandedBowlerKeys = {},
  onToggleBowler,
}: BowlingTableProps) {
  const { innings, battingTeam, ballsPerOver } = ctx;
  const bowlingRows = getBowlingRows(ctx);
  const inningsLabel = `${battingTeam.name} ${ctx.inningsNumber === 1 ? "1st" : "2nd"} Innings`;

  return (
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
            {!embedMode ? <th aria-hidden></th> : null}
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
                  {!embedMode && onToggleBowler ? (
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
                  ) : null}
                </tr>
                {!embedMode && isExpanded && (
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
  );
}

export function SpectatorInningsScorecardSheet({
  ctx,
  mode,
  embedMode = false,
  expandedBowlerKeys,
  onToggleBowler,
}: {
  ctx: InningsViewContext;
  mode: "batting" | "bowling";
  embedMode?: boolean;
  expandedBowlerKeys?: Record<string, boolean>;
  onToggleBowler?: (key: string) => void;
}) {
  return (
    <div className="cricket-scorecard-sheet">
      <SpectatorInningsHeader ctx={ctx} />
      {mode === "batting" ? (
        <SpectatorInningsBattingTable ctx={ctx} embedMode={embedMode} />
      ) : (
        <SpectatorInningsBowlingTable
          ctx={ctx}
          embedMode
          expandedBowlerKeys={expandedBowlerKeys}
          onToggleBowler={onToggleBowler}
        />
      )}
    </div>
  );
}
