import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addNrrTotals,
  computeTournamentNrr,
  emptyNrrTotals,
  formatTournamentNrr,
} from "./tournament-nrr";

describe("tournament-nrr", () => {
  it("formats positive and negative NRR", () => {
    assert.equal(formatTournamentNrr(1.234), "+1.234");
    assert.equal(formatTournamentNrr(-0.5), "-0.500");
    assert.equal(formatTournamentNrr(null), "—");
  });

  it("computes ICC-style net run rate", () => {
    const nrr = computeTournamentNrr({
      runsScored: 200,
      oversFaced: 20,
      runsConceded: 180,
      oversBowled: 20,
    });
    assert.ok(nrr != null && Math.abs(nrr - 1) < 0.001);
  });

  it("aggregates totals across matches", () => {
    const combined = addNrrTotals(
      emptyNrrTotals(),
      { runsScored: 100, oversFaced: 10, runsConceded: 90, oversBowled: 10 }
    );
    assert.equal(combined.runsScored, 100);
    assert.equal(combined.oversBowled, 10);
  });
});
