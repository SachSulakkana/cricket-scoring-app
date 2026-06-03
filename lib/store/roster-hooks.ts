"use client";

import { useAppSelector } from "./hooks";
import { getTournamentPlayStatus } from "@/lib/tournament-play-status";
import {
  selectAllPlayers,
  selectAllTeams,
  selectPlayTournaments,
  selectPlayerById,
  selectRosterError,
  selectRosterHydrated,
  selectRosterLoading,
  selectTeamById,
  selectTournamentById,
  selectTournamentTemplates,
} from "./selectors";

export function useRosterHydrated() {
  return useAppSelector(selectRosterHydrated);
}

export function useRosterLoading() {
  return useAppSelector(selectRosterLoading);
}

export function useRosterError() {
  return useAppSelector(selectRosterError);
}

export function usePlayers() {
  return useAppSelector(selectAllPlayers);
}

export function usePlayer(id: string | undefined) {
  return useAppSelector((state) =>
    id ? selectPlayerById(state, id) : undefined
  );
}

export function useTeams() {
  return useAppSelector(selectAllTeams);
}

export function useTeam(id: string | undefined) {
  return useAppSelector((state) => (id ? selectTeamById(state, id) : undefined));
}

export function useTournament(id: string | undefined) {
  return useAppSelector((state) =>
    id ? selectTournamentById(state, id) : undefined
  );
}

export function useTournamentTemplates() {
  return useAppSelector(selectTournamentTemplates);
}

export function usePlayTournaments() {
  return useAppSelector(selectPlayTournaments);
}

export function useOngoingRunsForTemplate(templateId: string) {
  const play = usePlayTournaments();
  return play.filter(
    (t) =>
      t.templateId === templateId &&
      getTournamentPlayStatus(t) !== "finished"
  );
}
