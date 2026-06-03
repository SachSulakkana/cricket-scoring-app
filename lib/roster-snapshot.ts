import type { Player, Team } from "./cricket-types";
import type { SavedTournament } from "./roster-types";
import { rosterActions } from "./store/roster-slice";
import { getStore } from "./store/store";

export interface RosterSnapshot {
  players: Player[];
  teams: Team[];
  tournaments: SavedTournament[];
}

export function captureRosterSnapshot(): RosterSnapshot {
  const { players, teams, tournaments } = getStore().getState().roster;
  return {
    players: [...players],
    teams: teams.map((t) => ({
      ...t,
      players: [...t.players],
    })),
    tournaments: tournaments.map((t) => ({
      ...t,
      stages: [...t.stages],
      selectedTeamIds: [...t.selectedTeamIds],
      fixtures: [...t.fixtures],
    })),
  };
}

export function restoreRosterSnapshot(snapshot: RosterSnapshot) {
  getStore().dispatch(rosterActions.hydrateRoster(snapshot));
}

export async function withRosterRollback<T>(
  applyOptimistic: () => void,
  persist: () => Promise<T>
): Promise<T> {
  const snapshot = captureRosterSnapshot();
  applyOptimistic();
  try {
    return await persist();
  } catch (error) {
    restoreRosterSnapshot(snapshot);
    throw error;
  }
}
