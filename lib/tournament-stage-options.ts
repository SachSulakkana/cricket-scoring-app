export type TournamentStageStyle =
  | "round-robin"
  | "league"
  | "knockout"
  | "group-stage"
  | "playoffs";

export interface TournamentStageConfig {
  style: TournamentStageStyle;
  /** Required when style is `group-stage` (min 3 teams per group). */
  groupCount?: number;
}

export const TOURNAMENT_STAGE_STYLE_OPTIONS: {
  value: TournamentStageStyle;
  label: string;
}[] = [
  { value: "round-robin", label: "Round Robin" },
  { value: "league", label: "League" },
  { value: "knockout", label: "Knockout" },
  { value: "group-stage", label: "Group Stage" },
  { value: "playoffs", label: "Playoffs" },
];

export const MAX_TOURNAMENT_STAGES = 4;
export const MIN_TEAMS_PER_GROUP = 3;

export function canUseGroupStage(teamCount: number): boolean {
  return teamCount >= MIN_TEAMS_PER_GROUP;
}

/** Largest number of groups so each can have at least MIN_TEAMS_PER_GROUP teams. */
export function getMaxGroupCount(teamCount: number): number {
  if (!canUseGroupStage(teamCount)) return 0;
  return Math.floor(teamCount / MIN_TEAMS_PER_GROUP);
}

export function getDefaultGroupCount(teamCount: number): number {
  const max = getMaxGroupCount(teamCount);
  if (max <= 0) return 1;
  if (max >= 2 && teamCount >= 6) return 2;
  return 1;
}

export function normalizeGroupCount(
  teamCount: number,
  groupCount?: number
): number {
  const max = getMaxGroupCount(teamCount);
  if (max < 1) return 1;
  const raw = groupCount ?? getDefaultGroupCount(teamCount);
  return Math.min(max, Math.max(1, Math.round(raw)));
}

/** Teams in the smallest group if teams are split evenly. */
export function getSmallestGroupSize(teamCount: number, groupCount: number): number {
  const groups = normalizeGroupCount(teamCount, groupCount);
  return Math.floor(teamCount / groups);
}

export function formatStageStyle(style: TournamentStageStyle): string {
  return (
    TOURNAMENT_STAGE_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style
  );
}

export function formatStageSummary(
  stage: TournamentStageConfig,
  teamCount: number
): string {
  const label = formatStageStyle(stage.style);
  if (stage.style !== "group-stage") return label;
  const groups = normalizeGroupCount(teamCount, stage.groupCount);
  const perGroup = getSmallestGroupSize(teamCount, groups);
  return `${label} · ${groups} group${groups === 1 ? "" : "s"} (${perGroup}+ teams each)`;
}

function normalizeStageConfig(
  stage: Partial<TournamentStageConfig> | undefined,
  teamCount: number
): TournamentStageConfig {
  const style = stage?.style ?? "round-robin";
  if (style === "group-stage" && canUseGroupStage(teamCount)) {
    return {
      style,
      groupCount: normalizeGroupCount(teamCount, stage?.groupCount),
    };
  }
  return { style };
}

export function buildStageConfigs(
  count: number,
  existing?: TournamentStageConfig[],
  teamCount = 4
): TournamentStageConfig[] {
  const safe = Math.min(MAX_TOURNAMENT_STAGES, Math.max(1, count));
  return Array.from({ length: safe }, (_, i) =>
    normalizeStageConfig(existing?.[i], teamCount)
  );
}

export function isTournamentStageStyle(value: string): value is TournamentStageStyle {
  return TOURNAMENT_STAGE_STYLE_OPTIONS.some((o) => o.value === value);
}
