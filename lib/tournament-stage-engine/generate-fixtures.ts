import type { TournamentFixture } from "@/lib/roster-types";
import type { TournamentStageConfig } from "@/lib/tournament-stage-options";
import { assignTeamsToGroups, getTeamsInGroup } from "./assign-groups";

function pairId(teamA: string, teamB: string): string {
  return teamA < teamB ? `${teamA}-${teamB}` : `${teamB}-${teamA}`;
}

function roundRobinPairs(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) {
      pairs.push([teamIds[i], teamIds[j]]);
    }
  }
  return pairs;
}

export function generateRoundRobinFixtures(
  teamIds: string[],
  stageIndex: number,
  groupId?: string
): TournamentFixture[] {
  return roundRobinPairs(teamIds).map(([teamAId, teamBId]) => ({
    id: `s${stageIndex}-${groupId ? `${groupId}-` : ""}${pairId(teamAId, teamBId)}`,
    teamAId,
    teamBId,
    played: false,
    stageIndex,
    groupId,
  }));
}

export function generateGroupStageFixtures(
  teamIds: string[],
  stageIndex: number,
  groupCount: number,
  assignments: Record<string, string>
): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  const groups = Array.from(new Set(Object.values(assignments))).sort();
  groups.forEach((groupId) => {
    const inGroup = getTeamsInGroup(assignments, groupId);
    fixtures.push(
      ...generateRoundRobinFixtures(inGroup, stageIndex, groupId)
    );
  });
  return fixtures;
}

/** First round of single-elimination; further rounds generated after results. */
export function generateKnockoutFixtures(
  seededTeamIds: string[],
  stageIndex: number,
  bracketRound = 0
): TournamentFixture[] {
  const teams = [...seededTeamIds];
  if (teams.length < 2) return [];

  if (teams.length % 2 === 1) {
    teams.shift();
  }

  const fixtures: TournamentFixture[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    const teamAId = teams[i];
    const teamBId = teams[i + 1];
    if (!teamBId) continue;
    fixtures.push({
      id: `s${stageIndex}-ko-r${bracketRound}-${pairId(teamAId, teamBId)}`,
      teamAId,
      teamBId,
      played: false,
      stageIndex,
      bracketRound,
    });
  }
  return fixtures;
}

export function generateKnockoutNextRound(
  winners: string[],
  stageIndex: number,
  bracketRound: number
): TournamentFixture[] {
  return generateKnockoutFixtures(winners, stageIndex, bracketRound);
}

/** Top 3: #2 vs #3 qualifier, then winner vs #1 final. */
export function generatePlayoffFixtures(
  seeds: [string, string, string],
  stageIndex: number
): TournamentFixture[] {
  const [t1, t2, t3] = seeds;
  return [
    {
      id: `s${stageIndex}-po-qualifier`,
      teamAId: t2,
      teamBId: t3,
      played: false,
      stageIndex,
      playoffMatchKind: "qualifier",
    },
    {
      id: `s${stageIndex}-po-final`,
      teamAId: t1,
      teamBId: `__pending_qualifier_winner__`,
      played: false,
      stageIndex,
      playoffMatchKind: "final",
    },
  ];
}

export function resolvePlayoffFinalOpponent(
  fixtures: TournamentFixture[],
  stageIndex: number
): TournamentFixture[] {
  const qualifier = fixtures.find(
    (fx) =>
      fx.stageIndex === stageIndex &&
      fx.playoffMatchKind === "qualifier" &&
      fx.played &&
      fx.result?.winnerTeamId
  );
  if (!qualifier?.result?.winnerTeamId) return fixtures;

  return fixtures.map((fx) => {
    if (
      fx.stageIndex === stageIndex &&
      fx.playoffMatchKind === "final" &&
      fx.teamBId === "__pending_qualifier_winner__"
    ) {
      return {
        ...fx,
        teamBId: qualifier.result!.winnerTeamId!,
      };
    }
    return fx;
  });
}

export function generateStageFixtures(
  stage: TournamentStageConfig,
  stageIndex: number,
  participantIds: string[],
  groupAssignments?: Record<string, string>
): { fixtures: TournamentFixture[]; groupAssignments?: Record<string, string> } {
  const style = stage.style === "league" ? "round-robin" : stage.style;

  if (style === "round-robin") {
    return { fixtures: generateRoundRobinFixtures(participantIds, stageIndex) };
  }

  if (style === "group-stage") {
    const groupCount = stage.groupCount ?? 2;
    const assignments =
      groupAssignments ?? assignTeamsToGroups(participantIds, groupCount);
    return {
      fixtures: generateGroupStageFixtures(
        participantIds,
        stageIndex,
        groupCount,
        assignments
      ),
      groupAssignments: assignments,
    };
  }

  if (style === "knockout") {
    return { fixtures: generateKnockoutFixtures(participantIds, stageIndex) };
  }

  if (style === "playoffs" && participantIds.length >= 3) {
    const seeds = participantIds.slice(0, 3) as [string, string, string];
    return { fixtures: generatePlayoffFixtures(seeds, stageIndex) };
  }

  return { fixtures: [] };
}
