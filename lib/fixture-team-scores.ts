import type { InningsData, MatchState, Team } from "@/lib/cricket-types";
import type { TournamentMatchSnapshot } from "@/lib/roster-types";
import {
  getInningsRuns,
  getInningsWickets,
} from "@/lib/spectator-live-stats";

type InningsSource = {
  innings1: InningsData | null;
  innings2: InningsData | null;
  team1?: Team;
  team2?: Team;
};

/** Resolve which innings a fixture/roster team batted in (id, name, then batting order). */
export function getBattingInningsForTeam(
  source: InningsSource,
  team: Team
): InningsData | null {
  if (source.innings1?.teamId && source.innings1.teamId === team.id) {
    return source.innings1;
  }
  if (source.innings2?.teamId && source.innings2.teamId === team.id) {
    return source.innings2;
  }

  const name = team.name.trim().toLowerCase();
  if (name) {
    if (source.innings1?.teamName?.trim().toLowerCase() === name) {
      return source.innings1;
    }
    if (source.innings2?.teamName?.trim().toLowerCase() === name) {
      return source.innings2;
    }
  }

  // Match batting order: team1 bats innings1, team2 bats innings2.
  if (source.team1?.id === team.id) return source.innings1;
  if (source.team2?.id === team.id) return source.innings2;

  return null;
}

export function getTeamInningsTotals(
  source: InningsSource,
  team: Team
): { runs: number; wickets: number } {
  const batting = getBattingInningsForTeam(source, team);
  if (!batting) return { runs: 0, wickets: 0 };
  return {
    runs: getInningsRuns(batting),
    wickets: getInningsWickets(batting),
  };
}

export function getTeamInningsTotalsFromMatch(
  matchState: MatchState,
  team: Team
): { runs: number; wickets: number } {
  return getTeamInningsTotals(
    {
      innings1: matchState.innings1,
      innings2: matchState.innings2,
      team1: matchState.team1,
      team2: matchState.team2,
    },
    team
  );
}

export function getTeamInningsTotalsFromScorecard(
  scorecard: TournamentMatchSnapshot | undefined,
  team: Team
): { runs: number; wickets: number } {
  if (!scorecard) return { runs: 0, wickets: 0 };
  return getTeamInningsTotals(
    {
      innings1: scorecard.innings1,
      innings2: scorecard.innings2,
      team1: scorecard.team1,
      team2: scorecard.team2,
    },
    team
  );
}

/**
 * Prefer totals rebuilt from the persisted scorecard when ball data exists;
 * otherwise use the stored runs/wickets on the fixture result.
 */
export function resolveFixtureDisplayScores(
  teamA: Team,
  teamB: Team,
  result:
    | {
        runsA?: number;
        wicketsA?: number;
        runsB?: number;
        wicketsB?: number;
        scorecard?: TournamentMatchSnapshot;
      }
    | undefined
): { runsA: number; wicketsA: number; runsB: number; wicketsB: number } {
  const scorecard = result?.scorecard;
  const hasBalls =
    Boolean(scorecard?.innings1?.balls.length) ||
    Boolean(scorecard?.innings2?.balls.length);

  if (hasBalls) {
    const fromA = getTeamInningsTotalsFromScorecard(scorecard, teamA);
    const fromB = getTeamInningsTotalsFromScorecard(scorecard, teamB);
    return {
      runsA: fromA.runs,
      wicketsA: fromA.wickets,
      runsB: fromB.runs,
      wicketsB: fromB.wickets,
    };
  }

  return {
    runsA: result?.runsA ?? 0,
    wicketsA: result?.wicketsA ?? 0,
    runsB: result?.runsB ?? 0,
    wicketsB: result?.wicketsB ?? 0,
  };
}
