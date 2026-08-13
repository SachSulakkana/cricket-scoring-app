import type { MatchState } from "./cricket-types";

/** Quick match still being scored (not finished summary / settled draw). */
export function isQuickMatchInProgress(state: MatchState): boolean {
  if (!state.matchStarted) return false;
  if (state.superOver?.settledAsDraw) return false;
  if (state.superOver?.completed) return false;
  return true;
}

export function countRecordedBalls(state: MatchState): number {
  let count = 0;
  count += state.innings1?.balls.length ?? 0;
  count += state.innings2?.balls.length ?? 0;
  count += state.superOver?.innings1?.balls.length ?? 0;
  count += state.superOver?.innings2?.balls.length ?? 0;
  return count;
}
