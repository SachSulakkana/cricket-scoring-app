import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BallData } from "./cricket-types";
import { getLiveScoreEventFromBall } from "./live-score-event";

function ball(overrides: Partial<BallData> = {}): BallData {
  return {
    id: "ball-1",
    runs: 0,
    extra: "none",
    extraRuns: 0,
    dismissal: "none",
    bowlerName: "Bowler",
    batsmanName: "Batsman",
    ballNumber: 1,
    overNumber: 1,
    ...overrides,
  };
}

describe("getLiveScoreEventFromBall", () => {
  it("returns four and six events", () => {
    assert.deepEqual(getLiveScoreEventFromBall(ball({ runs: 4 })), {
      kind: "four",
      label: "FOUR!",
    });
    assert.deepEqual(getLiveScoreEventFromBall(ball({ runs: 6 })), {
      kind: "six",
      label: "SIX!",
    });
  });

  it("returns wicket with dismissed player", () => {
    assert.deepEqual(
      getLiveScoreEventFromBall(
        ball({ dismissal: "caught", dismissedPlayer: "Kohli" })
      ),
      {
        kind: "wicket",
        label: "WICKET!",
        sublabel: "KOHLI",
      }
    );
  });

  it("returns wide, no-ball, bye, and leg-bye events", () => {
    assert.deepEqual(
      getLiveScoreEventFromBall(ball({ extra: "wide", extraRuns: 2 })),
      {
        kind: "wide",
        label: "WIDE",
        sublabel: "+2",
      }
    );
    assert.deepEqual(
      getLiveScoreEventFromBall(ball({ extra: "no-ball", extraRuns: 1 })),
      {
        kind: "no-ball",
        label: "NO BALL",
        sublabel: "+1",
      }
    );
    assert.deepEqual(
      getLiveScoreEventFromBall(ball({ extra: "bye", extraRuns: 2 })),
      {
        kind: "bye",
        label: "BYE",
        sublabel: "+2",
      }
    );
    assert.deepEqual(
      getLiveScoreEventFromBall(ball({ extra: "leg-bye", extraRuns: 1 })),
      {
        kind: "leg-bye",
        label: "LEG BYE",
        sublabel: "+1",
      }
    );
  });

  it("ignores regular runs and overthrows", () => {
    assert.equal(getLiveScoreEventFromBall(ball({ runs: 2 })), null);
    assert.equal(
      getLiveScoreEventFromBall(ball({ extra: "overthrow", extraRuns: 1 })),
      null
    );
  });
});
