import type { SavedTournament, TournamentFixture } from "@/lib/roster-types";
import {
  applyPresetToTournament,
  getFormatPreset,
  DEFAULT_FORMAT_PRESET_ID,
} from "@/lib/tournament-format-presets";
import { resolveStageAdvancement } from "./advancement";
import {
  generateKnockoutNextRound,
  generateStageFixtures,
  resolvePlayoffFinalOpponent,
} from "./generate-fixtures";
import { assignTeamsToGroups } from "./assign-groups";

export function getSelectedTeamIds(tournament: SavedTournament): string[] {
  return tournament.selectedTeamIds.filter((id) => id.length > 0);
}

export function getActiveStageIndex(tournament: SavedTournament): number {
  return tournament.currentStageIndex ?? 0;
}

export function getFixturesForStage(
  tournament: SavedTournament,
  stageIndex: number
): TournamentFixture[] {
  return tournament.fixtures.filter((fx) => fx.stageIndex === stageIndex);
}

export function getActiveFixtures(tournament: SavedTournament): TournamentFixture[] {
  const stage = getActiveStageIndex(tournament);
  return getFixturesForStage(tournament, stage);
}

export function isStageComplete(
  tournament: SavedTournament,
  stageIndex: number
): boolean {
  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  if (!preset) return false;
  const stage = preset.stages[stageIndex];
  if (!stage) return false;

  let stageFixtures = getFixturesForStage(tournament, stageIndex);
  stageFixtures = resolvePlayoffFinalOpponent(
    tournament.fixtures,
    stageIndex
  ).filter((fx) => fx.stageIndex === stageIndex);

  if (stage.style === "playoffs") {
    const final = stageFixtures.find((fx) => fx.playoffMatchKind === "final");
    if (!final || !final.played || !final.result?.winnerTeamId) return false;
    if (final.teamBId === "__pending_qualifier_winner__") return false;
    return true;
  }

  if (stage.style === "knockout") {
    if (stageFixtures.length === 0) return false;
    if (stageFixtures.some((fx) => !fx.played)) return false;
    const maxRound = Math.max(
      ...stageFixtures.map((fx) => fx.bracketRound ?? 0),
      0
    );
    const lastRoundFixtures = stageFixtures.filter(
      (fx) => (fx.bracketRound ?? 0) === maxRound
    );
    const winners = lastRoundFixtures
      .map((fx) => fx.result?.winnerTeamId)
      .filter((id): id is string => Boolean(id));
    if (winners.length === 1) return true;
    const hasNextRound = stageFixtures.some(
      (fx) => (fx.bracketRound ?? 0) === maxRound + 1
    );
    if (winners.length > 1 && !hasNextRound) return false;
    if (hasNextRound) {
      const nextRound = stageFixtures.filter(
        (fx) => (fx.bracketRound ?? 0) === maxRound + 1
      );
      return nextRound.length > 0 && nextRound.every((fx) => fx.played);
    }
    return false;
  }

  const playable = stageFixtures.filter(
    (fx) =>
      fx.teamBId !== "__pending_qualifier_winner__" &&
      fx.teamAId.length > 0 &&
      fx.teamBId.length > 0
  );
  if (playable.length === 0) return false;
  return playable.every((fx) => fx.played);
}

function maybeGenerateKnockoutNextRound(
  tournament: SavedTournament,
  stageIndex: number
): TournamentFixture[] {
  const stageFixtures = getFixturesForStage(tournament, stageIndex);
  const maxRound = Math.max(
    ...stageFixtures.map((fx) => fx.bracketRound ?? 0),
    0
  );
  const roundFixtures = stageFixtures.filter(
    (fx) => (fx.bracketRound ?? 0) === maxRound
  );
  if (roundFixtures.some((fx) => !fx.played)) return [];

  const winners = roundFixtures
    .map((fx) => fx.result?.winnerTeamId)
    .filter((id): id is string => Boolean(id));

  if (winners.length <= 1) return [];
  return generateKnockoutNextRound(winners, stageIndex, maxRound + 1);
}

export function afterMatchUpdate(
  tournament: SavedTournament
): SavedTournament {
  let fixtures = [...tournament.fixtures];
  const stageIndex = getActiveStageIndex(tournament);
  fixtures = resolvePlayoffFinalOpponent(fixtures, stageIndex);

  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  const stage = preset?.stages[stageIndex];
  if (stage?.style === "knockout") {
    const extra = maybeGenerateKnockoutNextRound(
      { ...tournament, fixtures },
      stageIndex
    );
    if (extra.length > 0) {
      fixtures = [...fixtures, ...extra];
    }
  }

  return { ...tournament, fixtures };
}

export function initializeTournamentPlay(
  tournament: SavedTournament
): SavedTournament {
  const presetId = tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID;
  const preset = getFormatPreset(presetId);
  const teamIds = getSelectedTeamIds(tournament);
  const applied = applyPresetToTournament(presetId, teamIds.length);

  let updated: SavedTournament = {
    ...tournament,
    formatPresetId: presetId,
    stageCount: applied.stageCount,
    stages: applied.stages,
    currentStageIndex: 0,
    championTeamId: undefined,
    stageComplete: preset?.stages.map(() => false) ?? [],
    fixtures: [],
  };

  return startStage(updated, 0, teamIds);
}

function startStage(
  tournament: SavedTournament,
  stageIndex: number,
  participants: string[],
  inheritGroups?: Record<string, string>
): SavedTournament {
  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  const stage = preset?.stages[stageIndex];
  if (!stage) return tournament;

  let groupAssignments = inheritGroups ?? tournament.groupAssignments;
  const groupArg =
    stage.style === "group-stage" ? undefined : groupAssignments;
  const { fixtures: newFixtures, groupAssignments: newGroups } =
    generateStageFixtures(stage, stageIndex, participants, groupArg);

  if (newGroups) groupAssignments = newGroups;

  return {
    ...tournament,
    currentStageIndex: stageIndex,
    groupAssignments,
    fixtures: [...tournament.fixtures, ...newFixtures],
  };
}

export interface AdvanceStageResult {
  tournament: SavedTournament;
  advanced: boolean;
  championTeamId?: string;
  message?: string;
}

export function tryAdvanceStage(
  tournament: SavedTournament
): AdvanceStageResult {
  const stageIndex = getActiveStageIndex(tournament);
  if (tournament.championTeamId) {
    return { tournament, advanced: false };
  }

  if (!isStageComplete(tournament, stageIndex)) {
    return { tournament, advanced: false };
  }

  const advance = resolveStageAdvancement(tournament, stageIndex);
  if (!advance) {
    return { tournament, advanced: false };
  }

  const stageComplete = [...(tournament.stageComplete ?? [])];
  while (stageComplete.length <= stageIndex) stageComplete.push(false);
  stageComplete[stageIndex] = true;

  let updated: SavedTournament = {
    ...tournament,
    stageComplete,
  };

  if (advance.championTeamId) {
    return {
      tournament: {
        ...updated,
        championTeamId: advance.championTeamId,
      },
      advanced: true,
      championTeamId: advance.championTeamId,
      message: "Tournament complete",
    };
  }

  const nextIndex = stageIndex + 1;
  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  if (!preset || nextIndex >= preset.stages.length) {
    return { tournament: updated, advanced: false };
  }

  const participants = advance.nextParticipants ?? [];
  if (participants.length < 2 && preset.stages[nextIndex].style === "knockout") {
    if (participants.length === 1) {
      return {
        tournament: {
          ...updated,
          championTeamId: participants[0],
        },
        advanced: true,
        championTeamId: participants[0],
      };
    }
    return { tournament: updated, advanced: false };
  }

  updated = startStage(updated, nextIndex, participants, updated.groupAssignments);

  return {
    tournament: updated,
    advanced: true,
    message: `Stage ${stageIndex + 1} complete — Stage ${nextIndex + 1} started`,
  };
}

export function canInitializePlay(tournament: SavedTournament): boolean {
  const teamIds = getSelectedTeamIds(tournament);
  return (
    teamIds.length >= tournament.teamCount &&
    tournament.teamCount >= 2 &&
    Boolean(tournament.formatPresetId)
  );
}
