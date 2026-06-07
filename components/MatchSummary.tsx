"use client";

import { useState } from "react";
import Link from "next/link";
import { Database } from "lucide-react";
import { useCricket } from "@/lib/cricket-context";
import { countsAsWicket } from "@/lib/cricket-types";
import { Spinner } from "@/components/ui/spinner";
import { appToast } from "@/lib/app-toast";
import { exportQuickMatchPdf } from "@/lib/pdf-export";
import ExportPdfButton from "@/components/ExportPdfButton";
import { saveQuickMatchToDatabase } from "@/lib/save-quick-match";
import { clearLiveMatchDraftLocal, clearLiveMatchDraftRemote } from "@/lib/live-match-draft";
import { routes } from "@/lib/app-routes";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketPage,
} from "@/components/cricket-shell";

interface MatchSummaryProps {
  onUseSameTeams: () => void;
  onCreateNewTeams: () => void;
}

function InningsStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="cricket-eyebrow mb-1">{label}</p>
      <p className="cricket-score text-2xl text-[var(--cricket-cream)]">{value}</p>
    </div>
  );
}

export default function MatchSummary({
  onUseSameTeams,
  onCreateNewTeams,
}: MatchSummaryProps) {
  const { matchState } = useCricket();
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = () => {
    setExportingPdf(true);
    void exportQuickMatchPdf(matchState)
      .then(() => appToast.success("Scorecard PDF downloaded"))
      .catch((err) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not export PDF"
        )
      )
      .finally(() => setExportingPdf(false));
  };

  const handleSaveToDatabase = () => {
    setSaving(true);
    void saveQuickMatchToDatabase(matchState)
      .then(({ label }) => {
        clearLiveMatchDraftLocal();
        void clearLiveMatchDraftRemote();
        appToast.success(`Quick match saved (${label})`);
      })
      .catch((err) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not save quick match"
        )
      )
      .finally(() => setSaving(false));
  };

  const calculateInningsStats = (inningsId: 1 | 2) => {
    const innings = inningsId === 1 ? matchState.innings1 : matchState.innings2;
    if (!innings)
      return { runs: 0, wickets: 0, balls: 0, legalBalls: 0, oversUsedForNrr: 0 };

    let runs = 0;
    let wickets = 0;
    let legalBalls = 0;

    innings.balls.forEach((ball) => {
      runs += ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
      if (countsAsWicket(ball.dismissal)) wickets++;
      if (ball.extra !== "wide" && ball.extra !== "no-ball") legalBalls++;
    });

    const ballsPerOver = matchState.config?.ballsPerOver || 6;
    const fullQuotaBalls = (matchState.config?.totalOvers || 0) * ballsPerOver;
    const maxWickets = Math.max(
      (inningsId === 1
        ? matchState.team1.players.length
        : matchState.team2.players.length) - 1,
      0
    );
    const isAllOut = wickets >= maxWickets;
    const oversUsedForNrr = isAllOut
      ? fullQuotaBalls / ballsPerOver
      : legalBalls / ballsPerOver;

    return {
      runs,
      wickets,
      balls: innings.balls.length,
      legalBalls,
      oversUsedForNrr,
    };
  };

  const innings1Stats = calculateInningsStats(1);
  const innings2Stats = calculateInningsStats(2);

  const team1RunRate =
    innings1Stats.oversUsedForNrr > 0
      ? innings1Stats.runs / innings1Stats.oversUsedForNrr
      : 0;
  const team2RunRate =
    innings2Stats.oversUsedForNrr > 0
      ? innings2Stats.runs / innings2Stats.oversUsedForNrr
      : 0;
  const team1Nrr = team1RunRate - team2RunRate;
  const team2Nrr = team2RunRate - team1RunRate;

  const getWinner = () => {
    if (innings1Stats.runs > innings2Stats.runs) {
      return `${matchState.team1.name} wins by ${innings1Stats.runs - innings2Stats.runs} runs`;
    }
    if (innings2Stats.runs > innings1Stats.runs) {
      const totalWickets = Math.max(matchState.team2.players.length - 1, 0);
      const wicketsInHand = Math.max(totalWickets - innings2Stats.wickets, 0);
      return `${matchState.team2.name} wins by ${wicketsInHand} wickets`;
    }
    return "Match tied — honours even";
  };

  return (
    <CricketPage className="pt-14">
      <header className="text-center space-y-3 mb-8">
        <CricketEyebrow>Full time</CricketEyebrow>
        <h1 className="cricket-display text-3xl sm:text-4xl font-bold text-[var(--cricket-cream)]">
          Match Summary
        </h1>
        <p className="cricket-display text-lg text-[var(--cricket-score)] tracking-wide">
          {getWinner()}
        </p>
      </header>

      <div className="space-y-4 mb-8">
        <CricketBroadcastCard className="p-4">
          <p className="cricket-display text-base font-semibold text-[var(--cricket-cream)] mb-4">
            {matchState.team1.name}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InningsStat label="Runs" value={innings1Stats.runs} />
            <InningsStat label="Wkts" value={innings1Stats.wickets} />
            <InningsStat label="Balls" value={innings1Stats.balls} />
            <InningsStat
              label="NRR"
              value={`${team1Nrr >= 0 ? "+" : ""}${team1Nrr.toFixed(2)}`}
            />
          </div>
        </CricketBroadcastCard>

        <CricketBroadcastCard className="p-4">
          <p className="cricket-display text-base font-semibold text-[var(--cricket-cream)] mb-4">
            {matchState.team2.name}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InningsStat label="Runs" value={innings2Stats.runs} />
            <InningsStat label="Wkts" value={innings2Stats.wickets} />
            <InningsStat label="Balls" value={innings2Stats.balls} />
            <InningsStat
              label="NRR"
              value={`${team2Nrr >= 0 ? "+" : ""}${team2Nrr.toFixed(2)}`}
            />
          </div>
        </CricketBroadcastCard>
      </div>

      <CricketBroadcastCard accent className="p-5 mb-6 space-y-3 match-summary-save-cta">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)]">
            <Database className="h-5 w-5 text-[var(--cricket-gold)]" />
          </div>
          <div className="min-w-0">
            <CricketEyebrow className="mb-1">Recommended</CricketEyebrow>
            <p className="cricket-display text-base font-semibold text-[var(--cricket-cream)]">
              Save this match to your database
            </p>
            <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1">
              Keeps the full scorecard for later — view it under Match history.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveToDatabase}
          disabled={saving}
          className="cricket-btn-add cricket-btn-add--tournament w-full !min-h-12 inline-flex items-center justify-center gap-2 text-base"
        >
          {saving ? (
            <>
              <Spinner className="h-4 w-4" />
              Saving…
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Save match to database
            </>
          )}
        </button>
        <Link
          href={routes.quickMatchHistory}
          className="block text-center text-sm text-[oklch(0.72_0.1_75)] hover:text-[var(--cricket-cream)] underline-offset-2 hover:underline"
        >
          View saved quick matches
        </Link>
      </CricketBroadcastCard>

      <ExportPdfButton
        onClick={handleExportPdf}
        loading={exportingPdf}
        label="Export scorecard PDF"
        className="mb-3"
      />

      <div className="space-y-3">
        <button
          type="button"
          onClick={onUseSameTeams}
          className="cricket-btn-play cricket-btn-play--quick w-full"
        >
          Rematch — same teams
        </button>
        <button
          type="button"
          onClick={onCreateNewTeams}
          className="cricket-btn-setup w-full !min-h-[3.25rem] !text-base"
        >
          New teams
        </button>
      </div>
    </CricketPage>
  );
}
