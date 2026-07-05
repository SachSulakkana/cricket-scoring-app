import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BallData, MatchConfig, MatchState, Team } from "@/lib/cricket-types";
import { createSuperOverInnings } from "@/lib/scoring-context";
import { SUPER_OVER_MAX_BALLS } from "@/lib/super-over";

export interface LiveMatchMeta {
  kind: "quick" | "tournament";
  tournamentId?: string;
  fixtureId?: string;
  label?: string;
}

/** Stable id for comparing sessions (avoids effect loops on inline meta objects). */
export function liveMetaKey(meta: LiveMatchMeta | null): string {
  if (!meta) return "";
  if (meta.kind === "quick") return "quick";
  return `tournament:${meta.tournamentId ?? ""}:${meta.fixtureId ?? ""}`;
}

export function liveMetaMatches(
  a: LiveMatchMeta | null,
  b: LiveMatchMeta | null
): boolean {
  return liveMetaKey(a) === liveMetaKey(b);
}

export const initialMatchState: MatchState = {
  team1: { id: "", name: "", players: [] },
  team2: { id: "", name: "", players: [] },
  config: null,
  innings1: null,
  innings2: null,
  currentInnings: 1,
  matchStarted: false,
  superOver: null,
};

interface MatchSliceState {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
}

const initialState: MatchSliceState = {
  matchState: initialMatchState,
  meta: null,
};

function isSuperOverScoring(state: MatchState): boolean {
  return Boolean(state.superOver?.active && !state.superOver.completed);
}

function getRegularInningsKey(state: MatchState): "innings1" | "innings2" {
  return state.currentInnings === 1 ? "innings1" : "innings2";
}

function getSuperOverInningsKey(
  state: MatchState
): "innings1" | "innings2" | null {
  if (!state.superOver) return null;
  return state.superOver.currentInnings === 1 ? "innings1" : "innings2";
}

function mutateActiveInnings(
  state: MatchState,
  mutate: (innings: NonNullable<MatchState["innings1"]>) => void
) {
  if (isSuperOverScoring(state) && state.superOver) {
    const key = getSuperOverInningsKey(state);
    if (!key) return;
    const innings = state.superOver[key];
    if (!innings) return;
    mutate(innings);
    return;
  }

  const key = getRegularInningsKey(state);
  const innings = state[key];
  if (!innings) return;
  mutate(innings);
}

const matchSlice = createSlice({
  name: "match",
  initialState,
  reducers: {
    setLiveMatchMeta(state, action: PayloadAction<LiveMatchMeta | null>) {
      const next = action.payload;
      if (liveMetaMatches(state.meta, next)) return;
      state.meta = next;
    },
    restoreLiveMatch(
      state,
      action: PayloadAction<{ matchState: MatchState; meta: LiveMatchMeta | null }>
    ) {
      state.matchState = {
        ...action.payload.matchState,
        superOver: action.payload.matchState.superOver ?? null,
      };
      state.meta = action.payload.meta;
    },
    resetLiveMatch(state) {
      state.matchState = initialMatchState;
      state.meta = null;
    },
    setTeam1(state, action: PayloadAction<Team>) {
      state.matchState.team1 = action.payload;
    },
    setTeam2(state, action: PayloadAction<Team>) {
      state.matchState.team2 = action.payload;
    },
    setMatchConfig(state, action: PayloadAction<MatchConfig>) {
      state.matchState.config = action.payload;
    },
    startMatch(state) {
      const prev = state.matchState;
      state.matchState = {
        ...prev,
        matchStarted: true,
        superOver: null,
        innings1: createSuperOverInnings(prev.team1),
        innings2: null,
        currentInnings: 1,
      };
    },
    acceptMatchDraw(state) {
      state.matchState.superOver = {
        ballsPerOver: 0,
        firstBattingTeamId: state.matchState.team2.id,
        innings1: null,
        innings2: null,
        currentInnings: 1,
        active: false,
        completed: false,
        settledAsDraw: true,
      };
    },
    initSuperOver(
      state,
      action: PayloadAction<{ firstBattingTeamId: string; ballsPerOver: number }>
    ) {
      const prev = state.matchState;
      const battingTeam =
        action.payload.firstBattingTeamId === prev.team1.id
          ? prev.team1
          : prev.team2;
      const balls = Math.min(
        Math.max(action.payload.ballsPerOver, 1),
        SUPER_OVER_MAX_BALLS
      );
      state.matchState.superOver = {
        ballsPerOver: balls,
        firstBattingTeamId: action.payload.firstBattingTeamId,
        innings1: createSuperOverInnings(battingTeam),
        innings2: null,
        currentInnings: 1,
        active: true,
        completed: false,
        settledAsDraw: false,
      };
    },
    switchSuperOverInnings(state) {
      const superOver = state.matchState.superOver;
      if (!superOver?.active || !superOver.innings1) return;
      const chaseTeam =
        superOver.firstBattingTeamId === state.matchState.team1.id
          ? state.matchState.team2
          : state.matchState.team1;
      superOver.currentInnings = 2;
      superOver.innings2 = createSuperOverInnings(chaseTeam);
    },
    completeSuperOver(state) {
      const superOver = state.matchState.superOver;
      if (!superOver) return;
      superOver.active = false;
      superOver.completed = true;
    },
    addBall(state, action: PayloadAction<BallData>) {
      mutateActiveInnings(state.matchState, (innings) => {
        innings.balls.push(action.payload);
      });
    },
    undoLastBall(state) {
      mutateActiveInnings(state.matchState, (innings) => {
        if (innings.balls.length === 0) return;
        innings.balls.pop();
      });
    },
    switchInnings(state) {
      const prev = state.matchState;
      if (prev.currentInnings === 1 && !prev.innings1) return;
      state.matchState = {
        ...prev,
        currentInnings: 2,
        innings2: createSuperOverInnings(prev.team2),
      };
    },
    setOpeningBatsmen(
      state,
      action: PayloadAction<{ strikerId: string; nonStrikerId: string }>
    ) {
      mutateActiveInnings(state.matchState, (innings) => {
        innings.strikerPlayerId = action.payload.strikerId;
        innings.nonStrikerPlayerId = action.payload.nonStrikerId;
      });
    },
    setOpeningBowler(state, action: PayloadAction<string>) {
      mutateActiveInnings(state.matchState, (innings) => {
        innings.currentBowlerPlayerId = action.payload;
      });
    },
    setNextBowler(state, action: PayloadAction<string>) {
      mutateActiveInnings(state.matchState, (innings) => {
        innings.lastBowlerPlayerId = innings.currentBowlerPlayerId;
        innings.currentBowlerPlayerId = action.payload;
      });
    },
    setNextBatsman(
      state,
      action: PayloadAction<{ playerId: string; isStriker: boolean }>
    ) {
      mutateActiveInnings(state.matchState, (innings) => {
        if (action.payload.isStriker) {
          innings.strikerPlayerId = action.payload.playerId;
        } else {
          innings.nonStrikerPlayerId = action.payload.playerId;
        }
      });
    },
    swapStrike(state) {
      mutateActiveInnings(state.matchState, (innings) => {
        const prevStriker = innings.strikerPlayerId;
        innings.strikerPlayerId = innings.nonStrikerPlayerId;
        innings.nonStrikerPlayerId = prevStriker;
      });
    },
  },
});

export const matchActions = matchSlice.actions;
export const matchReducer = matchSlice.reducer;
