import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store/store";

const selectRoster = (state: RootState) => state.roster;

export const selectRosterHydrated = (state: RootState) => state.roster.hydrated;
export const selectRosterLoading = (state: RootState) => state.roster.loading;
export const selectRosterError = (state: RootState) => state.roster.error;

export const selectAllPlayers = createSelector(
  selectRoster,
  (roster) => roster.players
);

export const selectAllTeams = createSelector(
  selectRoster,
  (roster) => roster.teams
);

export const selectAllTournaments = createSelector(
  selectRoster,
  (roster) => roster.tournaments
);

export const selectPlayerById = (state: RootState, id: string) =>
  state.roster.players.find((p) => p.id === id);

export const selectTeamById = (state: RootState, id: string) =>
  state.roster.teams.find((t) => t.id === id);

export const selectTournamentById = (state: RootState, id: string) =>
  state.roster.tournaments.find((t) => t.id === id);

export const selectTournamentTemplates = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.filter((t) => t.isTemplate === true)
);

export const selectPlayTournaments = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.filter((t) => t.isTemplate !== true)
);
