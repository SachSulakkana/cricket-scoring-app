"use client";

import { useState } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import CricketLoadingButton from "@/components/CricketLoadingButton";
import EmptyState from "@/components/EmptyState";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import RosterHeaderActions from "@/components/RosterHeaderActions";
import { usePendingAction } from "@/hooks/use-pending-action";
import { appToast } from "@/lib/app-toast";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketFormFieldError,
  CricketFormLabel,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatStageSummary } from "@/lib/tournament-stage-options";
import {
  deleteTournament,
  saveTournament,
  updateTournament,
  SavedTournament,
} from "@/lib/roster-storage";
import { useTournamentTemplates } from "@/lib/store/roster-hooks";
import { MoreVertical, Pencil, Trash2, Trophy, UserPlus } from "lucide-react";

interface CreateTournamentPageProps {
  onBack: () => void;
}

const DEFAULT_OVERS = "20";
const DEFAULT_BALLS_PER_OVER = "6";
const DEFAULT_TEAM_COUNT = "4";

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function TournamentCard({
  tournament,
  onEdit,
  onDelete,
  deleting = false,
}: {
  tournament: SavedTournament;
  onEdit: (tournament: SavedTournament) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}) {
  return (
    <CricketBroadcastCard
      className={`roster-card--list-item tournament-list-row overflow-visible p-4${deleting ? " opacity-60 pointer-events-none" : ""}`}
    >
      <div className="roster-card__menu">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="roster-card__menu-btn"
              aria-label={`Options for ${tournament.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="cricket-select-content z-50 min-w-[8.5rem] border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)] text-[var(--cricket-cream)]"
          >
            <DropdownMenuItem
              className="focus:bg-[oklch(0.22_0.08_75)] cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                onEdit(tournament);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                onDelete(tournament.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start gap-3 mb-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)]">
          <Trophy className="h-5 w-5 text-[var(--cricket-gold)]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <h2 className="cricket-display text-base font-semibold text-[var(--cricket-cream)]">
            {tournament.name}
          </h2>
          <p className="text-[oklch(0.55_0.03_255)] text-xs mt-0.5">
            Created {formatCreatedAt(tournament.createdAt)}
          </p>
        </div>
      </div>
      <div>
        <CricketDetailRow label="Overs" value={String(tournament.totalOvers)} />
        <CricketDetailRow
          label="Balls / over"
          value={String(tournament.ballsPerOver)}
        />
        <CricketDetailRow label="Teams" value={String(tournament.teamCount)} />
        {tournament.stageCount > 0 && (
          <CricketDetailRow
            label="Stages"
            value={tournament.stages
              .map((s, i) =>
                `S${i + 1}: ${formatStageSummary(s, tournament.teamCount)}`
              )
              .join(" · ")}
          />
        )}
      </div>
    </CricketBroadcastCard>
  );
}

export default function CreateTournamentPage({
  onBack,
}: CreateTournamentPageProps) {
  const tournaments = useTournamentTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [totalOvers, setTotalOvers] = useState(DEFAULT_OVERS);
  const [ballsPerOver, setBallsPerOver] = useState(DEFAULT_BALLS_PER_OVER);
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const { pending: saving, run: runSave } = usePendingAction();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isEditing = editingId != null;
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTotalOvers(DEFAULT_OVERS);
    setBallsPerOver(DEFAULT_BALLS_PER_OVER);
    setTeamCount(DEFAULT_TEAM_COUNT);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (tournament: SavedTournament) => {
    setEditingId(tournament.id);
    setName(tournament.name);
    setTotalOvers(String(tournament.totalOvers));
    setBallsPerOver(String(tournament.ballsPerOver));
    setTeamCount(String(tournament.teamCount));
    setShowForm(true);
  };

  const parseForm = (): SavedTournament | null => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Enter a tournament name.";

    const overs = parseInt(totalOvers, 10);
    const balls = parseInt(ballsPerOver, 10);
    const teams = parseInt(teamCount, 10);

    if (Number.isNaN(overs) || overs < 1) {
      errors.totalOvers = "Enter at least 1 over.";
    }
    if (Number.isNaN(balls) || balls < 1) {
      errors.ballsPerOver = "Enter at least 1 ball per over.";
    }
    if (Number.isNaN(teams) || teams < 2) {
      errors.teamCount = "Enter at least 2 teams.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return null;

    const existing = isEditing
      ? tournaments.find((t) => t.id === editingId)
      : undefined;

    return {
      id: editingId ?? `tournament-${Date.now()}`,
      name: name.trim(),
      totalOvers: overs,
      ballsPerOver: balls,
      teamCount: teams,
      stageCount: 0,
      stages: [],
      selectedTeamIds: [],
      fixtures: [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      isTemplate: true,
    };
  };

  const handleSave = () => {
    const tournament = parseForm();
    if (!tournament) return;

    void runSave(
      async () => {
        if (isEditing) {
          await updateTournament(tournament);
        } else {
          await saveTournament(tournament);
        }
        closeForm();
      },
      {
        successMessage: isEditing ? "Template updated" : "Template saved",
        errorMessage: "Could not save template",
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const tournamentId = deleteTarget.id;
    setDeletingId(tournamentId);
    void (async () => {
      try {
        await deleteTournament(tournamentId);
        if (editingId === tournamentId) {
          closeForm();
        }
        appToast.success("Template deleted");
        setDeleteTarget(null);
      } catch (err) {
        appToast.error(
          err instanceof Error ? err.message : "Could not delete template"
        );
      } finally {
        setDeletingId(null);
      }
    })();
  };

  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title="Create Tournament"
        action={
          <RosterHeaderActions>
            <RefreshRosterButton />
            <CricketAddButton variant="tournament" onClick={openCreateForm}>
              <UserPlus className="h-3.5 w-3.5" />
              Add Tournament
            </CricketAddButton>
          </RosterHeaderActions>
        }
      />

      {showForm && (
        <CricketBroadcastCard accent className="p-4 mb-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-[var(--cricket-gold)]" />
            <div>
              <CricketEyebrow className="mb-0.5">
                {isEditing ? "Update event" : "New event"}
              </CricketEyebrow>
              <h2 className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
                {isEditing ? "Edit Tournament" : "Add Tournament"}
              </h2>
            </div>
          </div>

          <div>
            <CricketFormLabel htmlFor="tournament-name">Name</CricketFormLabel>
            <input
              id="tournament-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder="e.g. Summer Cup 2026"
              className={`cricket-form-input${fieldErrors.name ? " cricket-form-input--error" : ""}`}
              autoFocus
            />
            {fieldErrors.name ? (
              <CricketFormFieldError>{fieldErrors.name}</CricketFormFieldError>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <CricketFormLabel htmlFor="tournament-overs">Overs</CricketFormLabel>
              <input
                id="tournament-overs"
                type="number"
                min={1}
                value={totalOvers}
                onChange={(e) => setTotalOvers(e.target.value)}
                placeholder="20"
                className={`cricket-form-input${fieldErrors.totalOvers ? " cricket-form-input--error" : ""}`}
              />
              {fieldErrors.totalOvers ? (
                <CricketFormFieldError>{fieldErrors.totalOvers}</CricketFormFieldError>
              ) : null}
            </div>
            <div>
              <CricketFormLabel htmlFor="tournament-balls">
                Balls per over
              </CricketFormLabel>
              <input
                id="tournament-balls"
                type="number"
                min={1}
                value={ballsPerOver}
                onChange={(e) => setBallsPerOver(e.target.value)}
                placeholder="6"
                className={`cricket-form-input${fieldErrors.ballsPerOver ? " cricket-form-input--error" : ""}`}
              />
              {fieldErrors.ballsPerOver ? (
                <CricketFormFieldError>{fieldErrors.ballsPerOver}</CricketFormFieldError>
              ) : null}
            </div>
          </div>

          <div>
            <CricketFormLabel htmlFor="tournament-teams">How many teams</CricketFormLabel>
            <input
              id="tournament-teams"
              type="number"
              min={2}
              value={teamCount}
              onChange={(e) => setTeamCount(e.target.value)}
              placeholder="4"
              className={`cricket-form-input${fieldErrors.teamCount ? " cricket-form-input--error" : ""}`}
            />
            {fieldErrors.teamCount ? (
              <CricketFormFieldError>{fieldErrors.teamCount}</CricketFormFieldError>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <CricketLoadingButton
              type="button"
              variant="tournament"
              size="inline"
              loading={saving}
              loadingLabel={isEditing ? "Updating…" : "Saving…"}
              onClick={handleSave}
            >
              {isEditing ? "Update Tournament" : "Save Tournament"}
            </CricketLoadingButton>
            <button
              type="button"
              onClick={closeForm}
              className="btn-12 btn-12--outline btn-12--md !w-auto !min-h-[2.5rem] px-4"
            >
              Cancel
            </button>
          </div>
        </CricketBroadcastCard>
      )}

      {tournaments.length === 0 && !showForm ? (
        <EmptyState
          icon={<Trophy className="h-12 w-12 text-[oklch(0.5_0.1_75)]" />}
          title="No templates yet"
          description="Save competition rules here, then start a run from Play Tournament → Custom."
          action={
            <CricketAddButton variant="tournament" size="inline" onClick={openCreateForm}>
              <UserPlus className="h-3.5 w-3.5" />
              Add Tournament
            </CricketAddButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onEdit={openEditForm}
              onDelete={(id) => {
                const t = tournaments.find((x) => x.id === id);
                setDeleteTarget({
                  id,
                  label: t?.name ?? "this tournament",
                });
              }}
              deleting={deletingId === tournament.id}
            />
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete template?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.label}? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        loading={deletingId != null}
      />
    </CricketPage>
  );
}
