import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BallData, MatchConfig, MatchState, Team } from "@/lib/cricket-types";

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
};

interface MatchSliceState {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
}

const initialState: MatchSliceState = {
  matchState: initialMatchState,
  meta: null,
};

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
      state.matchState = action.payload.matchState;
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
        innings1: {
          teamId: prev.team1.id,
          teamName: prev.team1.name,
          balls: [],
          currentBatsmanIndex: 0,
          currentBowlerIndex: 0,
          strikerPlayerId: "",
          nonStrikerPlayerId: "",
          currentBowlerPlayerId: "",
        },
        innings2: null,
        currentInnings: 1,
      };
    },
    addBall(state, action: PayloadAction<BallData>) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        balls: [...currentInnings.balls, action.payload],
      };
    },
    undoLastBall(state) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings || currentInnings.balls.length === 0) return;
      state.matchState[key] = {
        ...currentInnings,
        balls: currentInnings.balls.slice(0, -1),
      };
    },
    switchInnings(state) {
      const prev = state.matchState;
      if (prev.currentInnings === 1 && !prev.innings1) return;
      state.matchState = {
        ...prev,
        currentInnings: 2,
        innings2: {
          teamId: prev.team2.id,
          teamName: prev.team2.name,
          balls: [],
          currentBatsmanIndex: 0,
          currentBowlerIndex: 0,
          strikerPlayerId: "",
          nonStrikerPlayerId: "",
          currentBowlerPlayerId: "",
        },
      };
    },
    setOpeningBatsmen(
      state,
      action: PayloadAction<{ strikerId: string; nonStrikerId: string }>
    ) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        strikerPlayerId: action.payload.strikerId,
        nonStrikerPlayerId: action.payload.nonStrikerId,
      };
    },
    setOpeningBowler(state, action: PayloadAction<string>) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        currentBowlerPlayerId: action.payload,
      };
    },
    setNextBowler(state, action: PayloadAction<string>) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        lastBowlerPlayerId: currentInnings.currentBowlerPlayerId,
        currentBowlerPlayerId: action.payload,
      };
    },
    setNextBatsman(
      state,
      action: PayloadAction<{ playerId: string; isStriker: boolean }>
    ) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        strikerPlayerId: action.payload.isStriker
          ? action.payload.playerId
          : currentInnings.strikerPlayerId,
        nonStrikerPlayerId: !action.payload.isStriker
          ? action.payload.playerId
          : currentInnings.nonStrikerPlayerId,
      };
    },
    swapStrike(state) {
      const key =
        state.matchState.currentInnings === 1 ? "innings1" : "innings2";
      const currentInnings = state.matchState[key];
      if (!currentInnings) return;
      state.matchState[key] = {
        ...currentInnings,
        strikerPlayerId: currentInnings.nonStrikerPlayerId,
        nonStrikerPlayerId: currentInnings.strikerPlayerId,
      };
    },
  },
});

export const matchActions = matchSlice.actions;
export const matchReducer = matchSlice.reducer;
