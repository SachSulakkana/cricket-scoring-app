"use client";

import { ExternalLink, Play, SlidersHorizontal, Trophy } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import type { SavedTournament } from "@/lib/roster-storage";
import { getTournamentProgressLabel } from "@/lib/tournament-play-status";
import {
  useOngoingRunsForTemplate,
  useTournamentTemplates,
} from "@/lib/store/roster-hooks";

interface SelectCustomTournamentPageProps {
  onBack: () => void;
  onCreateTemplate: () => void;
  onStartTemplate: (template: SavedTournament) => void;
  onResumeRun: (run: SavedTournament) => void;
  startingTemplateId?: string | null;
}

function TemplateCard({
  template,
  onStart,
  onResumeRun,
  starting = false,
  disabled = false,
}: {
  template: SavedTournament;
  onStart: () => void;
  onResumeRun: (run: SavedTournament) => void;
  starting?: boolean;
  disabled?: boolean;
}) {
  const ongoingRuns = useOngoingRunsForTemplate(template.id);
  return (
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
            <CricketDetailRow label="Teams" value={String(template.teamCount)} />
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-[oklch(0.55_0.1_145/0.4)] bg-[oklch(0.22_0.06_145/0.35)] p-3">
          <SlidersHorizontal className="h-6 w-6 text-[oklch(0.75_0.12_145)]" />
        </div>
      </div>
      {ongoingRuns.length > 0 && (
        <div className="mt-4 space-y-2">
          <CricketEyebrow className="text-xs">Continue existing run</CricketEyebrow>
          {ongoingRuns.map((run) => (
            <button
              key={run.id}
              type="button"
              disabled={disabled}
              onClick={() => onResumeRun(run)}
              className="w-full rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.22_0.06_75/0.3)] px-3 py-2.5 text-left text-sm text-[var(--cricket-cream)] hover:brightness-110 disabled:opacity-60"
            >
              <span className="font-medium block truncate">{run.name}</span>
              <span className="text-[oklch(0.6_0.03_255)] text-xs">
                {getTournamentProgressLabel(run)}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={disabled || starting}
        className="mt-3 w-full cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament !min-h-10 justify-center inline-flex items-center gap-2 disabled:opacity-70"
      >
        {starting ? (
          <>
            <Spinner className="h-4 w-4" />
            Starting…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Start new run
          </>
        )}
      </button>
    </CricketBroadcastCard>
  );
}

export default function SelectCustomTournamentPage({
  onBack,
  onCreateTemplate,
  onStartTemplate,
  startingTemplateId = null,
}: SelectCustomTournamentPageProps) {
  const templates = useTournamentTemplates();

  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title="Custom tournament"
        backLabel="← Back"
      />

      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <CricketEyebrow>Your templates</CricketEyebrow>
          <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
            Pick a competition you defined under Create Tournament. Starting
            play copies the rules into a new run — your template stays saved.
          </p>
        </div>

        {templates.length === 0 ? (
          <CricketBroadcastCard className="px-6 py-10 text-center">
            <Trophy className="h-12 w-12 text-[oklch(0.5_0.1_75)] mx-auto mb-4" />
            <p className="text-[oklch(0.75_0.02_95)] font-medium">
              No custom templates yet
            </p>
            <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1 mb-5 leading-relaxed">
              Create a tournament template first — name, overs, balls per over,
              and team count — then come back here to play it.
            </p>
            <CricketAddButton
              type="button"
              variant="tournament"
              size="inline"
              onClick={onCreateTemplate}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Go to Create Tournament
            </CricketAddButton>
          </CricketBroadcastCard>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  startingTemplateId != null &&
                    startingTemplateId !== template.id &&
                    "opacity-60 pointer-events-none"
                )}
              >
                <TemplateCard
                  template={template}
                  starting={startingTemplateId === template.id}
                  disabled={startingTemplateId != null}
                  onStart={() => onStartTemplate(template)}
                  onResumeRun={onResumeRun}
                />
              </div>
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <section className="space-y-3">
            <div className="cricket-section-rule" />
            <button
              type="button"
              onClick={onCreateTemplate}
              className="w-full text-left"
            >
              <CricketBroadcastCard className="p-4 hover:brightness-110 transition-[filter]">
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-[var(--cricket-gold)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--cricket-cream)]">
                      Manage templates
                    </p>
                    <p className="text-[oklch(0.6_0.03_255)] text-xs mt-0.5">
                      Add or edit competitions in Create Tournament
                    </p>
                  </div>
                </div>
              </CricketBroadcastCard>
            </button>
          </section>
        )}
      </div>
    </CricketPage>
  );
}
