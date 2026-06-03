"use client";

import { SlidersHorizontal, Trophy } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { TournamentPreset } from "@/lib/cricket-types";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { TOURNAMENT_PRESET_OPTIONS } from "@/lib/tournament-presets";
import { cn } from "@/lib/utils";

interface StartNewTournamentPageProps {
  onBack: () => void;
  onSelectPreset: (preset: TournamentPreset) => void;
  onSelectCustom: () => void;
  loadingPreset?: TournamentPreset | null;
}

export default function StartNewTournamentPage({
  onBack,
  onSelectPreset,
  onSelectCustom,
  loadingPreset = null,
}: StartNewTournamentPageProps) {
  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title="New tournament"
        backLabel="← Back"
      />

      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <CricketEyebrow>Choose format</CricketEyebrow>
          <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
            Pick a standard format or use a custom template you saved under
            Create Tournament.
          </p>
        </div>

        <section className="space-y-3">
          {TOURNAMENT_PRESET_OPTIONS.map((preset) => {
            const isLoading = loadingPreset === preset.id;
            return (
            <button
              key={preset.id}
              type="button"
              disabled={loadingPreset != null}
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                "w-full text-left",
                loadingPreset != null && !isLoading && "opacity-60"
              )}
            >
              <CricketBroadcastCard className="p-5 hover:brightness-110 transition-[filter] tournament-hub-card">
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

        <section className="space-y-3">
          <div className="cricket-section-rule" />
          <button
            type="button"
            onClick={onSelectCustom}
            className="w-full text-left"
          >
            <CricketBroadcastCard className="p-5 hover:brightness-110 transition-[filter] tournament-hub-card border-[oklch(0.55_0.08_145/0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CricketEyebrow className="mb-1">Custom</CricketEyebrow>
                  <h2 className="cricket-display text-2xl font-bold text-[var(--cricket-cream)]">
                    Custom tournament
                  </h2>
                  <p className="text-[oklch(0.65_0.03_255)] text-sm mt-2 leading-relaxed">
                    Choose from your saved templates — create or edit them under
                    Create Tournament on the home screen.
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-[oklch(0.55_0.1_145/0.4)] bg-[oklch(0.22_0.06_145/0.35)] p-3">
                  <SlidersHorizontal className="h-6 w-6 text-[oklch(0.75_0.12_145)]" />
                </div>
              </div>
            </CricketBroadcastCard>
          </button>
        </section>
      </div>
    </CricketPage>
  );
}
