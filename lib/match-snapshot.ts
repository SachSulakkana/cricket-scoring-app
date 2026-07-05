import type { MatchConfig, MatchState, SuperOverState } from "./cricket-types";
import type { TournamentMatchSnapshot } from "./roster-types";
import { isRegularInningsTied } from "./super-over";

export function hasPersistedSuperOver(
  superOver: SuperOverState | null | undefined
): superOver is SuperOverState {
  if (!superOver) return false;
  return Boolean(
    superOver.innings1 &&
      (superOver.completed || superOver.settledAsDraw || superOver.innings2)
  );
}

export function buildPersistedMatchSnapshot(
  matchState: MatchState,
  fallbackConfig?: MatchConfig
): TournamentMatchSnapshot {
  return {
    team1: matchState.team1,
    team2: matchState.team2,
    config: matchState.config ??
      fallbackConfig ?? { totalOvers: 20, ballsPerOver: 6 },
    innings1: matchState.innings1,
    innings2: matchState.innings2,
    mainMatchTied: isRegularInningsTied(matchState),
    superOver: hasPersistedSuperOver(matchState.superOver)
      ? matchState.superOver
      : undefined,
  };
}
