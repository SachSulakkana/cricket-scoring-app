"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, History, Trophy, Zap } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import CricketLoader from "@/components/CricketLoader";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import type { SavedTournament } from "@/lib/roster-types";
import {
  usePlayTournaments,
  useRosterHydrated,
  useRosterLoading,
  useTeams,
} from "@/lib/store/roster-hooks";
import {
  getTournamentPlayStatus,
  getTournamentResumeRoute,
  getTournamentStatusLabel,
} from "@/lib/tournament-play-status";
import { routes, withReturnTo } from "@/lib/app-routes";
import SavedQuickMatchDialog from "@/components/SavedQuickMatchDialog";
import { cn } from "@/lib/utils";

export interface QuickMatchListItem {
  id: string;
  label: string;
  createdAt: string;
}

interface MatchHistoryPageProps {
  onBack: () => void;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function countPlayedFixtures(tournament: SavedTournament) {
  return tournament.fixtures.filter((fx) => fx.played).length;
}

const historyCardGridClass =
  "grid grid-cols-1 gap-4 list-none m-0 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const historyCardShellClass =
  "tournament-hub-card flex h-full min-h-[240px] flex-col sm:min-h-[280px]";

function HistorySection({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-lg border border-[oklch(0.32_0.04_288)] bg-[oklch(0.08_0.025_295/0.55)] p-4 sm:p-5"
    >
      <div className="mb-4">
        <h2
          id={id}
          className="cricket-display text-base font-bold text-[var(--cricket-cream)] normal-case tracking-wide"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.58_0.03_255)]">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function QuickMatchCard({
  match,
  onOpen,
}: {
  match: QuickMatchListItem;
  onOpen: () => void;
}) {
  return (
    <CricketBroadcastCard className={cn(historyCardShellClass, "overflow-hidden p-0")}>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full w-full flex-col items-center justify-between gap-6 p-5 text-center touch-manipulation transition hover:brightness-105 active:scale-[0.99] sm:gap-6 sm:p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[oklch(0.55_0.12_82/0.35)] bg-[oklch(0.28_0.08_75/0.35)] text-[var(--cricket-gold)]">
            <Zap className="h-7 w-7" aria-hidden />
          </div>
          <CricketEyebrow className="mb-0">Quick match</CricketEyebrow>
        </div>
        <p className="cricket-display line-clamp-3 flex-1 text-lg font-bold leading-snug text-[var(--cricket-cream)] normal-case tracking-normal">
          {match.label}
        </p>
        <p className="text-xs text-[oklch(0.58_0.03_255)]">
          {formatWhen(match.createdAt)}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[oklch(0.58_0.04_255)]">
          View scorecard
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </button>
    </CricketBroadcastCard>
  );
}

function TournamentHistoryCard({
  tournament,
  championName,
  onOpen,
}: {
  tournament: SavedTournament;
  championName?: string;
  onOpen: () => void;
}) {
  const status = getTournamentPlayStatus(tournament);
  const played = countPlayedFixtures(tournament);
  const total = tournament.fixtures.length;

  return (
    <CricketBroadcastCard className={cn(historyCardShellClass, "overflow-hidden p-0")}>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full w-full flex-col items-center justify-between gap-5 p-5 text-center touch-manipulation transition hover:brightness-105 active:scale-[0.99] sm:gap-6 sm:p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[oklch(0.5_0.12_295/0.45)] bg-[oklch(0.2_0.06_295/0.35)] text-[var(--cricket-score)]">
            <Trophy className="h-7 w-7" aria-hidden />
          </div>
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wider",
              status === "finished" &&
                "border-[oklch(0.55_0.12_82/0.45)] bg-[oklch(0.48_0.11_82/0.12)] text-[var(--cricket-gold)]",
              status === "live" &&
                "border-[oklch(0.58_0.24_25/0.45)] bg-[oklch(0.58_0.24_25/0.1)] text-[var(--cricket-live)]",
              status === "setup" &&
                "border-[oklch(0.4_0.06_255/0.45)] bg-[oklch(0.14_0.025_255)] text-[oklch(0.65_0.04_255)]"
            )}
          >
            {getTournamentStatusLabel(status)}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="cricket-display line-clamp-3 text-lg font-bold leading-snug text-[var(--cricket-cream)] normal-case tracking-normal">
            {tournament.name}
          </p>
          <p className="text-xs leading-relaxed text-[oklch(0.58_0.03_255)]">
            {played} of {total} matches played
            {tournament.totalOvers ? ` · ${tournament.totalOvers} overs` : ""}
          </p>
          {championName ? (
            <p className="text-sm font-semibold text-[var(--cricket-gold)]">
              Champion: {championName}
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[oklch(0.58_0.04_255)]">
          View
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </button>
    </CricketBroadcastCard>
  );
}

export default function MatchHistoryPage({ onBack }: MatchHistoryPageProps) {
  const router = useRouter();
  const [quickMatches, setQuickMatches] = useState<QuickMatchListItem[] | null>(
    null
  );
  const [selectedQuickMatchId, setSelectedQuickMatchId] = useState<string | null>(
    null
  );
  const rosterHydrated = useRosterHydrated();
  const rosterLoading = useRosterLoading();
  const playTournaments = usePlayTournaments();
  const teams = useTeams();

  useEffect(() => {
    void fetch("/api/matches/quick")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load quick matches");
        }
        return res.json() as Promise<{ matches: QuickMatchListItem[] }>;
      })
      .then((data) => setQuickMatches(data.matches ?? []))
      .catch(() => setQuickMatches([]));
  }, []);

  const tournamentHistory = useMemo(
    () =>
      [...playTournaments]
        .filter((t) => countPlayedFixtures(t) > 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [playTournaments]
  );

  const teamNameById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams]
  );

  const loading = quickMatches === null || (!rosterHydrated && rosterLoading);
  const hasQuickMatches = quickMatches !== null && quickMatches.length > 0;
  const hasTournaments = tournamentHistory.length > 0;
  const bothEmpty = !loading && !hasQuickMatches && !hasTournaments;

  return (
    <CricketPage wide>
      <CricketPageHeader onBack={onBack} title="Match history" homeHref="/" />

      {loading ? (
        <CricketLoader block size="lg" label="Loading match history…" />
      ) : bothEmpty ? (
        <EmptyState
          icon={<History className="h-12 w-12" />}
          title="No match history yet"
          description="Save a quick match after scoring, or complete tournament fixtures to see them here."
        />
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          {hasQuickMatches && quickMatches && (
            <HistorySection
              id="quick-history-heading"
              title="Quick matches"
              hint="Saved from quick match summary"
            >
              <ul className={historyCardGridClass}>
                {quickMatches.map((match) => (
                  <li key={match.id} className="flex min-h-0">
                    <QuickMatchCard
                      match={match}
                      onOpen={() => setSelectedQuickMatchId(match.id)}
                    />
                  </li>
                ))}
              </ul>
            </HistorySection>
          )}

          {hasTournaments && (
            <HistorySection
              id="tournament-history-heading"
              title="Tournaments"
              hint="Completed and in-progress tournament runs"
            >
              <ul className={historyCardGridClass}>
                {tournamentHistory.map((tournament) => (
                  <li key={tournament.id} className="flex min-h-0">
                    <TournamentHistoryCard
                      tournament={tournament}
                      championName={
                        tournament.championTeamId
                          ? teamNameById.get(tournament.championTeamId)
                          : undefined
                      }
                      onOpen={() =>
                        router.push(
                          withReturnTo(
                            getTournamentResumeRoute(tournament),
                            routes.quickMatchHistory
                          )
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </HistorySection>
          )}
        </div>
      )}

      <SavedQuickMatchDialog
        matchId={selectedQuickMatchId}
        onOpenChange={(open) => {
          if (!open) setSelectedQuickMatchId(null);
        }}
      />
    </CricketPage>
  );
}
