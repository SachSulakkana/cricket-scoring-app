import type { TournamentFixture } from "@/lib/roster-types";

export function buildRoundRobinFixtures(teamIds: string[]): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) {
      fixtures.push({
        id: `${teamIds[i]}-${teamIds[j]}`,
        teamAId: teamIds[i],
        teamBId: teamIds[j],
        played: false,
        stageIndex: 0,
      });
    }
  }
  return fixtures;
}

/** Keeps saved fixture order; appends newly required pairings at the end. */
export function mergeTournamentFixtures(
  existing: TournamentFixture[],
  teamIds: string[]
): TournamentFixture[] {
  const generated = buildRoundRobinFixtures(teamIds);
  const generatedById = new Map(generated.map((fx) => [fx.id, fx]));
  const validIds = new Set(generatedById.keys());

  const kept = existing.filter((fx) => validIds.has(fx.id));
  const keptIdSet = new Set(kept.map((fx) => fx.id));
  const added = generated.filter((fx) => !keptIdSet.has(fx.id));

  return [...kept, ...added];
}

export function reorderTournamentFixtures(
  fixtures: TournamentFixture[],
  activeId: string,
  overId: string
): TournamentFixture[] {
  const from = fixtures.findIndex((fx) => fx.id === activeId);
  const to = fixtures.findIndex((fx) => fx.id === overId);
  if (from < 0 || to < 0 || from === to) return fixtures;
  const next = [...fixtures];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
