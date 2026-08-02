import type { Team } from "./cricket-types";
import type { TournamentFixture } from "./roster-types";
import {
  calculateBatting,
  calculateBowling,
  resolveBattingBowlingTeams,
} from "./scorecard-stats";

export interface TournamentBattingStat {
  player: string;
  team: string;
  runs: number;
  matches: number;
}

export interface TournamentBowlingStat {
  player: string;
  team: string;
  wickets: number;
  matches: number;
}

function playerKey(team: string, player: string): string {
  return `${team}\0${player}`;
}

function addBatting(
  totals: Map<string, TournamentBattingStat>,
  team: string,
  player: string,
  runs: number
) {
  const key = playerKey(team, player);
  const existing = totals.get(key);
  if (existing) {
    existing.runs += runs;
    existing.matches += 1;
    return;
  }
  if (runs <= 0) return;
  totals.set(key, { player, team, runs, matches: 1 });
}

function addBowling(
  totals: Map<string, TournamentBowlingStat>,
  team: string,
  player: string,
  wickets: number
) {
  const key = playerKey(team, player);
  const existing = totals.get(key);
  if (existing) {
    existing.wickets += wickets;
    existing.matches += 1;
    return;
  }
  if (wickets <= 0) return;
  totals.set(key, { player, team, wickets, matches: 1 });
}

export function buildTournamentPlayerStats(
  fixtures: TournamentFixture[],
  teams: Team[],
  limit = 10
): {
  battingTop: TournamentBattingStat[];
  bowlingTop: TournamentBowlingStat[];
} {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const battingTotals = new Map<string, TournamentBattingStat>();
  const bowlingTotals = new Map<string, TournamentBowlingStat>();

  const teamName = (teamId: string) => teamMap.get(teamId)?.name ?? "Team";

  for (const fixture of fixtures) {
    if (!fixture.played || !fixture.result || fixture.result.abandoned) continue;

    const scorecard = fixture.result.scorecard;
    if (scorecard?.team1 && scorecard?.team2) {
      const ballsPerOver = scorecard.config?.ballsPerOver ?? 6;
      for (const innings of [scorecard.innings1, scorecard.innings2]) {
        if (!innings) continue;
        const { battingTeam, bowlingTeam } = resolveBattingBowlingTeams(
          innings,
          scorecard.team1,
          scorecard.team2
        );

        for (const row of calculateBatting(innings, battingTeam)) {
          addBatting(battingTotals, battingTeam.name, row.name, row.runs);
        }
        for (const row of calculateBowling(innings, bowlingTeam, ballsPerOver)) {
          addBowling(bowlingTotals, bowlingTeam.name, row.name, row.wickets);
        }
      }
      continue;
    }

    // Legacy matches saved without a full scorecard.
    if (fixture.result.bestBatting) {
      addBatting(
        battingTotals,
        teamName(fixture.result.bestBatting.teamId),
        fixture.result.bestBatting.playerName,
        fixture.result.bestBatting.runs
      );
    }
    if (fixture.result.bestBowling) {
      addBowling(
        bowlingTotals,
        teamName(fixture.result.bestBowling.teamId),
        fixture.result.bestBowling.playerName,
        fixture.result.bestBowling.wickets
      );
    }
  }

  const battingTop = Array.from(battingTotals.values())
    .sort((a, b) => b.runs - a.runs || a.player.localeCompare(b.player))
    .slice(0, limit);

  const bowlingTop = Array.from(bowlingTotals.values())
    .sort((a, b) => b.wickets - a.wickets || a.player.localeCompare(b.player))
    .slice(0, limit);

  return { battingTop, bowlingTop };
}
