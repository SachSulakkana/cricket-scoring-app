import type { Team } from "@/lib/cricket-types";
import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import type { TournamentFixture } from "@/lib/roster-types";
import { teamLastName } from "@/lib/live-score-view";
import { getActiveStageIndex } from "@/lib/tournament-stage-engine";

export interface NextTournamentFixture {
  id: string;
  teamA: Team;
  teamB: Team;
  matchNumber: number;
  stageLabel: string;
  fixture: TournamentFixture;
}

function fixtureStageLabel(
  fixture: TournamentFixture,
  index: number
): string {
  const stage = fixture.stageIndex + 1;
  if (fixture.playoffMatchKind === "qualifier") {
    return `Stage ${stage} · Qualifier`;
  }
  if (fixture.playoffMatchKind === "final") {
    return `Stage ${stage} · Final`;
  }
  if (fixture.bracketRound != null) {
    return `Stage ${stage} · Knockout R${fixture.bracketRound + 1}`;
  }
  return `Stage ${stage} · Match ${index + 1}`;
}

function isPlayableUnplayed(
  fixture: TournamentFixture,
  treatAsPlayedIds: Set<string>
): boolean {
  if (treatAsPlayedIds.has(fixture.id)) return false;
  if (fixture.played) return false;
  if (fixture.teamBId === "__pending_qualifier_winner__") return false;
  return true;
}

export function formatComingUpNextLabel(teamA: Team, teamB: Team): string {
  return `${teamLastName(teamA.name)} vs ${teamLastName(teamB.name)}`.toUpperCase();
}

/**
 * Same rule as the tournament schedule "Up next" card:
 * first playable unplayed fixture in the active (or finished match's) stage.
 * `excludeFixtureId` / `afterFixtureId` is treated as already played so the
 * just-finished match is never returned while the save is still propagating.
 */
export function getNextTournamentFixture(
  data: SpectatorTournamentData,
  options?: { excludeFixtureId?: string; afterFixtureId?: string }
): NextTournamentFixture | null {
  const teamMap = new Map(data.teams.map((team) => [team.id, team]));
  const fixtures = data.tournament.fixtures;
  const finishedId = options?.afterFixtureId ?? options?.excludeFixtureId;
  const treatAsPlayed = new Set<string>();
  if (finishedId) treatAsPlayed.add(finishedId);

  const finishedFixture = finishedId
    ? fixtures.find((fixture) => fixture.id === finishedId)
    : undefined;
  const stageIndex =
    finishedFixture?.stageIndex ?? getActiveStageIndex(data.tournament);

  const stageFixtures = fixtures.filter(
    (fixture) => fixture.stageIndex === stageIndex
  );

  for (let i = 0; i < stageFixtures.length; i++) {
    const fixture = stageFixtures[i]!;
    if (!isPlayableUnplayed(fixture, treatAsPlayed)) continue;

    const teamA = teamMap.get(fixture.teamAId);
    const teamB = teamMap.get(fixture.teamBId);
    if (!teamA || !teamB) continue;

    return {
      id: fixture.id,
      teamA,
      teamB,
      matchNumber: i + 1,
      stageLabel: fixtureStageLabel(fixture, i),
      fixture,
    };
  }

  return null;
}
