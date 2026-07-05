import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { MatchState } from "./cricket-types";
import {
  getSuperOverWinnerTeamId,
  isRegularInningsTied,
  SUPER_OVER_BALLS,
} from "./super-over";

describe("super-over", () => {
  it("exports default ball count", () => {
    assert.equal(SUPER_OVER_BALLS, 6);
  });

  it("detects tied regular innings", () => {
    const state = {
      innings1: {
        teamId: "t1",
        teamName: "A",
        balls: [{ id: "1", runs: 10, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "b", batsmanName: "a", ballNumber: 1, overNumber: 1 }],
      },
      innings2: {
        teamId: "t2",
        teamName: "B",
        balls: [{ id: "2", runs: 10, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "a", batsmanName: "b", ballNumber: 1, overNumber: 1 }],
      },
    } as MatchState;
    assert.equal(isRegularInningsTied(state), true);
  });

  it("picks super over winner by runs", () => {
    const state = {
      team1: { id: "t1", name: "A", players: [] },
      team2: { id: "t2", name: "B", players: [] },
      config: null,
      innings1: null,
      innings2: null,
      currentInnings: 2,
      matchStarted: true,
      superOver: {
        firstBattingTeamId: "t1",
        settledAsDraw: false,
        active: false,
        completed: true,
        ballsPerOver: 6,
        currentInnings: 2,
        innings1: {
          teamId: "t1",
          teamName: "A",
          currentBatsmanIndex: 0,
          currentBowlerIndex: 0,
          strikerPlayerId: "p1",
          nonStrikerPlayerId: "p2",
          currentBowlerPlayerId: "p3",
          balls: [{ id: "1", runs: 15, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "b", batsmanName: "a", ballNumber: 1, overNumber: 1 }],
        },
        innings2: {
          teamId: "t2",
          teamName: "B",
          currentBatsmanIndex: 0,
          currentBowlerIndex: 0,
          strikerPlayerId: "p3",
          nonStrikerPlayerId: "p4",
          currentBowlerPlayerId: "p1",
          balls: [{ id: "2", runs: 12, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "a", batsmanName: "b", ballNumber: 1, overNumber: 1 }],
        },
      },
    } as MatchState;
    assert.equal(getSuperOverWinnerTeamId(state), "t1");
  });
});
