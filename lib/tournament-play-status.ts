import { routes } from "./app-routes";
import type { SavedTournament } from "./roster-types";
import { getFormatPreset, DEFAULT_FORMAT_PRESET_ID } from "./tournament-format-presets";
import { getActiveStageIndex } from "./tournament-stage-engine";

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
  if (!tournament.formatPresetId && tournament.fixtures.length === 0) {
    return "setup";
  }

  if (tournament.championTeamId) return "finished";

  const { fixtures } = tournament;
  if (fixtures.length === 0) return "setup";

  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  if (preset && tournament.stageComplete?.every(Boolean)) {
    return "finished";
  }

  const played = fixtures.filter((fx) => fx.played).length;
  if (played >= fixtures.length && !tournament.championTeamId) {
    return "live";
  }

  return "live";
}

export function isTournamentStarted(tournament: SavedTournament): boolean {
  return getTournamentPlayStatus(tournament) !== "setup";
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
    if (teamsPicked === 0) return "Pick teams and format to begin";
    return `${teamsPicked} / ${tournament.teamCount} teams selected`;
  }

  if (tournament.championTeamId) {
    return "Tournament complete — champion crowned";
  }

  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  const stage = getActiveStageIndex(tournament) + 1;
  const totalStages = preset?.stages.length ?? 1;
  const activeFixtures = tournament.fixtures.filter(
    (fx) => fx.stageIndex === getActiveStageIndex(tournament)
  );
  const played = activeFixtures.filter((fx) => fx.played).length;
  const total = activeFixtures.length;

  if (status === "finished") {
    return `All ${tournament.fixtures.length} matches completed`;
  }
  return `Stage ${stage}/${totalStages} · ${played} / ${total} matches`;
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
