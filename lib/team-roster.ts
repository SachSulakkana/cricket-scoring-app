import type { Player, Team } from "./cricket-types";

/** Resolve embedded squad players from the global roster (single source of truth). */
export function resolveTeamPlayers(team: Team, rosterPlayers: Player[]): Team {
  const byId = new Map(rosterPlayers.map((p) => [p.id, p]));
  return {
    ...team,
    players: team.players.map((p) => byId.get(p.id) ?? p),
  };
}

export function resolveTeamsFromRoster(
  teams: Team[],
  rosterPlayers: Player[]
): Team[] {
  return teams.map((t) => resolveTeamPlayers(t, rosterPlayers));
}
