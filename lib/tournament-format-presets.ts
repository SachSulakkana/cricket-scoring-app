import type { TournamentStageConfig, TournamentStageStyle } from "./tournament-stage-options";
import { normalizeGroupCount } from "./tournament-stage-options";

export const DEFAULT_FORMAT_PRESET_ID = "rr-league";

export type AdvancementKind =
  | "table-champion"
  | "knockout-champion"
  | "top-n-knockout"
  | "top-2-per-group-knockout"
  | "top-3-playoffs"
  | "playoffs-then-champion"
  | "playoffs-advance-to-knockout"
  | "top-1-per-group-rr"
  | "top-n-table";

export interface StageAdvancementRule {
  /** How teams are selected after this stage completes. */
  kind: AdvancementKind;
  /** For top-n rules. */
  count?: number;
}

export interface TournamentFormatPreset {
  id: string;
  label: string;
  roundCount: 1 | 2 | 3 | 4;
  stages: TournamentStageConfig[];
  /** Advancement after each stage index (length = stages.length). */
  advancementAfterStage: StageAdvancementRule[];
  minTeams: number;
}

function stage(style: TournamentStageStyle, groupCount?: number): TournamentStageConfig {
  if (style === "group-stage") {
    return { style, groupCount: groupCount ?? 2 };
  }
  return { style };
}

export const TOURNAMENT_FORMAT_PRESETS: TournamentFormatPreset[] = [
  {
    id: "rr-league",
    label: "Round Robin League",
    roundCount: 1,
    stages: [stage("round-robin")],
    advancementAfterStage: [{ kind: "table-champion" }],
    minTeams: 2,
  },
  {
    id: "knockout",
    label: "Knockout",
    roundCount: 1,
    stages: [stage("knockout")],
    advancementAfterStage: [{ kind: "knockout-champion" }],
    minTeams: 2,
  },
  {
    id: "group",
    label: "Group Stage",
    roundCount: 1,
    stages: [stage("group-stage", 2)],
    advancementAfterStage: [{ kind: "table-champion" }],
    minTeams: 6,
  },
  {
    id: "rr-knockout",
    label: "Round Robin League → Knockout",
    roundCount: 2,
    stages: [stage("round-robin"), stage("knockout")],
    advancementAfterStage: [
      { kind: "top-n-knockout", count: 4 },
      { kind: "knockout-champion" },
    ],
    minTeams: 4,
  },
  {
    id: "rr-playoffs",
    label: "Round Robin League → Playoffs",
    roundCount: 2,
    stages: [stage("round-robin"), stage("playoffs")],
    advancementAfterStage: [
      { kind: "top-3-playoffs" },
      { kind: "playoffs-then-champion" },
    ],
    minTeams: 3,
  },
  {
    id: "group-knockout",
    label: "Group Stage → Knockout",
    roundCount: 2,
    stages: [stage("group-stage", 2), stage("knockout")],
    advancementAfterStage: [
      { kind: "top-2-per-group-knockout" },
      { kind: "knockout-champion" },
    ],
    minTeams: 6,
  },
  {
    id: "group-playoffs",
    label: "Group Stage → Playoffs",
    roundCount: 2,
    stages: [stage("group-stage", 2), stage("playoffs")],
    advancementAfterStage: [
      { kind: "top-n-table", count: 3 },
      { kind: "playoffs-then-champion" },
    ],
    minTeams: 6,
  },
  {
    id: "rr-playoffs-knockout",
    label: "Round Robin League → Playoffs → Knockout",
    roundCount: 3,
    stages: [stage("round-robin"), stage("playoffs"), stage("knockout")],
    advancementAfterStage: [
      { kind: "top-3-playoffs" },
      { kind: "playoffs-advance-to-knockout" },
      { kind: "knockout-champion" },
    ],
    minTeams: 3,
  },
  {
    id: "group-playoffs-knockout",
    label: "Group Stage → Playoffs → Knockout",
    roundCount: 3,
    stages: [stage("group-stage", 2), stage("playoffs"), stage("knockout")],
    advancementAfterStage: [
      { kind: "top-n-table", count: 3 },
      { kind: "playoffs-advance-to-knockout" },
      { kind: "knockout-champion" },
    ],
    minTeams: 6,
  },
  {
    id: "group-rr-knockout",
    label: "Group Stage → Round Robin League → Knockout",
    roundCount: 3,
    stages: [stage("group-stage", 2), stage("round-robin"), stage("knockout")],
    advancementAfterStage: [
      { kind: "top-1-per-group-rr" },
      { kind: "top-n-knockout", count: 4 },
      { kind: "knockout-champion" },
    ],
    minTeams: 6,
  },
  {
    id: "group-rr-playoffs-knockout",
    label: "Group Stage → Round Robin League → Playoffs → Knockout",
    roundCount: 4,
    stages: [
      stage("group-stage", 2),
      stage("round-robin"),
      stage("playoffs"),
      stage("knockout"),
    ],
    advancementAfterStage: [
      { kind: "top-1-per-group-rr" },
      { kind: "top-3-playoffs" },
      { kind: "playoffs-advance-to-knockout" },
      { kind: "knockout-champion" },
    ],
    minTeams: 6,
  },
  {
    id: "rr-group-playoffs-knockout",
    label: "Round Robin League → Group Stage → Playoffs → Knockout",
    roundCount: 4,
    stages: [
      stage("round-robin"),
      stage("group-stage", 2),
      stage("playoffs"),
      stage("knockout"),
    ],
    advancementAfterStage: [
      { kind: "top-n-table", count: 6 },
      { kind: "top-n-table", count: 3 },
      { kind: "playoffs-then-champion" },
      { kind: "knockout-champion" },
    ],
    minTeams: 6,
  },
];

export function getFormatPreset(id: string): TournamentFormatPreset | undefined {
  return TOURNAMENT_FORMAT_PRESETS.find((p) => p.id === id);
}

export function getDefaultFormatPreset(): TournamentFormatPreset {
  return getFormatPreset(DEFAULT_FORMAT_PRESET_ID)!;
}

export function applyPresetToTournament(
  presetId: string,
  teamCount: number
): { stageCount: number; stages: TournamentStageConfig[] } {
  const preset = getFormatPreset(presetId) ?? getDefaultFormatPreset();
  const stages = preset.stages.map((s) => {
    if (s.style === "group-stage") {
      return {
        style: "group-stage" as const,
        groupCount: normalizeGroupCount(teamCount, s.groupCount),
      };
    }
    return { style: s.style };
  });
  return { stageCount: stages.length, stages };
}

export function validatePresetForTeams(
  presetId: string,
  teamCount: number
): string | null {
  const preset = getFormatPreset(presetId);
  if (!preset) return "Unknown tournament format.";
  if (teamCount < preset.minTeams) {
    return `${preset.label} needs at least ${preset.minTeams} teams (you have ${teamCount}).`;
  }
  const groupStage = preset.stages.find((s) => s.style === "group-stage");
  if (groupStage?.groupCount) {
    const perGroup = Math.floor(teamCount / groupStage.groupCount);
    if (perGroup < 3) {
      return `Not enough teams for ${groupStage.groupCount} groups (need 3+ per group).`;
    }
  }
  if (preset.stages.some((s) => s.style === "playoffs") && teamCount < 3) {
    return "Playoffs need at least 3 teams.";
  }
  return null;
}

export function presetsByRoundCount(): Map<number, TournamentFormatPreset[]> {
  const map = new Map<number, TournamentFormatPreset[]>();
  for (const p of TOURNAMENT_FORMAT_PRESETS) {
    const list = map.get(p.roundCount) ?? [];
    list.push(p);
    map.set(p.roundCount, list);
  }
  return map;
}
