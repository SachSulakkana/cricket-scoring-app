import type { InningsData, MatchState } from "./cricket-types";
import {
  getInningsRuns,
  getInningsWickets,
} from "./spectator-live-stats";

/** Maximum legal balls selectable for a super over. */
export const SUPER_OVER_MAX_BALLS = 6;

/** Default legal balls per team in a super over. */
export const SUPER_OVER_BALLS = 6;

export function getSuperOverInningsForTeam(
  superOver: NonNullable<MatchState["superOver"]>,
  teamId: string
): InningsData | null {
  if (superOver.innings1?.teamId === teamId) return superOver.innings1;
  if (superOver.innings2?.teamId === teamId) return superOver.innings2;
  return null;
}

function superOverTeamRuns(
  superOver: NonNullable<MatchState["superOver"]>,
  teamId: string
): number {
  const innings = getSuperOverInningsForTeam(superOver, teamId);
  return innings ? getInningsRuns(innings) : 0;
}

function superOverTeamWickets(
  superOver: NonNullable<MatchState["superOver"]>,
  teamId: string
): number {
  const innings = getSuperOverInningsForTeam(superOver, teamId);
  return innings ? getInningsWickets(innings) : 0;
}

export function isRegularInningsTied(state: MatchState): boolean {
  if (!state.innings1 || !state.innings2) return false;
  return (
    getInningsRuns(state.innings1) === getInningsRuns(state.innings2)
  );
}

export function isSuperOverInningsTied(state: MatchState): boolean {
  const superOver = state.superOver;
  if (!superOver?.innings1 || !superOver.innings2) return false;
  return (
    getInningsRuns(superOver.innings1) === getInningsRuns(superOver.innings2)
  );
}

export function getSuperOverWinnerTeamId(
  state: MatchState
): string | null {
  const superOver = state.superOver;
  if (!superOver?.completed || !superOver.innings1 || !superOver.innings2) {
    return null;
  }

  const runs1 = superOverTeamRuns(superOver, state.team1.id);
  const runs2 = superOverTeamRuns(superOver, state.team2.id);
  if (runs1 === runs2) return null;
  return runs1 > runs2 ? state.team1.id : state.team2.id;
}

export function getSuperOverResultText(state: MatchState): string | null {
  const winnerId = getSuperOverWinnerTeamId(state);
  if (!winnerId) {
    if (state.superOver?.completed) return "Super over tied";
    return null;
  }
  const winner =
    winnerId === state.team1.id ? state.team1.name : state.team2.name;
  return `${winner} wins the super over`;
}

export function getSuperOverTeamTotals(state: MatchState, teamId: string) {
  const superOver = state.superOver;
  if (!superOver) return { runs: 0, wickets: 0 };
  return {
    runs: superOverTeamRuns(superOver, teamId),
    wickets: superOverTeamWickets(superOver, teamId),
  };
}
