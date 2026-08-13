import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BallData, InningsData, MatchState, Player } from "../cricket-types";
import { matchActions, matchReducer } from "./match-slice";

function player(id: string, name: string): Player {
  return {
    id,
    name,
    role: "batsman",
    gender: "male",
    battingStyle: "right-hand",
    bowlingStyle: "none",
  };
}

function ball(partial: Partial<BallData> & Pick<BallData, "id">): BallData {
  return {
    runs: 0,
    extra: "none",
    extraRuns: 0,
    dismissal: "none",
    bowlerName: "B1",
    batsmanName: "A1",
    ballNumber: 1,
    overNumber: 0,
    ...partial,
  };
}

function innings(balls: BallData[], extras: Partial<InningsData> = {}): InningsData {
  return {
    teamId: "t1",
    teamName: "Team A",
    balls,
    currentBatsmanIndex: 0,
    currentBowlerIndex: 0,
    strikerPlayerId: "p1",
    nonStrikerPlayerId: "p2",
    currentBowlerPlayerId: "b1",
    ...extras,
  };
}

function matchState(innings1: InningsData): MatchState {
  return {
    team1: {
      id: "t1",
      name: "Team A",
      players: [player("p1", "A1"), player("p2", "A2"), player("p3", "A3")],
    },
    team2: {
      id: "t2",
      name: "Team B",
      players: [player("b1", "B1"), player("b2", "B2")],
    },
    config: { totalOvers: 2, ballsPerOver: 6 },
    innings1,
    innings2: null,
    currentInnings: 1,
    matchStarted: true,
    superOver: null,
  };
}

function reduce(state: MatchState, action: ReturnType<typeof matchActions.undoLastBall>) {
  return matchReducer({ matchState: state, meta: null }, action).matchState;
}

describe("undoLastBall", () => {
  it("restores strike after undoing an odd-run ball", () => {
    const state = matchState(
      innings([ball({ id: "1", runs: 1, batsmanName: "A1" })], {
        strikerPlayerId: "p2",
        nonStrikerPlayerId: "p1",
      })
    );

    const next = reduce(state, matchActions.undoLastBall());
    assert.equal(next.innings1?.balls.length, 0);
    assert.equal(next.innings1?.strikerPlayerId, "p1");
    assert.equal(next.innings1?.nonStrikerPlayerId, "p2");
  });

  it("keeps strike after undoing a dot ball", () => {
    const state = matchState(
      innings([ball({ id: "1", runs: 0, batsmanName: "A1" })], {
        strikerPlayerId: "p1",
        nonStrikerPlayerId: "p2",
      })
    );

    const next = reduce(state, matchActions.undoLastBall());
    assert.equal(next.innings1?.strikerPlayerId, "p1");
    assert.equal(next.innings1?.nonStrikerPlayerId, "p2");
  });

  it("restores strike after undoing the last ball of an over", () => {
    const balls = [0, 1, 2, 3, 4, 5].map((n) =>
      ball({ id: String(n + 1), ballNumber: n + 1, overNumber: 0, runs: 0 })
    );
    const state = matchState(
      innings(balls, {
        strikerPlayerId: "p2",
        nonStrikerPlayerId: "p1",
        currentBowlerPlayerId: "b2",
        lastBowlerPlayerId: "b1",
      })
    );

    const next = reduce(state, matchActions.undoLastBall());
    assert.equal(next.innings1?.balls.length, 5);
    assert.equal(next.innings1?.strikerPlayerId, "p1");
    assert.equal(next.innings1?.nonStrikerPlayerId, "p2");
    assert.equal(next.innings1?.currentBowlerPlayerId, "b1");
  });
});
