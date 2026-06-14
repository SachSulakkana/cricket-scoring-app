"use client";

import type { ReactNode } from "react";
import { CricketBroadcastCard, CricketEyebrow } from "@/components/cricket-shell";
import { TournamentMatchFaceoff } from "@/components/TournamentMatchFaceoff";
import type { Team } from "@/lib/cricket-types";
import { CheckCircle2, Play } from "lucide-react";

interface TournamentNextMatchHeroProps {
  teamA: Team;
  teamB: Team;
  matchNumber: number;
  onPlayNow: () => void;
  /** Renders inside the schedule list instead of as a standalone dashboard card */
  embedded?: boolean;
  /** Optional prefix in the header row (e.g. drag handle) */
  headerPrefix?: ReactNode;
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
  embedded = false,
  headerPrefix,
}: TournamentNextMatchHeroProps) {
  const content = (
    <>
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {headerPrefix}
            <CricketEyebrow className="mb-0 text-[var(--cricket-gold)]">
              Up next · Match {matchNumber}
            </CricketEyebrow>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[oklch(0.55_0.12_295/0.55)] bg-[oklch(0.22_0.06_295/0.5)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cricket-gold)]">
            Next in schedule
          </span>
        </div>

        <div className="tournament-match-card__faceoff px-4 pb-5 pt-1 sm:px-5 sm:pb-6">
          <TournamentMatchFaceoff teamA={teamA} teamB={teamB} size="lg" />
        </div>

        <div className="px-3 pb-4 sm:px-4 sm:pb-5">
          <button
            type="button"
            draggable={false}
            onClick={onPlayNow}
            className="cricket-btn-play cricket-btn-play--tournament flex w-full min-h-[3.25rem] items-center justify-center gap-2.5 text-base font-bold sm:min-h-[3.5rem] sm:text-lg"
          >
            <Play className="h-5 w-5 shrink-0 fill-current" aria-hidden />
            Play this match
          </button>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="tournament-next-match-hero relative overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <CricketBroadcastCard
      accent
      className="tournament-next-match-hero relative overflow-hidden p-6 sm:p-8"
    >
      {content}
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
