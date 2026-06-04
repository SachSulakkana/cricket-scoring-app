import type { InningsData, MatchConfig, Team } from "./cricket-types";
import type { TournamentStageConfig } from "./tournament-stage-options";

export interface TournamentBestBatting {
  playerName: string;
  teamId: string;
  runs: number;
}

export interface TournamentBestBowling {
  playerName: string;
  teamId: string;
  wickets: number;
}

/** Ball-by-ball data saved when a tournament match is completed. */
export interface TournamentMatchSnapshot {
  team1: Team;
  team2: Team;
  config: MatchConfig;
  innings1: InningsData | null;
  innings2: InningsData | null;
}

export interface TournamentFixtureResult {
  runsA: number;
  wicketsA: number;
  runsB: number;
  wicketsB: number;
  winnerTeamId?: string;
  bestBatting?: TournamentBestBatting;
  bestBowling?: TournamentBestBowling;
  scorecard?: TournamentMatchSnapshot;
}

export type PlayoffMatchKind = "qualifier" | "final";

export interface TournamentFixture {
  id: string;
  teamAId: string;
  teamBId: string;
  played: boolean;
  result?: TournamentFixtureResult;
  /** 0-based stage index this fixture belongs to. */
  stageIndex: number;
  groupId?: string;
  bracketRound?: number;
  playoffMatchKind?: PlayoffMatchKind;
}

export interface SavedTournament {
  id: string;
  name: string;
  totalOvers: number;
  ballsPerOver: number;
  teamCount: number;
  stageCount: number;
  stages: TournamentStageConfig[];
  selectedTeamIds: string[];
  fixtures: TournamentFixture[];
  createdAt: string;
  /** Preset format id from tournament-format-presets. */
  formatPresetId?: string;
  /** Active stage (0-based). */
  currentStageIndex?: number;
  /** teamId -> group letter (A, B, …) for group stages. */
  groupAssignments?: Record<string, string>;
  championTeamId?: string;
  /** Cached per-stage completion flags. */
  stageComplete?: boolean[];
  /** Saved from Create Tournament — reusable config, not a live competition. */
  isTemplate?: boolean;
  /** Set on play instances cloned from a template. */
  templateId?: string;
}
