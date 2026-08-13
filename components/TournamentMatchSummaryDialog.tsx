"use client";

import { useState } from "react";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
} from "@/components/cricket-shell";
import ExportPdfButton from "@/components/ExportPdfButton";
import MatchDetailTabs, { type MatchDetailTab } from "@/components/MatchDetailTabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TournamentMatchScorecardView from "@/components/TournamentMatchScorecardView";
import { appToast } from "@/lib/app-toast";
import type { SuperOverState, Team } from "@/lib/cricket-types";
import { countsAsWicket } from "@/lib/cricket-types";
import { hasPersistedSuperOver } from "@/lib/match-snapshot";
import { exportTournamentMatchPdf } from "@/lib/pdf-export";
import type { TournamentFixture } from "@/lib/roster-types";
import { resolveFixtureDisplayScores } from "@/lib/fixture-team-scores";

interface TournamentMatchSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixture: TournamentFixture;
  teamA: Team;
  teamB: Team;
  tournamentName: string;
}

function formatScore(runs: number, wickets: number) {
  return `${runs}/${wickets}`;
}

function superOverTeamScore(superOver: SuperOverState, teamId: string) {
  const innings =
    superOver.innings1?.teamId === teamId
      ? superOver.innings1
      : superOver.innings2?.teamId === teamId
        ? superOver.innings2
        : null;
  if (!innings) return "—";
  let runs = 0;
  let wickets = 0;
  innings.balls.forEach((ball) => {
    runs += ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    if (countsAsWicket(ball.dismissal)) wickets++;
  });
  return formatScore(runs, wickets);
}

export default function TournamentMatchSummaryDialog({
  open,
  onOpenChange,
  fixture,
  teamA,
  teamB,
  tournamentName,
}: TournamentMatchSummaryDialogProps) {
  const result = fixture.result;
  const scores = resolveFixtureDisplayScores(teamA, teamB, result);
  const hasScorecard = Boolean(result?.scorecard);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<MatchDetailTab>("summary");

  const handleExportPdf = () => {
    if (!result?.scorecard) return;
    setExportingPdf(true);
    void exportTournamentMatchPdf({
      tournamentName,
      teamA,
      teamB,
      result,
      config: result.scorecard.config,
    })
      .then(() => appToast.success("Match scorecard PDF downloaded"))
      .catch((err: unknown) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not export PDF"
        )
      )
      .finally(() => setExportingPdf(false));
  };

  const outcomeText = result
    ? result.abandoned
      ? "Abandoned (rain) — no points awarded"
      : result.drawn
        ? "Match drawn — 1 point each"
        : result.scorecard?.mainMatchTied && result.winnerTeamId
        ? `Main match tied · ${
            result.winnerTeamId === teamA.id ? teamA.name : teamB.name
          } won super over`
        : result.scorecard?.superOver?.settledAsDraw
          ? "Main match tied · super over tied (draw)"
          : result.winnerTeamId
            ? result.winnerTeamId === teamA.id
              ? `${teamA.name} won`
              : `${teamB.name} won`
            : "Match tied"
    : "";

  const superOverSnapshot = result?.scorecard?.superOver;
  const showSuperOverSummary =
    hasScorecard &&
    hasPersistedSuperOver(superOverSnapshot) &&
    superOverSnapshot &&
    result?.scorecard;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setActiveTab("summary");
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton
        className="tournament-match-summary-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-2xl lg:max-w-4xl max-h-[min(92vh,900px)] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-3 text-left shrink-0 border-b border-[oklch(0.28_0.04_255)]">
          <DialogTitle className="cricket-display text-lg text-[var(--cricket-cream)]">
            {teamA.name} vs {teamB.name}
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.6_0.03_255)]">
            {outcomeText || "Match summary and scorecard"}
          </DialogDescription>
          {result ? (
            <MatchDetailTabs
              active={activeTab}
              onChange={setActiveTab}
              scorecardDisabled={!hasScorecard}
              className="mt-4"
            />
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 min-h-0">
          {result && activeTab === "summary" ? (
            <>
              <CricketBroadcastCard className="p-4 space-y-0">
                <CricketEyebrow className="mb-3">Original match</CricketEyebrow>
                <CricketDetailRow
                  label={teamA.name.toUpperCase()}
                  value={formatScore(scores.runsA, scores.wicketsA)}
                />
                <CricketDetailRow
                  label={teamB.name.toUpperCase()}
                  value={formatScore(scores.runsB, scores.wicketsB)}
                />
                {result.scorecard?.mainMatchTied ? (
                  <CricketDetailRow label="Main innings" value="Tied" />
                ) : null}
                <CricketDetailRow label="Outcome" value={outcomeText} />
                {result.bestBatting ? (
                  <CricketDetailRow
                    label="Top batter"
                    value={`${result.bestBatting.playerName} (${result.bestBatting.runs})`}
                  />
                ) : null}
                {result.bestBowling ? (
                  <CricketDetailRow
                    label="Top bowler"
                    value={`${result.bestBowling.playerName} (${result.bestBowling.wickets} wkts)`}
                  />
                ) : null}
              </CricketBroadcastCard>

              {showSuperOverSummary && superOverSnapshot ? (
                <CricketBroadcastCard accent className="p-4 space-y-0">
                  <CricketEyebrow className="mb-3">Super over</CricketEyebrow>
                  <CricketDetailRow
                    label={teamA.name}
                    value={superOverTeamScore(superOverSnapshot, teamA.id)}
                  />
                  <CricketDetailRow
                    label={teamB.name}
                    value={superOverTeamScore(superOverSnapshot, teamB.id)}
                  />
                </CricketBroadcastCard>
              ) : null}

              {result.scorecard ? (
                <ExportPdfButton
                  onClick={handleExportPdf}
                  loading={exportingPdf}
                  label="Export match PDF"
                  variant="tournament"
                />
              ) : null}
            </>
          ) : null}

          {result && activeTab === "scorecard" ? (
            hasScorecard && result.scorecard ? (
              <>
                <TournamentMatchScorecardView snapshot={result.scorecard} />
                <ExportPdfButton
                  onClick={handleExportPdf}
                  loading={exportingPdf}
                  label="Export match PDF"
                  variant="tournament"
                />
              </>
            ) : (
              <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-4 text-sm text-[oklch(0.65_0.03_255)]">
                Full scorecard is not saved for this match. Play or replay the match
                again to store ball-by-ball details.
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
