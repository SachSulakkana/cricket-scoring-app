import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { InningsData } from "./cricket-types";
import {
  formatBallChip,
  formatBroadcastBallChip,
  getBallChipRuns,
  getDismissalReplacementEnd,
  getBallsInCurrentOver,
} from "./spectator-live-stats";

const baseBall = {
  extra: "none" as const,
  extraRuns: 0,
  dismissal: "none" as const,
  bowlerName: "Bowler",
  batsmanName: "Striker",
};

function inningsWith(
  balls: InningsData["balls"]
): InningsData {
  return {
    teamId: "t1",
    teamName: "Team A",
    currentBatsmanIndex: 0,
    currentBowlerIndex: 0,
    strikerPlayerId: "p1",
    nonStrikerPlayerId: "p2",
    currentBowlerPlayerId: "p3",
    balls,
  };
}

describe("spectator-live-stats", () => {
  it("returns current-over balls using 0-based overNumber from scoring", () => {
    const innings = inningsWith([
      { ...baseBall, id: "1", runs: 1, ballNumber: 1, overNumber: 0 },
      { ...baseBall, id: "2", runs: 4, ballNumber: 2, overNumber: 0 },
      { ...baseBall, id: "3", runs: 0, ballNumber: 3, overNumber: 0 },
    ]);

    const currentOver = getBallsInCurrentOver(innings, 6);
    assert.equal(currentOver.length, 3);
    assert.deepEqual(
      currentOver.map((ball) => formatBallChip(ball)),
      ["1", "4", "·"]
    );
  });

  it("includes wides in the current over delivery list", () => {
    const innings = inningsWith([
      { ...baseBall, id: "1", runs: 2, ballNumber: 1, overNumber: 0 },
      {
        ...baseBall,
        id: "2",
        runs: 0,
        extra: "wide",
        extraRuns: 1,
        ballNumber: 2,
        overNumber: 0,
      },
      { ...baseBall, id: "3", runs: 4, ballNumber: 3, overNumber: 0 },
    ]);

    const currentOver = getBallsInCurrentOver(innings, 6);
    assert.equal(currentOver.length, 3);
    assert.equal(formatBallChip(currentOver[1]!), "Wd");
    assert.equal(formatBroadcastBallChip(currentOver[1]!), "Wd");
  });

  it("shows running runs on wides and no-balls in scorebar chips", () => {
    const wideWithOne = {
      ...baseBall,
      id: "w1",
      runs: 0,
      extra: "wide" as const,
      extraRuns: 2,
      ballNumber: 1,
      overNumber: 0,
    };
    const noBallWithTwo = {
      ...baseBall,
      id: "nb1",
      runs: 0,
      extra: "no-ball" as const,
      extraRuns: 3,
      ballNumber: 2,
      overNumber: 0,
    };

    assert.equal(formatBallChip(wideWithOne), "1Wd");
    assert.equal(formatBroadcastBallChip(wideWithOne), "1Wd");
    assert.equal(formatBallChip(noBallWithTwo), "2Nb");
    assert.equal(formatBroadcastBallChip(noBallWithTwo), "2Nb");
  });

  it("shows extra runs on bye and leg-bye chips, not bat runs", () => {
    const bye = {
      ...baseBall,
      id: "b1",
      runs: 0,
      extra: "bye" as const,
      extraRuns: 1,
      ballNumber: 1,
      overNumber: 0,
    };
    const legBye = {
      ...baseBall,
      id: "lb1",
      runs: 0,
      extra: "leg-bye" as const,
      extraRuns: 2,
      ballNumber: 2,
      overNumber: 0,
    };

    assert.equal(getBallChipRuns(bye), 1);
    assert.equal(getBallChipRuns(legBye), 2);
    assert.equal(formatBallChip(bye), "1B");
    assert.equal(formatBallChip(legBye), "2Lb");
  });

  it("shows runs and W for run-out deliveries with completed runs", () => {
    const runOutWithOne = {
      ...baseBall,
      id: "ro1",
      runs: 1,
      dismissal: "run-out" as const,
      dismissedPlayer: "Runner",
      ballNumber: 1,
      overNumber: 0,
    };
    const runOutWithTwo = { ...runOutWithOne, id: "ro2", runs: 2 };

    assert.equal(formatBallChip(runOutWithOne), "1W");
    assert.equal(formatBroadcastBallChip(runOutWithOne), "1W");
    assert.equal(formatBallChip(runOutWithTwo), "2W");
    assert.equal(formatBroadcastBallChip(runOutWithTwo), "2W");
  });

  it("shows W for run-out with zero completed runs", () => {
    const runOutDirect = {
      ...baseBall,
      id: "ro0",
      runs: 0,
      dismissal: "run-out" as const,
      dismissedPlayer: "Runner",
      ballNumber: 1,
      overNumber: 0,
    };

    assert.equal(formatBallChip(runOutDirect), "W");
    assert.equal(formatBroadcastBallChip(runOutDirect), "W");
  });

  it("flips replacement end when batsmen crossed on a run-out", () => {
    assert.equal(getDismissalReplacementEnd(true, 0), true);
    assert.equal(getDismissalReplacementEnd(false, 0), false);
    assert.equal(getDismissalReplacementEnd(true, 1), false);
    assert.equal(getDismissalReplacementEnd(false, 1), true);
  });
});
