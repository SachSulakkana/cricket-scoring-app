"use client";

import { Trophy } from "lucide-react";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
} from "@/components/cricket-shell";
import type { SavedTournament } from "@/lib/roster-storage";
import type { TournamentPreset } from "@/lib/cricket-types";

interface TournamentPlaceholderProps {
  onBack: () => void;
  preset?: TournamentPreset;
  tournament?: SavedTournament;
}

export default function TournamentPlaceholder({
  onBack,
  preset,
  tournament,
}: TournamentPlaceholderProps) {
  const title = tournament?.name ?? (preset ? `${preset} Tournament` : "Tournament");

  return (
    <CricketPage className="flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <CricketBroadcastCard className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <Trophy className="h-12 w-12 text-[var(--cricket-gold)]" />
          </div>
          <CricketEyebrow>
            {tournament ? "Custom tournament" : "Coming soon"}
          </CricketEyebrow>
          <h1 className="cricket-display text-2xl font-bold text-[var(--cricket-cream)]">
            {title}
          </h1>

          {tournament ? (
            <div className="mt-4 text-left">
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
            </div>
          ) : (
            <p className="text-[oklch(0.65_0.03_255)] mt-3 leading-relaxed">
              Tournament mode is on the way. You’ll be able to run leagues, manage
              fixtures, and track standings with a match-day broadcast feel.
            </p>
          )}

          <p className="text-[oklch(0.55_0.03_255)] text-sm mt-4 leading-relaxed">
            {tournament
              ? "Full custom tournament play is coming soon. Your settings are saved and ready."
              : null}
          </p>

          <button
            type="button"
            onClick={onBack}
            className="cricket-btn-setup w-full mt-5"
          >
            Back
          </button>
        </CricketBroadcastCard>
      </div>
    </CricketPage>
  );
}
