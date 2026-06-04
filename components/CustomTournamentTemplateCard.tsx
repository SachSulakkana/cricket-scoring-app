"use client";

import { SlidersHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
} from "@/components/cricket-shell";
import type { SavedTournament } from "@/lib/roster-storage";
import { getTournamentProgressLabel } from "@/lib/tournament-play-status";
import { useOngoingRunsForTemplate } from "@/lib/store/roster-hooks";
import { cn } from "@/lib/utils";

export interface CustomTournamentTemplateCardProps {
  template: SavedTournament;
  onStart: () => void;
  onResumeRun: (run: SavedTournament) => void;
  starting?: boolean;
  disabled?: boolean;
}

export default function CustomTournamentTemplateCard({
  template,
  onStart,
  onResumeRun,
  starting = false,
  disabled = false,
}: CustomTournamentTemplateCardProps) {
  const ongoingRuns = useOngoingRunsForTemplate(template.id);
  const cardDisabled = disabled || starting;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onStart}
        disabled={cardDisabled}
        className={cn(
          "tournament-pick-btn tournament-pick-btn--custom",
          cardDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        )}
      >
        <CricketBroadcastCard className="p-4 tournament-hub-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CricketEyebrow className="mb-1">Template</CricketEyebrow>
              <h2 className="cricket-display text-xl font-bold text-[var(--cricket-cream)] truncate">
                {template.name}
              </h2>
              <div className="mt-3 space-y-0">
                <CricketDetailRow
                  label="Overs"
                  value={String(template.totalOvers)}
                />
                <CricketDetailRow
                  label="Balls / over"
                  value={String(template.ballsPerOver)}
                />
                <CricketDetailRow
                  label="Teams"
                  value={String(template.teamCount)}
                />
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-[oklch(0.55_0.1_295/0.4)] bg-[oklch(0.22_0.06_295/0.35)] p-3">
              {starting ? (
                <Spinner className="h-6 w-6 text-[var(--cricket-gold)]" />
              ) : (
                <SlidersHorizontal className="h-6 w-6 text-[oklch(0.75_0.12_295)]" />
              )}
            </div>
          </div>
        </CricketBroadcastCard>
      </button>

      {ongoingRuns.length > 0 && (
        <div className="space-y-2 pl-0.5">
          <CricketEyebrow className="text-xs">Continue existing run</CricketEyebrow>
          {ongoingRuns.map((run) => (
            <button
              key={run.id}
              type="button"
              disabled={disabled}
              onClick={() => onResumeRun(run)}
              className={cn(
                "tournament-resume-btn w-full rounded-md border border-[oklch(0.55_0.12_295/0.35)] bg-[oklch(0.14_0.05_295/0.4)] px-3 py-2.5 text-left text-sm text-[var(--cricket-cream)] disabled:opacity-60 disabled:cursor-not-allowed",
                !disabled && "cursor-pointer"
              )}
            >
              <span className="font-medium block truncate">{run.name}</span>
              <span className="text-[oklch(0.6_0.03_255)] text-xs">
                {getTournamentProgressLabel(run)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
