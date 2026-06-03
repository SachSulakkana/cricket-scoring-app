import type { Player, Team } from "@/lib/cricket-types";
import {
  formatBattingStyle,
  formatBowlingStyle,
  formatPlayerGender,
  formatPlayerRole,
} from "@/lib/player-options";

export function normalizeRosterSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function playerMatchesSearch(
  player: Player,
  query: string,
  teamName?: string
): boolean {
  const q = normalizeRosterSearchQuery(query);
  if (!q) return true;

  const haystack = [
    player.name,
    teamName,
    formatPlayerRole(player.role),
    formatPlayerGender(player.gender),
    formatBattingStyle(player.battingStyle),
    formatBowlingStyle(player.bowlingStyle),
    player.age != null ? String(player.age) : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function teamMatchesSearch(team: Team, query: string): boolean {
  const q = normalizeRosterSearchQuery(query);
  if (!q) return true;

  const haystack = [
    team.name,
    team.ownerName,
    ...team.players.map((p) => p.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
