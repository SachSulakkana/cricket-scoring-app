import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { InningsData, MatchState } from "./cricket-types";
import { getMatchResult, isMatchComplete } from "./match-result";

function innings(
  teamId: string,
  teamName: string,
  balls: InningsData["balls"]
): InningsData {
  return {
    teamId,
    teamName,
    balls,
    currentBatsmanIndex: 0,
    currentBowlerIndex: 0,
    strikerPlayerId: "p1",
    nonStrikerPlayerId: "p2",
    currentBowlerPlayerId: "p3",
  };
}

function baseMatchState(overrides: Partial<MatchState> = {}): MatchState {
  return {
    team1: {
      id: "t1",
      name: "Team A",
      players: [
        { id: "p1", name: "A1", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
        { id: "p2", name: "A2", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
      ],
    },
    team2: {
      id: "t2",
      name: "Team B",
      players: [
        { id: "p3", name: "B1", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
        { id: "p4", name: "B2", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
      ],
    },
    config: { totalOvers: 2, ballsPerOver: 6 },
    innings1: innings("t1", "Team A", [
      { id: "b1", runs: 4, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "B1", batsmanName: "A1", ballNumber: 1, overNumber: 1 },
    ]),
    innings2: innings("t2", "Team B", [
      { id: "b2", runs: 1, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "A1", batsmanName: "B1", ballNumber: 1, overNumber: 1 },
    ]),
    currentInnings: 2,
    matchStarted: true,
    superOver: null,
    ...overrides,
  };
}

describe("getMatchResult", () => {
  it("returns runs victory for team 1", () => {
    const result = getMatchResult(baseMatchState());
    assert.equal(result.winnerTeamId, "t1");
    assert.match(result.text, /Team A wins by 3 runs/);
  });

  it("detects a tie when scores level", () => {
    const state = baseMatchState({
      innings2: innings("t2", "Team B", [
        { id: "b2", runs: 4, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "A1", batsmanName: "B1", ballNumber: 1, overNumber: 1 },
      ]),
    });
    const result = getMatchResult(state);
    assert.equal(result.isTie, true);
    assert.equal(result.winnerTeamId, null);
  });
});

describe("isMatchComplete", () => {
  it("is false before second innings chase resolves", () => {
    const state = baseMatchState({
      innings2: innings("t2", "Team B", []),
    });
    assert.equal(isMatchComplete(state), false);
  });
});
