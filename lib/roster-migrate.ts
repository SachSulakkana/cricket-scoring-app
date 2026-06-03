import { getTeamsPickedCount } from "./tournament-play-status";
import type { SavedTournament } from "./roster-types";

/** Old create-page tournaments with no play data → templates. */
export function migrateLegacyTournamentTemplates(
  tournaments: SavedTournament[]
): { tournaments: SavedTournament[]; changedIds: string[] } {
  const changedIds: string[] = [];
  const next = tournaments.map((t) => {
    if (t.isTemplate === true) return t;
    const teamsPicked = getTeamsPickedCount(t);
    const neverPlayed =
      t.fixtures.length === 0 &&
      teamsPicked === 0 &&
      t.stageCount === 0 &&
      t.stages.length === 0;
    if (!neverPlayed) return t;
    changedIds.push(t.id);
    return { ...t, isTemplate: true };
  });
  return { tournaments: next, changedIds };
}
