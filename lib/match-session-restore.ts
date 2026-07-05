import type { MatchState, Team } from "./cricket-types";
import { isInningsComplete, isMatchComplete } from "./match-result";
import {
  draftMatchesSession,
  loadLiveMatchDraftLocal,
  type LiveMatchDraft,
} from "./live-match-draft";
import type { LiveMatchMeta } from "./store/match-slice";
import { liveMetaMatches } from "./store/match-slice";

export type QuickMatchPage =
  | "setup"
  | "toss"
  | "scoring"
  | "summary"
  | "scorecard";

export type TournamentMatchPage =
  | "toss"
  | "lineup"
  | "scoring"
  | "scorecard"
  | "finished";

export function loadPersistedLiveDraft(): LiveMatchDraft | null {
  const local = loadLiveMatchDraftLocal();
  if (!local?.matchState.matchStarted) return null;
  return local;
}

export function sessionHasLiveMatch(
  matchState: MatchState,
  meta: LiveMatchMeta | null,
  sessionMeta: LiveMatchMeta
): boolean {
  return (
    matchState.matchStarted &&
    liveMetaMatches(meta, sessionMeta)
  );
}

export function draftHasLiveMatch(
  draft: LiveMatchDraft | null,
  sessionMeta: LiveMatchMeta
): boolean {
  return Boolean(
    draft?.matchState.matchStarted && draftMatchesSession(draft, sessionMeta)
  );
}

export function deriveQuickMatchPage(matchState: MatchState): QuickMatchPage {
  if (!matchState.matchStarted) return "setup";
  if (matchState.superOver?.settledAsDraw || matchState.superOver?.completed) {
    return "summary";
  }
  if (matchState.superOver?.active) return "scoring";
  if (isMatchComplete(matchState)) return "summary";
  if (
    matchState.innings1 &&
    matchState.currentInnings === 1 &&
    isInningsComplete(matchState, matchState.innings1)
  ) {
    return "scorecard";
  }
  return "scoring";
}

export function deriveTournamentMatchPage(
  matchState: MatchState
): TournamentMatchPage {
  if (!matchState.matchStarted) return "toss";
  if (matchState.superOver?.settledAsDraw || matchState.superOver?.completed) {
    return "finished";
  }
  if (matchState.superOver?.active) return "scoring";
  if (isMatchComplete(matchState)) return "finished";
  if (
    matchState.innings1 &&
    matchState.currentInnings === 1 &&
    isInningsComplete(matchState, matchState.innings1)
  ) {
    return "scorecard";
  }
  const innings = matchState.innings1;
  if (
    innings?.strikerPlayerId &&
    innings.nonStrikerPlayerId &&
    innings.currentBowlerPlayerId
  ) {
    return "scoring";
  }
  return "lineup";
}

export function deriveBattingBowlingTeams(
  matchState: MatchState,
  teamA: Team,
  teamB: Team
): { battingFirstTeam: Team; bowlingFirstTeam: Team } {
  const battingFirstTeam =
    matchState.innings1?.teamId === teamA.id
      ? teamA
      : matchState.innings1?.teamId === teamB.id
        ? teamB
        : matchState.team1;
  const bowlingFirstTeam =
    battingFirstTeam.id === teamA.id ? teamB : teamA;
  return { battingFirstTeam, bowlingFirstTeam };
}

export function shouldShowInningsBreak(matchState: MatchState): boolean {
  return (
    matchState.innings1 != null &&
    matchState.currentInnings === 1 &&
    isInningsComplete(matchState, matchState.innings1)
  );
}
