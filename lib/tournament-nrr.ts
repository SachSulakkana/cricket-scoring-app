import type { InningsData } from "./cricket-types";
import { countsAsLegalBall, countsAsWicket } from "./cricket-types";
import type { TournamentFixtureResult, TournamentMatchSnapshot } from "./roster-types";

export interface TeamNrrTotals {
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
}

export function formatTournamentNrr(nrr: number | null): string {
  if (nrr == null || !Number.isFinite(nrr)) return "—";
  return `${nrr >= 0 ? "+" : ""}${nrr.toFixed(3)}`;
}

/** Points table display — show zeroed NRR before any match is played. */
export function formatStandingNrr(nrr: number | null, played: number): string {
  if (played === 0) return "+0.000";
  return formatTournamentNrr(nrr);
}

export function computeTournamentNrr(totals: TeamNrrTotals): number | null {
  const { runsScored, oversFaced, runsConceded, oversBowled } = totals;
  if (oversFaced <= 0 || oversBowled <= 0) return null;
  return runsScored / oversFaced - runsConceded / oversBowled;
}

function getInningsRuns(innings: InningsData): number {
  return innings.balls.reduce(
    (total, ball) =>
      total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0),
    0
  );
}

function getInningsWickets(innings: InningsData): number {
  return innings.balls.filter((ball) => countsAsWicket(ball.dismissal)).length;
}

function getOversFacedForNrr(
  innings: InningsData,
  maxWickets: number,
  totalOvers: number,
  ballsPerOver: number
): number {
  const legalBalls = innings.balls.filter((ball) =>
    countsAsLegalBall(ball)
  ).length;
  const wickets = getInningsWickets(innings);
  const isAllOut = maxWickets > 0 && wickets >= maxWickets;
  if (isAllOut) return totalOvers;
  return legalBalls / ballsPerOver;
}

function getBattingInnings(
  snapshot: TournamentMatchSnapshot,
  teamId: string
): InningsData | null {
  if (snapshot.innings1?.teamId === teamId) return snapshot.innings1;
  if (snapshot.innings2?.teamId === teamId) return snapshot.innings2;
  return null;
}

function getBowlingInnings(
  snapshot: TournamentMatchSnapshot,
  teamId: string
): InningsData | null {
  if (snapshot.innings1?.teamId === teamId) return snapshot.innings2;
  if (snapshot.innings2?.teamId === teamId) return snapshot.innings1;
  return null;
}

function maxWicketsForTeam(squadSize: number): number {
  return Math.max(squadSize - 1, 0);
}

/** Per-match runs/overs used for tournament net run rate (ICC-style). */
export function getMatchNrrContributions(
  result: TournamentFixtureResult,
  teamId: string,
  squadSize: number,
  config: { totalOvers: number; ballsPerOver: number }
): TeamNrrTotals | null {
  const snapshot = result.scorecard;
  if (!snapshot) return null;

  const batting = getBattingInnings(snapshot, teamId);
  const bowling = getBowlingInnings(snapshot, teamId);
  if (!batting || !bowling) return null;

  const maxWickets = maxWicketsForTeam(squadSize);
  const totalOvers = snapshot.config?.totalOvers ?? config.totalOvers;
  const ballsPerOver = snapshot.config?.ballsPerOver ?? config.ballsPerOver;

  const runsScored = getInningsRuns(batting);
  const oversFaced = getOversFacedForNrr(
    batting,
    maxWickets,
    totalOvers,
    ballsPerOver
  );
  const runsConceded = getInningsRuns(bowling);
  const opponentSquad =
    snapshot.team1.id === bowling.teamId
      ? snapshot.team1.players.length
      : snapshot.team2.id === bowling.teamId
        ? snapshot.team2.players.length
        : squadSize;
  const oversBowled = getOversFacedForNrr(
    bowling,
    maxWicketsForTeam(opponentSquad),
    totalOvers,
    ballsPerOver
  );

  if (oversFaced <= 0 || oversBowled <= 0) return null;

  return { runsScored, oversFaced, runsConceded, oversBowled };
}

export function addNrrTotals(
  current: TeamNrrTotals,
  match: TeamNrrTotals
): TeamNrrTotals {
  return {
    runsScored: current.runsScored + match.runsScored,
    oversFaced: current.oversFaced + match.oversFaced,
    runsConceded: current.runsConceded + match.runsConceded,
    oversBowled: current.oversBowled + match.oversBowled,
  };
}

export function emptyNrrTotals(): TeamNrrTotals {
  return {
    runsScored: 0,
    oversFaced: 0,
    runsConceded: 0,
    oversBowled: 0,
  };
}
