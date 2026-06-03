"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { getSavedTournaments, SavedTournament } from "@/lib/roster-storage";
import type { TournamentPreset } from "@/lib/cricket-types";

interface TournamentPresetListPageProps {
  onBack: () => void;
  onSelectPreset: (preset: TournamentPreset) => void;
  onSelectCustomTournament: (tournamentId: string) => void;
  onCreateTournament: () => void;
}

const PRESETS: { id: TournamentPreset; description: string }[] = [
  {
    id: "T20",
    description: "Fast, explosive cricket. Short overs, high intensity, big finishes.",
  },
  {
    id: "ODI",
    description: "Longer rhythm and momentum swings. Built for a full innings story.",
  },
  {
    id: "T10",
    description: "Maximum pace. Ten overs per side — every ball counts.",
  },
];

function CustomTournamentCard({
  tournament,
  onSelect,
}: {
  tournament: SavedTournament;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <CricketBroadcastCard className="p-4 hover:brightness-110 transition-[filter]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CricketEyebrow className="mb-1">Custom</CricketEyebrow>
            <h2 className="cricket-display text-xl font-bold text-[var(--cricket-cream)] truncate">
              {tournament.name}
            </h2>
            <div className="mt-3 space-y-0">
              <CricketDetailRow
                label="Overs"
                value={String(tournament.totalOvers)}
              />
              <CricketDetailRow
                label="Balls / over"
                value={String(tournament.ballsPerOver)}
              />
              <CricketDetailRow
                label="Teams"
                value={String(tournament.teamCount)}
              />
              {tournament.stageCount > 0 && (
                <CricketDetailRow
                  label="Stages"
                  value={`${tournament.stageCount} configured`}
                />
              )}
              {tournament.selectedTeamIds.filter(Boolean).length > 0 && (
                <CricketDetailRow
                  label="Squads"
                  value={`${tournament.selectedTeamIds.filter(Boolean).length} / ${tournament.teamCount} picked`}
                />
              )}
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)] p-3">
            <Trophy className="h-6 w-6 text-[var(--cricket-gold)]" />
          </div>
        </div>
      </CricketBroadcastCard>
    </button>
  );
}

export default function TournamentPresetListPage({
  onBack,
  onSelectPreset,
  onSelectCustomTournament,
  onCreateTournament,
}: TournamentPresetListPageProps) {
  const [tournaments] = useState<SavedTournament[]>(() => getSavedTournaments());

  return (
    <CricketPage>
      <CricketPageHeader onBack={onBack} title="Play Tournament" />

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="cricket-section-rule" />
          <div className="space-y-2">
            <CricketEyebrow>Choose format</CricketEyebrow>
            <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
              Pick a preset to start with standard rules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className="text-left"
              >
                <CricketBroadcastCard className="p-5 hover:brightness-110 transition-[filter]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CricketEyebrow className="mb-1">Preset</CricketEyebrow>
                      <h2 className="cricket-display text-2xl font-bold text-[var(--cricket-cream)]">
                        {preset.id}
                      </h2>
                      <p className="text-[oklch(0.65_0.03_255)] text-sm mt-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl border border-[oklch(0.35_0.04_255)] bg-[oklch(0.12_0.025_255)] p-3">
                      <Trophy className="h-6 w-6 text-[var(--cricket-gold)]" />
                    </div>
                  </div>
                </CricketBroadcastCard>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="cricket-section-rule" />
          <div className="space-y-2">
            <CricketEyebrow>Custom tournament</CricketEyebrow>
            <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
              Tournaments you created with your own overs, balls per over, and team
              count.
            </p>
          </div>

          {tournaments.length === 0 ? (
            <CricketBroadcastCard className="px-6 py-8 text-center">
              <Trophy className="h-10 w-10 text-[oklch(0.5_0.1_75)] mx-auto mb-3" />
              <p className="text-[oklch(0.75_0.02_95)] font-medium text-sm">
                No custom tournaments yet
              </p>
              <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1 mb-4">
                Create one first, then play it from here.
              </p>
              <button
                type="button"
                onClick={onCreateTournament}
                className="cricket-btn-play cricket-btn-play--tournament !w-auto !min-h-10 !text-sm px-4 inline-flex"
              >
                Create Tournament
              </button>
            </CricketBroadcastCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tournaments.map((tournament) => (
                <CustomTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onSelect={() => onSelectCustomTournament(tournament.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </CricketPage>
  );
}
