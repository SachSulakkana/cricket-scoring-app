import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Player, Team } from "@/lib/cricket-types";
import type { SavedTournament } from "@/lib/roster-types";

export interface RosterState {
  players: Player[];
  teams: Team[];
  tournaments: SavedTournament[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: RosterState = {
  players: [],
  teams: [],
  tournaments: [],
  hydrated: false,
  loading: false,
  error: null,
};

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  const next = [...list];
  next[index] = item;
  return next;
}

const rosterSlice = createSlice({
  name: "roster",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    hydrateRoster(
      state,
      action: PayloadAction<{
        players: Player[];
        teams: Team[];
        tournaments: SavedTournament[];
      }>
    ) {
      state.players = action.payload.players;
      state.teams = action.payload.teams;
      state.tournaments = action.payload.tournaments;
      state.hydrated = true;
      state.loading = false;
      state.error = null;
    },
    upsertPlayer(state, action: PayloadAction<Player>) {
      state.players = upsertById(state.players, action.payload);
    },
    removePlayer(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.players = state.players.filter((p) => p.id !== id);
      state.teams = state.teams.map((team) => ({
        ...team,
        players: team.players.filter((p) => p.id !== id),
      }));
    },
    syncPlayerInTeams(state, action: PayloadAction<Player>) {
      const player = action.payload;
      state.teams = state.teams.map((team) => ({
        ...team,
        players: team.players.map((p) => (p.id === player.id ? player : p)),
      }));
    },
    upsertPlayersBulk(state, action: PayloadAction<Player[]>) {
      let players = state.players;
      for (const player of action.payload) {
        players = upsertById(players, player);
      }
      state.players = players;
    },
    upsertTeam(state, action: PayloadAction<Team>) {
      state.teams = upsertById(state.teams, action.payload);
    },
    removeTeam(state, action: PayloadAction<string>) {
      state.teams = state.teams.filter((t) => t.id !== action.payload);
    },
    upsertTeamsBulk(state, action: PayloadAction<Team[]>) {
      let teams = state.teams;
      for (const team of action.payload) {
        teams = upsertById(teams, team);
      }
      state.teams = teams;
    },
    upsertTournament(state, action: PayloadAction<SavedTournament>) {
      state.tournaments = upsertById(state.tournaments, action.payload);
    },
    removeTournament(state, action: PayloadAction<string>) {
      state.tournaments = state.tournaments.filter(
        (t) => t.id !== action.payload
      );
    },
  },
});

export const rosterActions = rosterSlice.actions;
export const rosterReducer = rosterSlice.reducer;
