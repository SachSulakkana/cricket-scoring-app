import type { Team } from "@/lib/cricket-types";
import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import type { TournamentFixture } from "@/lib/roster-types";

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

export function getNextTournamentFixture(
  data: SpectatorTournamentData
): NextTournamentFixture | null {
  const teamMap = new Map(data.teams.map((team) => [team.id, team]));
  let matchIndex = 0;

  for (const fixture of data.tournament.fixtures) {
    matchIndex += 1;
    if (fixture.played) continue;
    if (fixture.teamBId === "__pending_qualifier_winner__") continue;

    const teamA = teamMap.get(fixture.teamAId);
    const teamB = teamMap.get(fixture.teamBId);
    if (!teamA || !teamB) continue;

    return {
      id: fixture.id,
      teamA,
      teamB,
      matchNumber: matchIndex,
      stageLabel: fixtureStageLabel(fixture, matchIndex - 1),
      fixture,
    };
  }

  return null;
}
