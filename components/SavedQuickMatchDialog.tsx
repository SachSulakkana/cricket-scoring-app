"use client";

import { useEffect, useState } from "react";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
} from "@/components/cricket-shell";
import ExportPdfButton from "@/components/ExportPdfButton";
import MatchDetailTabs, { type MatchDetailTab } from "@/components/MatchDetailTabs";
import TournamentMatchScorecardView from "@/components/TournamentMatchScorecardView";
import CricketLoader from "@/components/CricketLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MatchState } from "@/lib/cricket-types";
import { countsAsWicket } from "@/lib/cricket-types";
import { appToast } from "@/lib/app-toast";
import { getMatchResult } from "@/lib/match-result";
import {
  buildPersistedMatchSnapshot,
  hasPersistedSuperOver,
} from "@/lib/match-snapshot";
import {
  getSuperOverTeamTotals,
  isRegularInningsTied,
} from "@/lib/super-over";
import { exportQuickMatchPdf } from "@/lib/pdf-export";

interface SavedQuickMatchDialogProps {
  matchId: string | null;
  onOpenChange: (open: boolean) => void;
}

function teamMainScore(matchState: MatchState, teamId: string) {
  const innings =
    matchState.innings1?.teamId === teamId
      ? matchState.innings1
      : matchState.innings2;
  if (!innings) return "—";
  let runs = 0;
  let wickets = 0;
  innings.balls.forEach((ball) => {
    runs += ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    if (countsAsWicket(ball.dismissal)) wickets++;
  });
  return `${runs}/${wickets}`;
}

export default function SavedQuickMatchDialog({
  matchId,
  onOpenChange,
}: SavedQuickMatchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<MatchDetailTab>("summary");

  useEffect(() => {
    if (!matchId) {
      setMatchState(null);
      setLabel("");
      setActiveTab("summary");
      return;
    }

    setLoading(true);
    setActiveTab("summary");
    void fetch(`/api/matches/quick/${matchId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load match");
        }
        return res.json() as Promise<{
          match: { label: string; stateJson: string };
        }>;
      })
      .then((data) => {
        setLabel(data.match.label);
        setMatchState(JSON.parse(data.match.stateJson) as MatchState);
      })
      .catch((err) => {
        appToast.error(err instanceof Error ? err.message : "Could not load match");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [matchId, onOpenChange]);

  const handleExportPdf = () => {
    if (!matchState) return;
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

  const snapshot = matchState ? buildPersistedMatchSnapshot(matchState) : null;
  const result = matchState ? getMatchResult(matchState) : null;
  const hasScorecard = Boolean(snapshot?.innings1);

  return (
    <Dialog open={matchId != null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-2xl lg:max-w-4xl max-h-[min(92vh,900px)] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-3 text-left shrink-0 border-b border-[oklch(0.28_0.04_255)]">
          <DialogTitle className="cricket-display text-lg text-[var(--cricket-cream)]">
            {label || "Quick match"}
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.6_0.03_255)]">
            {result?.text ?? "Saved quick match"}
          </DialogDescription>
          {!loading && matchState ? (
            <MatchDetailTabs
              active={activeTab}
              onChange={setActiveTab}
              scorecardDisabled={!hasScorecard}
              className="mt-4"
            />
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 min-h-0">
          {loading ? (
            <CricketLoader block size="md" label="Loading match…" />
          ) : matchState && snapshot && result ? (
            activeTab === "summary" ? (
              <>
                <CricketBroadcastCard className="p-4 space-y-0">
                  <CricketEyebrow className="mb-3">Original match</CricketEyebrow>
                  <CricketDetailRow
                    label={matchState.team1.name}
                    value={teamMainScore(matchState, matchState.team1.id)}
                  />
                  <CricketDetailRow
                    label={matchState.team2.name}
                    value={teamMainScore(matchState, matchState.team2.id)}
                  />
                  {isRegularInningsTied(matchState) ? (
                    <CricketDetailRow label="Main innings" value="Tied" />
                  ) : null}
                  <CricketDetailRow label="Outcome" value={result.text} />
                </CricketBroadcastCard>

                {hasPersistedSuperOver(matchState.superOver) ? (
                  <CricketBroadcastCard accent className="p-4 space-y-0">
                    <CricketEyebrow className="mb-3">Super over</CricketEyebrow>
                    <CricketDetailRow
                      label={matchState.team1.name}
                      value={`${getSuperOverTeamTotals(matchState, matchState.team1.id).runs}/${getSuperOverTeamTotals(matchState, matchState.team1.id).wickets}`}
                    />
                    <CricketDetailRow
                      label={matchState.team2.name}
                      value={`${getSuperOverTeamTotals(matchState, matchState.team2.id).runs}/${getSuperOverTeamTotals(matchState, matchState.team2.id).wickets}`}
                    />
                  </CricketBroadcastCard>
                ) : null}

                <ExportPdfButton
                  onClick={handleExportPdf}
                  loading={exportingPdf}
                  label="Export scorecard PDF"
                  variant="tournament"
                />
              </>
            ) : (
              <>
                <TournamentMatchScorecardView snapshot={snapshot} />
                <ExportPdfButton
                  onClick={handleExportPdf}
                  loading={exportingPdf}
                  label="Export scorecard PDF"
                  variant="tournament"
                />
              </>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
