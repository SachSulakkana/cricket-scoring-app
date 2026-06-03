import { routes } from "./app-routes";
import type { SavedTournament } from "./roster-types";

export type TournamentPlayStatus = "setup" | "live" | "finished";

export function getTeamsPickedCount(tournament: SavedTournament): number {
  return tournament.selectedTeamIds.filter((id) => id.length > 0).length;
}

export function getTournamentPlayStatus(
  tournament: SavedTournament
): TournamentPlayStatus {
  const teamsPicked = getTeamsPickedCount(tournament);
  const teamsReady =
    teamsPicked >= tournament.teamCount && tournament.teamCount >= 2;

  if (!teamsReady) return "setup";

  const { fixtures } = tournament;
  if (fixtures.length === 0) return "setup";

  const played = fixtures.filter((fx) => fx.played).length;
  if (played >= fixtures.length) return "finished";

  return "live";
}

export function getTournamentResumeRoute(tournament: SavedTournament): string {
  const status = getTournamentPlayStatus(tournament);
  if (status === "setup") {
    return routes.playCustomTournament(tournament.id);
  }
  return routes.playCustomTournamentGame(tournament.id);
}

export function getTournamentProgressLabel(tournament: SavedTournament): string {
  const status = getTournamentPlayStatus(tournament);
  const teamsPicked = getTeamsPickedCount(tournament);

  if (status === "setup") {
    if (teamsPicked === 0) return "Pick teams and stages to begin";
    return `${teamsPicked} / ${tournament.teamCount} teams selected`;
  }

  const played = tournament.fixtures.filter((fx) => fx.played).length;
  const total = tournament.fixtures.length;
  if (status === "finished") {
    return `All ${total} matches completed`;
  }
  return `${played} / ${total} matches played`;
}

export function getTournamentStatusLabel(status: TournamentPlayStatus): string {
  switch (status) {
    case "setup":
      return "Setup";
    case "live":
      return "In progress";
    case "finished":
      return "Completed";
  }
}
