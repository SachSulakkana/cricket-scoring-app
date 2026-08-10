"use client";

import type { CSSProperties } from "react";
import type { MatchState, Team } from "@/lib/cricket-types";
import {
  calculateExtras,
  calculateInningsTotal,
} from "@/lib/scorecard-stats";
import {
  calculateOvers,
  getBowlingRows,
  getFallOfWickets,
  splitBroadcastPlayerName,
  type InningsViewContext,
} from "@/lib/spectator-scorecard-innings";

const FOW_SLOTS = 10;

function formatOversLabel(overs: string): string {
  // "45.0" → "45"; keep incomplete overs like "12.3"
  return overs.endsWith(".0") ? overs.slice(0, -2) : overs;
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function HeaderTeamLogo({ team }: { team: Team }) {
  return (
    <span className="live-embed-bowling__logo" title={team.name}>
      {team.logoUrl ? (
        <img
          src={team.logoUrl}
          alt=""
          className="live-embed-bowling__logo-img"
        />
      ) : (
        <span className="live-embed-bowling__logo-fallback" aria-hidden>
          {teamInitials(team.name) || "?"}
        </span>
      )}
    </span>
  );
}

export function LiveEmbedBowlingBroadcast({
  ctx,
  matchState,
  title,
}: {
  ctx: InningsViewContext;
  matchState: MatchState;
  title: string;
}) {
  const bowlingRows = getBowlingRows(ctx);
  const totals = calculateInningsTotal(ctx.innings);
  const extras = calculateExtras(ctx.innings);
  const overs = calculateOvers(ctx.innings.balls, ctx.ballsPerOver);
  const fallScores = getFallOfWickets(ctx.innings);
  const inningsOrdinal = ctx.inningsNumber === 1 ? "1st" : "2nd";

  return (
    <div
      className="live-embed-bowling"
      style={
        {
          "--embed-bowl-rows": Math.max(bowlingRows.length, 1),
        } as CSSProperties
      }
    >
      <header className="live-embed-bowling__header">
        <div className="live-embed-bowling__banner">
          <HeaderTeamLogo team={matchState.team1} />
          <div className="live-embed-bowling__banner-center">
            <div className="live-embed-bowling__names">
              <span className="live-embed-scorecard__team">
                {matchState.team1.name}
              </span>
              <span className="live-embed-scorecard__vs" aria-hidden>
                Vs
              </span>
              <span className="live-embed-scorecard__team">
                {matchState.team2.name}
              </span>
            </div>
            <h2 className="live-embed-scorecard__title live-embed-scorecard__title--kind">
              {title}
            </h2>
          </div>
          <HeaderTeamLogo team={matchState.team2} />
        </div>
      </header>

      <div className="live-embed-bowling__table-wrap">
        <table className="live-embed-bowling__table" aria-label="Bowling scorecard">
          <thead>
            <tr>
              <th className="live-embed-bowling__col-name" scope="col" />
              <th scope="col">Overs</th>
              <th scope="col">Maidens</th>
              <th scope="col">Runs</th>
              <th scope="col">Wickets</th>
              <th scope="col">WD</th>
              <th scope="col">NB</th>
              <th scope="col">Economy</th>
            </tr>
          </thead>
          <tbody>
            {bowlingRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="live-embed-bowling__empty">
                  No bowling yet
                </td>
              </tr>
            ) : (
              bowlingRows.map((row) => {
                const { given, family } = splitBroadcastPlayerName(row.name);
                const oversBowled = `${Math.floor(row.balls / ctx.ballsPerOver)}.${
                  row.balls % ctx.ballsPerOver
                }`;
                return (
                  <tr key={row.name}>
                    <td className="live-embed-bowling__col-name">
                      <span className="live-embed-bowling__name">
                        {given ? (
                          <span className="live-embed-bowling__given">
                            {given}{" "}
                          </span>
                        ) : null}
                        <span className="live-embed-bowling__family">
                          {family}
                        </span>
                      </span>
                    </td>
                    <td>{oversBowled}</td>
                    <td>{row.maidens}</td>
                    <td>{row.runs}</td>
                    <td>{row.wickets}</td>
                    <td>{row.wides}</td>
                    <td>{row.noBalls}</td>
                    <td>{row.economy}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="live-embed-bowling__spacer" aria-hidden />

      <footer className="live-embed-bowling__footer">
        <div className="live-embed-bowling__fow">
          <div className="live-embed-bowling__fow-head">
            <img
              src="/logo.png"
              alt=""
              className="live-embed-bowling__fow-logo"
              width={40}
              height={40}
            />
            <span className="live-embed-bowling__fow-badge">
              Fall of wickets
            </span>
          </div>
          <div
            className="live-embed-bowling__fow-grid"
            role="table"
            aria-label="Fall of wickets"
          >
            <div className="live-embed-bowling__fow-row" role="row">
              {Array.from({ length: FOW_SLOTS }, (_, i) => (
                <span
                  key={`w-${i + 1}`}
                  className="live-embed-bowling__fow-cell live-embed-bowling__fow-cell--wicket"
                  role="columnheader"
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="live-embed-bowling__fow-row" role="row">
              {Array.from({ length: FOW_SLOTS }, (_, i) => (
                <span
                  key={`s-${i + 1}`}
                  className="live-embed-bowling__fow-cell live-embed-bowling__fow-cell--score"
                  role="cell"
                >
                  {fallScores[i] != null ? fallScores[i] : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="live-embed-bowling__footer-rule" aria-hidden />

        <div className="live-embed-bowling__summary">
          <span className="live-embed-bowling__innings">
            {inningsOrdinal} Innings
          </span>
          <div className="live-embed-bowling__score-block">
            <p className="live-embed-bowling__score-line">
              <span className="live-embed-bowling__score-team">
                {ctx.battingTeam.name}
              </span>{" "}
              <span className="live-embed-bowling__score">
                {totals.runs}-{totals.wickets}
              </span>
            </p>
            <p className="live-embed-bowling__meta">
              {formatOversLabel(overs)} Overs
              <span className="live-embed-bowling__meta-sep" aria-hidden>
                |
              </span>
              {extras.total} Extras
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
