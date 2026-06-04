"use client";

import { CricketBroadcastCard, CricketEyebrow } from "@/components/cricket-shell";
import type { Team } from "@/lib/cricket-types";
import { CheckCircle2, Play } from "lucide-react";

interface TournamentNextMatchHeroProps {
  teamA: Team;
  teamB: Team;
  matchNumber: number;
  onPlayNow: () => void;
}

interface TournamentCompleteHeroProps {
  playedCount: number;
  totalFixtures: number;
}

export function TournamentNextMatchHero({
  teamA,
  teamB,
  matchNumber,
  onPlayNow,
}: TournamentNextMatchHeroProps) {
  return (
    <CricketBroadcastCard
      accent
      className="tournament-next-match-hero relative overflow-hidden p-6 sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.45_0.14_295/0.28),transparent_65%)]"
        aria-hidden
      />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CricketEyebrow className="mb-0 text-[var(--cricket-gold)]">
            Up next · Match {matchNumber}
          </CricketEyebrow>
          <span className="inline-flex items-center rounded-full border border-[oklch(0.55_0.12_295/0.55)] bg-[oklch(0.22_0.06_295/0.5)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cricket-gold)]">
            Next in schedule
          </span>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <div className="min-w-0 text-center sm:text-right">
            <p className="cricket-display text-2xl font-bold leading-tight text-[var(--cricket-cream)] sm:text-3xl">
              {teamA.name}
            </p>
          </div>
          <p className="cricket-display text-center text-xl font-semibold text-[var(--cricket-gold)] sm:text-2xl">
            vs
          </p>
          <div className="min-w-0 text-center sm:text-left">
            <p className="cricket-display text-2xl font-bold leading-tight text-[var(--cricket-cream)] sm:text-3xl">
              {teamB.name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPlayNow}
          className="cricket-btn-play cricket-btn-play--tournament flex w-full min-h-[3.25rem] items-center justify-center gap-2.5 text-base font-bold sm:min-h-[3.5rem] sm:text-lg"
        >
          <Play className="h-5 w-5 shrink-0 fill-current" aria-hidden />
          Play this match
        </button>
      </div>
    </CricketBroadcastCard>
  );
}

export function TournamentChampionHero({
  championName,
  tournamentName,
}: {
  championName: string;
  tournamentName: string;
}) {
  return (
    <CricketBroadcastCard
      accent
      className="tournament-next-match-hero relative overflow-hidden p-6 sm:p-8 text-center"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.5_0.16_85/0.25),transparent_65%)]"
        aria-hidden
      />
      <div className="relative z-10">
        <CheckCircle2
          className="mx-auto mb-3 h-14 w-14 text-[var(--cricket-gold)]"
          aria-hidden
        />
        <CricketEyebrow className="mb-2 justify-center text-[var(--cricket-gold)]">
          {tournamentName}
        </CricketEyebrow>
        <p className="cricket-display text-3xl font-bold text-[var(--cricket-cream)] sm:text-4xl">
          {championName}
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cricket-gold)]">
          Tournament champion
        </p>
      </div>
    </CricketBroadcastCard>
  );
}

export function TournamentCompleteHero({
  playedCount,
  totalFixtures,
}: TournamentCompleteHeroProps) {
  return (
    <CricketBroadcastCard
      accent
      className="tournament-next-match-hero p-6 sm:p-8 text-center"
    >
      <CheckCircle2
        className="mx-auto mb-3 h-12 w-12 text-[var(--cricket-gold)]"
        aria-hidden
      />
      <CricketEyebrow className="mb-2 justify-center text-[var(--cricket-gold)]">
        Tournament complete
      </CricketEyebrow>
      <p className="cricket-display text-2xl font-bold text-[var(--cricket-cream)]">
        All matches played
      </p>
      <p className="mt-2 text-sm text-[oklch(0.62_0.03_288)]">
        {playedCount} of {totalFixtures} fixtures finished — check the point table and
        stats.
      </p>
    </CricketBroadcastCard>
  );
}
