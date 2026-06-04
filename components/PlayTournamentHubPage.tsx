"use client";

import { useState } from "react";
import { Plus, Play, Trash2, Trophy } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { appToast } from "@/lib/app-toast";
import {
  clearLiveMatchDraftLocal,
  clearLiveMatchDraftRemote,
  loadLiveMatchDraftLocal,
} from "@/lib/live-match-draft";
import { deleteTournament, type SavedTournament } from "@/lib/roster-storage";
import { usePlayTournaments } from "@/lib/store/roster-hooks";
import {
  getTournamentPlayStatus,
  getTournamentProgressLabel,
  getTournamentStatusLabel,
  type TournamentPlayStatus,
} from "@/lib/tournament-play-status";
import { cn } from "@/lib/utils";

interface PlayTournamentHubPageProps {
  onBack: () => void;
  onStartNewTournament: () => void;
  onResumeTournament: (tournament: SavedTournament) => void;
}

function statusBadgeClass(status: TournamentPlayStatus): string {
  switch (status) {
    case "setup":
      return "tournament-hub-badge tournament-hub-badge--setup";
    case "live":
      return "tournament-hub-badge tournament-hub-badge--live";
    case "finished":
      return "tournament-hub-badge tournament-hub-badge--done";
  }
}

function OngoingTournamentCard({
  tournament,
  onResume,
  onDelete,
  deleting,
}: {
  tournament: SavedTournament;
  onResume: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const status = getTournamentPlayStatus(tournament);
  const progress = getTournamentProgressLabel(tournament);
  const isSetup = status === "setup";

  return (
    <CricketBroadcastCard
      className={cn(
        "tournament-hub-card relative overflow-visible p-4",
        deleting && "opacity-60 pointer-events-none"
      )}
    >
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="roster-card__menu-btn absolute top-3 right-3 z-10 min-h-11 min-w-11 border-[oklch(0.5_0.14_25/0.5)] text-[oklch(0.78_0.12_25)] hover:border-[oklch(0.62_0.18_25)] hover:bg-[oklch(0.28_0.1_25/0.55)] touch-manipulation"
        aria-label={`Delete ${tournament.name}`}
        title="Delete tournament"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-10">
        <div className="shrink-0 rounded-xl border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)] p-3">
          <Trophy className="h-6 w-6 text-[var(--cricket-gold)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CricketEyebrow className="mb-0">Tournament</CricketEyebrow>
            <span className={statusBadgeClass(status)}>
              {getTournamentStatusLabel(status)}
            </span>
          </div>
          <h2 className="cricket-display text-xl font-bold text-[var(--cricket-cream)] truncate">
            {tournament.name}
          </h2>
          <p className="text-[oklch(0.6_0.03_255)] text-sm mt-1">{progress}</p>
          <div className="mt-3 space-y-0">
            <CricketDetailRow
              label="Overs"
              value={String(tournament.totalOvers)}
            />
            <CricketDetailRow
              label="Teams"
              value={String(tournament.teamCount)}
            />
            {tournament.stageCount > 0 && (
              <CricketDetailRow
                label="Stages"
                value={String(tournament.stageCount)}
              />
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onResume}
        disabled={deleting}
        className={cn(
          "mt-4 w-full cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament",
          "!min-h-10 justify-center"
        )}
      >
        {status === "finished" ? (
          <>
            <Play className="h-4 w-4" />
            View results
          </>
        ) : isSetup ? (
          <>
            <Play className="h-4 w-4" />
            Continue setup
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Continue tournament
          </>
        )}
      </button>
    </CricketBroadcastCard>
  );
}

export default function PlayTournamentHubPage({
  onBack,
  onStartNewTournament,
  onResumeTournament,
}: PlayTournamentHubPageProps) {
  const tournaments = usePlayTournaments();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id: tournamentId, name } = deleteTarget;
    setDeletingId(tournamentId);
    void (async () => {
      try {
        await deleteTournament(tournamentId);
        const draft = loadLiveMatchDraftLocal();
        if (
          draft?.meta?.kind === "tournament" &&
          draft.meta.tournamentId === tournamentId
        ) {
          clearLiveMatchDraftLocal();
          void clearLiveMatchDraftRemote();
        }
        appToast.success(`"${name}" deleted`);
        setDeleteTarget(null);
      } catch (err) {
        appToast.error(
          err instanceof Error ? err.message : "Could not delete tournament"
        );
      } finally {
        setDeletingId(null);
      }
    })();
  };

  const ongoing = tournaments.filter(
    (t) => getTournamentPlayStatus(t) !== "finished"
  );
  const completed = tournaments.filter(
    (t) => getTournamentPlayStatus(t) === "finished"
  );

  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title="Play Tournament"
        action={<RefreshRosterButton />}
      />

      <div className="space-y-8 max-w-2xl mx-auto">
        <section>
          <CricketBroadcastCard accent className="p-5 tournament-hub-new">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)]">
                <Plus className="h-5 w-5 text-[var(--cricket-gold)]" />
              </div>
              <div className="min-w-0 flex-1">
                <CricketEyebrow className="mb-1">New tournament</CricketEyebrow>
                <h2 className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
                  Start a fresh competition
                </h2>
                <p className="text-[oklch(0.65_0.03_255)] text-sm mt-1 leading-relaxed">
                  Choose T20, ODI, T10, or your custom templates on one screen
                  — then pick squads and play matches.
                </p>
              </div>
            </div>
            <CricketAddButton
              type="button"
              variant="tournament"
              size="full"
              className="mt-4"
              onClick={onStartNewTournament}
            >
              <Plus className="h-4 w-4" />
              Start new tournament
            </CricketAddButton>
          </CricketBroadcastCard>
        </section>

        <section className="space-y-4">
          <div className="cricket-section-rule" />
          <div className="space-y-2">
            <CricketEyebrow>Ongoing tournaments</CricketEyebrow>
            <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
              Pick up where you left off — finish setup or keep playing matches.
            </p>
          </div>

          {ongoing.length === 0 ? (
            <CricketBroadcastCard className="px-6 py-8 text-center">
              <Trophy className="h-10 w-10 text-[oklch(0.5_0.1_75)] mx-auto mb-3" />
              <p className="text-[oklch(0.75_0.02_95)] font-medium text-sm">
                No ongoing tournaments
              </p>
              <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1">
                Start a new tournament above, or open a completed one below.
              </p>
            </CricketBroadcastCard>
          ) : (
            <div className="space-y-3">
              {ongoing.map((tournament) => (
                <OngoingTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  deleting={deletingId === tournament.id}
                  onResume={() => onResumeTournament(tournament)}
                  onDelete={() =>
                    setDeleteTarget({
                      id: tournament.id,
                      name: tournament.name,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        {completed.length > 0 && (
          <section className="space-y-4">
            <div className="cricket-section-rule" />
            <div className="space-y-2">
              <CricketEyebrow>Completed</CricketEyebrow>
              <p className="text-[oklch(0.7_0.03_255)] text-sm leading-relaxed">
                Review results, points, and match scorecards.
              </p>
            </div>
            <div className="space-y-3">
              {completed.map((tournament) => (
                <OngoingTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  deleting={deletingId === tournament.id}
                  onResume={() => onResumeTournament(tournament)}
                  onDelete={() =>
                    setDeleteTarget({
                      id: tournament.id,
                      name: tournament.name,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && !deletingId && setDeleteTarget(null)}
        title="Delete tournament?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? All match results, fixtures, standings, stats, and progress for this tournament will be permanently lost. This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        loading={deletingId != null}
      />
    </CricketPage>
  );
}
