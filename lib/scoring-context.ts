import type { InningsData, MatchConfig, MatchState, Team } from "./cricket-types";

export interface ActiveScoringContext {
  isSuperOver: boolean;
  config: MatchConfig;
  currentInningsNumber: 1 | 2;
  battingTeam: Team;
  bowlingTeam: Team;
  currentInnings: InningsData;
  innings1: InningsData | null;
  innings2: InningsData | null;
  team1: Team;
  team2: Team;
  maxWickets: number;
}

function emptyInnings(team: Team): InningsData {
  return {
    teamId: team.id,
    teamName: team.name,
    balls: [],
    currentBatsmanIndex: 0,
    currentBowlerIndex: 0,
    strikerPlayerId: "",
    nonStrikerPlayerId: "",
    currentBowlerPlayerId: "",
    currentOverBowlerPlayerIds: [],
  };
}

export function getActiveScoringContext(
  state: MatchState
): ActiveScoringContext | null {
  if (!state.matchStarted || !state.config) return null;

  const superOver = state.superOver;
  if (superOver?.active && !superOver.completed) {
    const firstBattingTeam =
      superOver.firstBattingTeamId === state.team1.id
        ? state.team1
        : state.team2;
    const secondBattingTeam =
      firstBattingTeam.id === state.team1.id ? state.team2 : state.team1;
    const battingTeam =
      superOver.currentInnings === 1 ? firstBattingTeam : secondBattingTeam;
    const bowlingTeam =
      superOver.currentInnings === 1 ? secondBattingTeam : firstBattingTeam;
    const currentInnings =
      superOver.currentInnings === 1 ? superOver.innings1 : superOver.innings2;
    if (!currentInnings) return null;

    return {
      isSuperOver: true,
      config: { totalOvers: 1, ballsPerOver: superOver.ballsPerOver },
      currentInningsNumber: superOver.currentInnings,
      battingTeam,
      bowlingTeam,
      currentInnings,
      innings1: superOver.innings1,
      innings2: superOver.innings2,
      team1: state.team1,
      team2: state.team2,
      maxWickets: Math.min(
        2,
        Math.max(battingTeam.players.length - 1, 0)
      ),
    };
  }

  const currentInnings =
    state.currentInnings === 1 ? state.innings1 : state.innings2;
  if (!currentInnings) return null;

  const battingTeam =
    state.currentInnings === 1 ? state.team1 : state.team2;
  const bowlingTeam =
    state.currentInnings === 1 ? state.team2 : state.team1;

  return {
    isSuperOver: false,
    config: state.config,
    currentInningsNumber: state.currentInnings,
    battingTeam,
    bowlingTeam,
    currentInnings,
    innings1: state.innings1,
    innings2: state.innings2,
    team1: state.team1,
    team2: state.team2,
    maxWickets: Math.max(battingTeam.players.length - 1, 0),
  };
}

export function createSuperOverInnings(team: Team): InningsData {
  return emptyInnings(team);
}
