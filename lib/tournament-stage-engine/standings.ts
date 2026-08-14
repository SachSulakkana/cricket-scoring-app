import type { TournamentFixture } from "@/lib/roster-types";
import {
  addNrrTotals,
  computeTournamentNrr,
  emptyNrrTotals,
  getMatchNrrContributions,
} from "@/lib/tournament-nrr";

export interface StandingEntry {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runDiff: number;
  nrr: number | null;
}

function compareStandings(a: StandingEntry, b: StandingEntry): number {
  if (b.points !== a.points) return b.points - a.points;
  // No completed innings yet ranks as 0.000, matching the displayed value, so a
  // team that hasn't played stays above one carrying a negative NRR.
  const aNrr = a.nrr ?? 0;
  const bNrr = b.nrr ?? 0;
  if (bNrr !== aNrr) return bNrr - aNrr;
  if (b.runDiff !== a.runDiff) return b.runDiff - a.runDiff;
  return a.teamId.localeCompare(b.teamId);
}

export function computeStandings(
  teamIds: string[],
  fixtures: TournamentFixture[],
  config: { totalOvers: number; ballsPerOver: number },
  filter?: { stageIndex?: number; groupId?: string }
): StandingEntry[] {
  const map = new Map<string, StandingEntry>();
  const nrrTotals = new Map<string, ReturnType<typeof emptyNrrTotals>>();

  teamIds.forEach((teamId) => {
    map.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runDiff: 0,
      nrr: null,
    });
    nrrTotals.set(teamId, emptyNrrTotals());
  });

  fixtures.forEach((fx) => {
    if (filter?.stageIndex != null && fx.stageIndex !== filter.stageIndex) return;
    if (filter?.groupId != null && fx.groupId !== filter.groupId) return;
    if (
      !fx.played ||
      fx.result?.abandoned ||
      fx.result?.runsA == null ||
      fx.result?.runsB == null
    ) {
      return;
    }
    const a = map.get(fx.teamAId);
    const b = map.get(fx.teamBId);
    if (!a || !b) return;

    const runsA = fx.result.runsA;
    const runsB = fx.result.runsB;
    a.played += 1;
    b.played += 1;
    a.runDiff += runsA - runsB;
    b.runDiff += runsB - runsA;

    if (fx.result) {
      const contribA = getMatchNrrContributions(
        fx.result,
        fx.teamAId,
        teamIds.length,
        config
      );
      const contribB = getMatchNrrContributions(
        fx.result,
        fx.teamBId,
        teamIds.length,
        config
      );
      if (contribA) {
        nrrTotals.set(
          fx.teamAId,
          addNrrTotals(nrrTotals.get(fx.teamAId) ?? emptyNrrTotals(), contribA)
        );
      }
      if (contribB) {
        nrrTotals.set(
          fx.teamBId,
          addNrrTotals(nrrTotals.get(fx.teamBId) ?? emptyNrrTotals(), contribB)
        );
      }
    }

    const winnerId = fx.result.winnerTeamId;
    if (!winnerId) {
      a.points += 1;
      b.points += 1;
      a.tied += 1;
      b.tied += 1;
      return;
    }
    if (winnerId === fx.teamAId) {
      a.won += 1;
      a.points += 2;
      b.lost += 1;
    } else {
      b.won += 1;
      b.points += 2;
      a.lost += 1;
    }
  });

  map.forEach((row, teamId) => {
    row.nrr = computeTournamentNrr(nrrTotals.get(teamId) ?? emptyNrrTotals());
  });

  return Array.from(map.values()).sort(compareStandings);
}

export function getTopTeamIds(
  standings: StandingEntry[],
  count: number
): string[] {
  return standings.slice(0, count).map((s) => s.teamId);
}
