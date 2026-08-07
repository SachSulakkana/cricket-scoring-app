import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { InningsData, Team } from "./cricket-types";
import {
  calculateBatting,
  calculateInningsTotal,
  calculateOvers,
  formatBattingDismissalStatus,
} from "./scorecard-stats";

const team: Team = {
  id: "t1",
  name: "Team A",
  players: [
    { id: "p1", name: "Striker", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
    { id: "p2", name: "Partner", role: "batsman", gender: "male", battingStyle: "right-hand", bowlingStyle: "none" },
  ],
};

const innings: InningsData = {
  teamId: "t1",
  teamName: "Team A",
  currentBatsmanIndex: 0,
  currentBowlerIndex: 0,
  strikerPlayerId: "p1",
  nonStrikerPlayerId: "p1",
  currentBowlerPlayerId: "p3",
  balls: [
    { id: "1", runs: 4, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "Bowler", batsmanName: "Striker", ballNumber: 1, overNumber: 1 },
    { id: "2", runs: 0, extra: "wide", extraRuns: 1, dismissal: "none", bowlerName: "Bowler", batsmanName: "Striker", ballNumber: 2, overNumber: 1 },
    { id: "3", runs: 6, extra: "none", extraRuns: 0, dismissal: "none", bowlerName: "Bowler", batsmanName: "Striker", ballNumber: 3, overNumber: 1 },
  ],
};

describe("scorecard-stats", () => {
  it("totals runs including extras", () => {
    assert.deepEqual(calculateInningsTotal(innings), { runs: 11, wickets: 0 });
  });

  it("formats overs with legal balls only", () => {
    assert.equal(calculateOvers(innings.balls, 6), "0.2");
  });

  it("builds batting rows with strike rate", () => {
    const rows = calculateBatting(innings, team);
    assert.equal(rows[0]?.name, "Striker");
    assert.equal(rows[0]?.runs, 10);
    assert.equal(rows[0]?.fours, 1);
    assert.equal(rows[0]?.sixes, 1);
  });

  it("shows retired hurt until the batter returns", () => {
    const rhInnings: InningsData = {
      ...innings,
      strikerPlayerId: "p2",
      nonStrikerPlayerId: "p2",
      balls: [
        {
          id: "1",
          runs: 2,
          extra: "none",
          extraRuns: 0,
          dismissal: "none",
          bowlerName: "Bowler",
          batsmanName: "Striker",
          ballNumber: 1,
          overNumber: 0,
        },
        {
          id: "2",
          runs: 0,
          extra: "none",
          extraRuns: 0,
          dismissal: "retired-hurt",
          dismissedPlayer: "Striker",
          bowlerName: "Bowler",
          batsmanName: "Striker",
          ballNumber: 2,
          overNumber: 0,
        },
      ],
    };
    assert.equal(
      formatBattingDismissalStatus(rhInnings, "Striker", "p1"),
      "Retired hurt"
    );
  });

  it("clears retired hurt to not out after the batter returns", () => {
    const returned: InningsData = {
      ...innings,
      strikerPlayerId: "p1",
      nonStrikerPlayerId: "p2",
      balls: [
        {
          id: "1",
          runs: 2,
          extra: "none",
          extraRuns: 0,
          dismissal: "none",
          bowlerName: "Bowler",
          batsmanName: "Striker",
          ballNumber: 1,
          overNumber: 0,
        },
        {
          id: "2",
          runs: 0,
          extra: "none",
          extraRuns: 0,
          dismissal: "retired-hurt",
          dismissedPlayer: "Striker",
          bowlerName: "Bowler",
          batsmanName: "Striker",
          ballNumber: 2,
          overNumber: 0,
        },
        {
          id: "3",
          runs: 1,
          extra: "none",
          extraRuns: 0,
          dismissal: "none",
          bowlerName: "Bowler",
          batsmanName: "Striker",
          ballNumber: 3,
          overNumber: 0,
        },
      ],
    };
    assert.equal(
      formatBattingDismissalStatus(returned, "Striker", "p1"),
      "not out"
    );
    assert.equal(calculateBatting(returned, team)[0]?.dismissal, "not out");
  });
});
