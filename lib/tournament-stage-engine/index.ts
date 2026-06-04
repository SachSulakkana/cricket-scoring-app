export {
  assignTeamsToGroups,
  getTeamsInGroup,
} from "./assign-groups";
export {
  computeStandings,
  getTopTeamIds,
  type StandingEntry,
} from "./standings";
export {
  generateRoundRobinFixtures,
  generateGroupStageFixtures,
  generateKnockoutFixtures,
  generatePlayoffFixtures,
  generateStageFixtures,
  resolvePlayoffFinalOpponent,
} from "./generate-fixtures";
export { resolveStageAdvancement, type StageAdvanceResult } from "./advancement";
export {
  initializeTournamentPlay,
  tryAdvanceStage,
  afterMatchUpdate,
  isStageComplete,
  getActiveFixtures,
  getActiveStageIndex,
  getFixturesForStage,
  getSelectedTeamIds,
  canInitializePlay,
  type AdvanceStageResult,
} from "./progress";
