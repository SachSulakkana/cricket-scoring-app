"use client";

import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
} from "@/components/cricket-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TournamentMatchScorecardView from "@/components/TournamentMatchScorecardView";
import type { Team } from "@/lib/cricket-types";
import type { TournamentFixture } from "@/lib/roster-storage";

interface TournamentMatchSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixture: TournamentFixture;
  teamA: Team;
  teamB: Team;
}

function formatScore(runs: number, wickets: number) {
  return `${runs}/${wickets}`;
}

export default function TournamentMatchSummaryDialog({
  open,
  onOpenChange,
  fixture,
  teamA,
  teamB,
}: TournamentMatchSummaryDialogProps) {
  const result = fixture.result;
  const hasScorecard = Boolean(result?.scorecard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="tournament-match-summary-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-2xl lg:max-w-4xl max-h-[min(92vh,900px)] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-3 text-left shrink-0 border-b border-[oklch(0.28_0.04_255)]">
          <DialogTitle className="cricket-display text-lg text-[var(--cricket-cream)]">
            {teamA.name} vs {teamB.name}
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.6_0.03_255)]">
            Match summary and full scorecard
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 min-h-0">
          {result && (
            <CricketBroadcastCard className="p-4 space-y-0">
              <CricketEyebrow className="mb-3">Result</CricketEyebrow>
              <CricketDetailRow
                label={teamA.name}
                value={formatScore(result.runsA, result.wicketsA)}
              />
              <CricketDetailRow
                label={teamB.name}
                value={formatScore(result.runsB, result.wicketsB)}
              />
              <CricketDetailRow
                label="Outcome"
                value={
                  result.abandoned
                    ? "Abandoned (rain) — no points awarded"
                    : result.winnerTeamId
                      ? result.winnerTeamId === teamA.id
                        ? `${teamA.name} won`
                        : `${teamB.name} won`
                      : "Match tied"
                }
              />
              {result.bestBatting && (
                <CricketDetailRow
                  label="Top batter"
                  value={`${result.bestBatting.playerName} (${result.bestBatting.runs})`}
                />
              )}
              {result.bestBowling && (
                <CricketDetailRow
                  label="Top bowler"
                  value={`${result.bestBowling.playerName} (${result.bestBowling.wickets} wkts)`}
                />
              )}
            </CricketBroadcastCard>
          )}

          {hasScorecard && result?.scorecard ? (
            <div>
              <CricketEyebrow className="mb-3">Scorecard</CricketEyebrow>
              <TournamentMatchScorecardView snapshot={result.scorecard} />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-4 text-sm text-[oklch(0.65_0.03_255)]">
              Full scorecard is not saved for this match. Play or replay the match
              again to store ball-by-ball details.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
