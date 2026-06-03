import type { TournamentPreset } from "./cricket-types";
import {
  buildTeamSelectionSlots,
  saveTournament,
  type SavedTournament,
} from "./roster-storage";

export interface TournamentPresetOption {
  id: TournamentPreset;
  label: string;
  description: string;
  totalOvers: number;
  ballsPerOver: number;
  defaultTeamCount: number;
}

export const TOURNAMENT_PRESET_OPTIONS: TournamentPresetOption[] = [
  {
    id: "T20",
    label: "T20",
    description:
      "Fast, explosive cricket. Twenty overs per side — high intensity, big finishes.",
    totalOvers: 20,
    ballsPerOver: 6,
    defaultTeamCount: 4,
  },
  {
    id: "ODI",
    label: "ODI",
    description:
      "Fifty overs per side. Longer rhythm and momentum swings across the innings.",
    totalOvers: 50,
    ballsPerOver: 6,
    defaultTeamCount: 4,
  },
  {
    id: "T10",
    label: "T10",
    description:
      "Maximum pace. Ten overs per side — every ball counts.",
    totalOvers: 10,
    ballsPerOver: 6,
    defaultTeamCount: 4,
  },
];

export async function createTournamentFromPreset(
  preset: TournamentPreset
): Promise<SavedTournament> {
  const option = TOURNAMENT_PRESET_OPTIONS.find((p) => p.id === preset);
  if (!option) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  const teamCount = option.defaultTeamCount;
  const tournament: SavedTournament = {
    id: `tournament-${Date.now()}`,
    name: `${option.label} Tournament`,
    totalOvers: option.totalOvers,
    ballsPerOver: option.ballsPerOver,
    teamCount,
    stageCount: 0,
    stages: [],
    selectedTeamIds: buildTeamSelectionSlots(teamCount),
    fixtures: [],
    createdAt: new Date().toISOString(),
    isTemplate: false,
  };

  await saveTournament(tournament);
  return tournament;
}
