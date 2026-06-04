import type { SavedTournament, TournamentFixture } from "@/lib/roster-types";
import {
  getFormatPreset,
  type StageAdvancementRule,
} from "@/lib/tournament-format-presets";
import { getTeamsInGroup } from "./assign-groups";
import { computeStandings, getTopTeamIds } from "./standings";

export interface StageAdvanceResult {
  championTeamId?: string;
  nextParticipants?: string[];
  /** For playoffs → knockout: [playoffWinner, tableSeed1]. */
  playoffKnockoutPair?: [string, string];
}

function getParticipantIds(tournament: SavedTournament): string[] {
  return tournament.selectedTeamIds.filter((id) => id.length > 0);
}

function getStageFixtures(
  tournament: SavedTournament,
  stageIndex: number
): TournamentFixture[] {
  return tournament.fixtures.filter((fx) => fx.stageIndex === stageIndex);
}

function globalStandingsForStage(
  tournament: SavedTournament,
  stageIndex: number,
  teamIds: string[]
) {
  return computeStandings(teamIds, tournament.fixtures, {
    totalOvers: tournament.totalOvers,
    ballsPerOver: tournament.ballsPerOver,
  }, { stageIndex });
}

export function resolveStageAdvancement(
  tournament: SavedTournament,
  stageIndex: number
): StageAdvanceResult | null {
  const preset = getFormatPreset(
    tournament.formatPresetId ?? "rr-league"
  );
  if (!preset || stageIndex >= preset.stages.length) return null;

  const rule = preset.advancementAfterStage[stageIndex];
  if (!rule) return null;

  const allTeams = getParticipantIds(tournament);
  const stage = preset.stages[stageIndex];
  const stageFixtures = getStageFixtures(tournament, stageIndex);
  const isLastStage = stageIndex === preset.stages.length - 1;

  if (stage.style === "knockout") {
    const finalFx = stageFixtures
      .filter((fx) => fx.played && fx.result?.winnerTeamId)
      .sort((a, b) => (b.bracketRound ?? 0) - (a.bracketRound ?? 0))[0];
    const winnerId = finalFx?.result?.winnerTeamId;
    if (!winnerId) return null;
    if (isLastStage) return { championTeamId: winnerId };
    return { nextParticipants: [winnerId] };
  }

  if (stage.style === "playoffs") {
    const finalFx = stageFixtures.find(
      (fx) =>
        fx.playoffMatchKind === "final" &&
        fx.played &&
        fx.result?.winnerTeamId &&
        fx.teamBId !== "__pending_qualifier_winner__"
    );
    const winnerId = finalFx?.result?.winnerTeamId;
    if (!winnerId) return null;

    if (rule.kind === "playoffs-then-champion" && isLastStage) {
      return { championTeamId: winnerId };
    }

    if (rule.kind === "playoffs-advance-to-knockout") {
      const prevStage = stageIndex - 1;
      const prevStandings = globalStandingsForStage(
        tournament,
        prevStage,
        allTeams
      );
      const seed1 = prevStandings[0]?.teamId;
      const pair = [winnerId, seed1].filter(
        (id, i, arr) => Boolean(id) && arr.indexOf(id) === i
      ) as string[];
      if (pair.length >= 2) {
        return { nextParticipants: pair, playoffKnockoutPair: pair as [string, string] };
      }
      return { championTeamId: winnerId };
    }
  }

  const poolIds =
    stage.style === "group-stage" && tournament.groupAssignments
      ? allTeams
      : allTeams;

  const standings = globalStandingsForStage(
    tournament,
    stageIndex,
    poolIds
  );

  switch (rule.kind) {
    case "table-champion": {
      const top = standings[0]?.teamId;
      if (!top) return null;
      return { championTeamId: top };
    }
    case "top-n-knockout": {
      const n = Math.min(rule.count ?? 4, standings.length);
      return { nextParticipants: getTopTeamIds(standings, n) };
    }
    case "top-2-per-group-knockout": {
      if (!tournament.groupAssignments) {
        return { nextParticipants: getTopTeamIds(standings, 4) };
      }
      const groups = Array.from(
        new Set(Object.values(tournament.groupAssignments))
      ).sort();
      const advanced: string[] = [];
      groups.forEach((groupId) => {
        const inGroup = getTeamsInGroup(tournament.groupAssignments!, groupId);
        const groupStandings = computeStandings(
          inGroup,
          tournament.fixtures,
          {
            totalOvers: tournament.totalOvers,
            ballsPerOver: tournament.ballsPerOver,
          },
          { stageIndex, groupId }
        );
        advanced.push(...getTopTeamIds(groupStandings, 2));
      });
      return { nextParticipants: advanced };
    }
    case "top-3-playoffs":
    case "top-n-table": {
      const n = rule.kind === "top-3-playoffs" ? 3 : (rule.count ?? 3);
      return { nextParticipants: getTopTeamIds(standings, n) };
    }
    case "top-1-per-group-rr": {
      if (!tournament.groupAssignments) {
        return { nextParticipants: getTopTeamIds(standings, 4) };
      }
      const groups = Array.from(
        new Set(Object.values(tournament.groupAssignments))
      ).sort();
      const advanced: string[] = [];
      groups.forEach((groupId) => {
        const inGroup = getTeamsInGroup(tournament.groupAssignments!, groupId);
        const groupStandings = computeStandings(
          inGroup,
          tournament.fixtures,
          {
            totalOvers: tournament.totalOvers,
            ballsPerOver: tournament.ballsPerOver,
          },
          { stageIndex, groupId }
        );
        const top = groupStandings[0]?.teamId;
        if (top) advanced.push(top);
      });
      return { nextParticipants: advanced };
    }
    default:
      return null;
  }
}
