import type { InningsData, MatchState, Team } from "./cricket-types";
import {
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "./spectator-live-stats";

function getBattingTeamForInnings(
  matchState: MatchState,
  innings: InningsData
): Team {
  if (innings.teamId === matchState.team1.id) return matchState.team1;
  if (innings.teamId === matchState.team2.id) return matchState.team2;
  return matchState.currentInnings === 1 ? matchState.team1 : matchState.team2;
}

export function isInningsComplete(
  matchState: MatchState,
  innings: InningsData
): boolean {
  if (!matchState.config) return false;

  const legalBalls = getLegalBalls(innings);
  const wickets = getInningsWickets(innings);
  const battingTeam = getBattingTeamForInnings(matchState, innings);
  const maxWickets = Math.max(battingTeam.players.length - 1, 0);
  const maxLegalBalls =
    matchState.config.totalOvers * matchState.config.ballsPerOver;

  const isOversFinished = legalBalls >= maxLegalBalls;
  const isAllOut = wickets >= maxWickets;

  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const isTargetReached =
    matchState.currentInnings === 2 &&
    innings === matchState.innings2 &&
    innings2Runs > innings1Runs;

  return isOversFinished || isAllOut || isTargetReached;
}

export function isMatchComplete(matchState: MatchState): boolean {
  if (!matchState.matchStarted || matchState.currentInnings !== 2) return false;

  const innings1 = matchState.innings1;
  const innings2 = matchState.innings2;
  if (!innings1 || !innings2 || innings1.balls.length === 0) return false;

  return isInningsComplete(matchState, innings2);
}

export interface MatchResult {
  text: string;
  winnerTeamId: string | null;
  isTie: boolean;
}

export function getMatchResult(matchState: MatchState): MatchResult {
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const innings2Wickets = getInningsWickets(matchState.innings2);

  if (innings1Runs > innings2Runs) {
    return {
      text: `${matchState.team1.name} wins by ${innings1Runs - innings2Runs} runs`,
      winnerTeamId: matchState.team1.id,
      isTie: false,
    };
  }

  if (innings2Runs > innings1Runs) {
    const totalWickets = Math.max(matchState.team2.players.length - 1, 0);
    const wicketsInHand = Math.max(totalWickets - innings2Wickets, 0);
    return {
      text: `${matchState.team2.name} wins by ${wicketsInHand} wickets`,
      winnerTeamId: matchState.team2.id,
      isTie: false,
    };
  }

  return {
    text: "Match tied — honours even",
    winnerTeamId: null,
    isTie: true,
  };
}
