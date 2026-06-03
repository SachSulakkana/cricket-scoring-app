import {
  buildTeamSelectionSlots,
  saveTournament,
  type SavedTournament,
} from "./roster-storage";

/** Tournaments saved from Create Tournament (reusable configs). */
export function isTournamentTemplate(tournament: SavedTournament): boolean {
  return tournament.isTemplate === true;
}

/** Start a new play session from a saved template (template stays unchanged). */
export async function startPlayFromTemplate(
  template: SavedTournament
): Promise<SavedTournament> {
  if (!isTournamentTemplate(template)) {
    throw new Error("Only tournament templates can be used to start play.");
  }

  const teamCount = template.teamCount;
  const instance: SavedTournament = {
    id: `tournament-${Date.now()}`,
    name: template.name,
    totalOvers: template.totalOvers,
    ballsPerOver: template.ballsPerOver,
    teamCount,
    stageCount: 0,
    stages: [],
    selectedTeamIds: buildTeamSelectionSlots(teamCount),
    fixtures: [],
    createdAt: new Date().toISOString(),
    isTemplate: false,
    templateId: template.id,
  };

  await saveTournament(instance);
  return instance;
}
