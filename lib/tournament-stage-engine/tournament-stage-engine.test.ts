import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generatePlayoffFixtures,
  generateRoundRobinFixtures,
  resolvePlayoffFinalOpponent,
} from "./generate-fixtures";
import { computeStandings, getTopTeamIds } from "./standings";
import type { TournamentFixture } from "@/lib/roster-types";

describe("generateRoundRobinFixtures", () => {
  it("creates 6 matches for 4 teams", () => {
    const ids = ["a", "b", "c", "d"];
    const fx = generateRoundRobinFixtures(ids, 0);
    assert.equal(fx.length, 6);
    assert.ok(fx.every((f) => f.stageIndex === 0));
  });
});

describe("generatePlayoffFixtures", () => {
  it("creates qualifier and pending final", () => {
    const fx = generatePlayoffFixtures(["t1", "t2", "t3"], 1);
    assert.equal(fx.length, 2);
    assert.equal(fx[0].playoffMatchKind, "qualifier");
    assert.equal(fx[0].teamAId, "t2");
    assert.equal(fx[0].teamBId, "t3");
    assert.equal(fx[1].playoffMatchKind, "final");
    assert.equal(fx[1].teamAId, "t1");
  });
});

describe("resolvePlayoffFinalOpponent", () => {
  it("fills final opponent after qualifier", () => {
    const base = generatePlayoffFixtures(["t1", "t2", "t3"], 1);
    const played: TournamentFixture[] = base.map((fx) =>
      fx.playoffMatchKind === "qualifier"
        ? {
            ...fx,
            played: true,
            result: {
              runsA: 100,
              wicketsA: 2,
              runsB: 80,
              wicketsB: 10,
              winnerTeamId: "t2",
            },
          }
        : fx
    );
    const resolved = resolvePlayoffFinalOpponent(played, 1);
    const final = resolved.find((fx) => fx.playoffMatchKind === "final");
    assert.equal(final?.teamBId, "t2");
  });
});

describe("computeStandings", () => {
  it("orders by points then NRR", () => {
    const teams = ["a", "b", "c"];
    const fixtures: TournamentFixture[] = [
      {
        id: "1",
        teamAId: "a",
        teamBId: "b",
        played: true,
        stageIndex: 0,
        result: {
          runsA: 150,
          wicketsA: 2,
          runsB: 100,
          wicketsB: 8,
          winnerTeamId: "a",
        },
      },
      {
        id: "2",
        teamAId: "b",
        teamBId: "c",
        played: true,
        stageIndex: 0,
        result: {
          runsA: 120,
          wicketsA: 3,
          runsB: 110,
          wicketsB: 7,
          winnerTeamId: "b",
        },
      },
    ];
    const standings = computeStandings(teams, fixtures, {
      totalOvers: 20,
      ballsPerOver: 6,
    });
    assert.equal(standings[0].teamId, "a");
    assert.equal(getTopTeamIds(standings, 3).length, 3);
  });

  it("awards 1 point each for a no-play draw", () => {
    const fixtures: TournamentFixture[] = [
      {
        id: "1",
        teamAId: "a",
        teamBId: "b",
        played: true,
        stageIndex: 0,
        result: {
          runsA: 0,
          wicketsA: 0,
          runsB: 0,
          wicketsB: 0,
          drawn: true,
        },
      },
    ];
    const standings = computeStandings(["a", "b"], fixtures, {
      totalOvers: 20,
      ballsPerOver: 6,
    });
    const byId = Object.fromEntries(standings.map((row) => [row.teamId, row]));
    assert.equal(byId.a?.played, 1);
    assert.equal(byId.b?.played, 1);
    assert.equal(byId.a?.points, 1);
    assert.equal(byId.b?.points, 1);
    assert.equal(byId.a?.tied, 1);
    assert.equal(byId.b?.tied, 1);
    assert.equal(byId.a?.won, 0);
    assert.equal(byId.b?.won, 0);
  });
});
