"use client";

import { ExternalLink, SlidersHorizontal, Trophy } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import CustomTournamentTemplateCard from "@/components/CustomTournamentTemplateCard";
import type { TournamentPreset } from "@/lib/cricket-types";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { TOURNAMENT_PRESET_OPTIONS } from "@/lib/tournament-presets";
import type { SavedTournament } from "@/lib/roster-storage";
import { useTournamentTemplates } from "@/lib/store/roster-hooks";
import { cn } from "@/lib/utils";

interface StartNewTournamentPageProps {
  onBack: () => void;
  onSelectPreset: (preset: TournamentPreset) => void;
  onStartCustomTemplate: (template: SavedTournament) => void;
  onResumeCustomRun: (run: SavedTournament) => void;
  onCreateTemplate: () => void;
  loadingPreset?: TournamentPreset | null;
  startingTemplateId?: string | null;
}

export default function StartNewTournamentPage({
  onBack,
  onSelectPreset,
  onStartCustomTemplate,
  onResumeCustomRun,
  onCreateTemplate,
  loadingPreset = null,
  startingTemplateId = null,
}: StartNewTournamentPageProps) {
  const templates = useTournamentTemplates();
  const busy = loadingPreset != null || startingTemplateId != null;

  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title="New tournament"
        backLabel="Go back"
      />

      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <CricketEyebrow>Choose format</CricketEyebrow>
          <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
            Click a format or custom template to open setup.
          </p>
        </div>

        <section className="space-y-3">
          <CricketEyebrow>Standard formats</CricketEyebrow>
          {TOURNAMENT_PRESET_OPTIONS.map((preset) => {
            const isLoading = loadingPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={busy}
                onClick={() => onSelectPreset(preset.id)}
                className={cn(
                  "tournament-pick-btn",
                  busy && !isLoading
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                )}
              >
                <CricketBroadcastCard className="p-5 tournament-hub-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CricketEyebrow className="mb-1">Preset</CricketEyebrow>
                      <h2 className="cricket-display text-2xl font-bold text-[var(--cricket-cream)]">
                        {preset.label}
                      </h2>
                      <p className="text-[oklch(0.65_0.03_255)] text-sm mt-2 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="mt-3 space-y-0">
                        <CricketDetailRow
                          label="Overs"
                          value={String(preset.totalOvers)}
                        />
                        <CricketDetailRow
                          label="Balls / over"
                          value={String(preset.ballsPerOver)}
                        />
                        <CricketDetailRow
                          label="Teams"
                          value={String(preset.defaultTeamCount)}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-[oklch(0.35_0.04_255)] bg-[oklch(0.12_0.025_255)] p-3">
                      {isLoading ? (
                        <Spinner className="h-6 w-6 text-[var(--cricket-gold)]" />
                      ) : (
                        <Trophy className="h-6 w-6 text-[var(--cricket-gold)]" />
                      )}
                    </div>
                  </div>
                </CricketBroadcastCard>
              </button>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="cricket-section-rule" />
          <div className="space-y-2">
            <CricketEyebrow>Custom tournament</CricketEyebrow>
            <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
              Templates from Create Tournament — click a card to start a new run.
            </p>
          </div>

          {templates.length === 0 ? (
            <CricketBroadcastCard className="px-6 py-8 text-center">
              <SlidersHorizontal className="h-10 w-10 text-[oklch(0.5_0.1_295)] mx-auto mb-3" />
              <p className="text-[oklch(0.75_0.02_95)] font-medium text-sm">
                No custom templates yet
              </p>
              <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1 mb-4 leading-relaxed">
                Create a template first — name, overs, balls per over, and team
                count.
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
                  <CustomTournamentTemplateCard
                    template={template}
                    starting={startingTemplateId === template.id}
                    disabled={busy}
                    onStart={() => onStartCustomTemplate(template)}
                    onResumeRun={onResumeCustomRun}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={onCreateTemplate}
                className="tournament-pick-btn cursor-pointer"
              >
                <CricketBroadcastCard className="p-4 tournament-hub-card">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-[var(--cricket-gold)] shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--cricket-cream)]">
                        Manage templates
                      </p>
                      <p className="text-[oklch(0.6_0.03_255)] text-xs mt-0.5">
                        Add or edit in Create Tournament
                      </p>
                    </div>
                  </div>
                </CricketBroadcastCard>
              </button>
            </div>
          )}
        </section>
      </div>
    </CricketPage>
  );
}
