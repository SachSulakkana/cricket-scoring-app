"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, MoreVertical, Pencil, Trash2, Users, UserPlus } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import CsvImportDialog from "@/components/CsvImportDialog";
import EmptyState from "@/components/EmptyState";
import RosterSearchBar from "@/components/RosterSearchBar";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import RosterHeaderActions from "@/components/RosterHeaderActions";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketAddButton,
  CricketPage,
  CricketPageHeader,
  CricketProfileHero,
} from "@/components/cricket-shell";
import { appToast } from "@/lib/app-toast";
import { deleteTeam } from "@/lib/roster-storage";
import { useTeams } from "@/lib/store/roster-hooks";
import { Team } from "@/lib/cricket-types";
import { routes } from "@/lib/app-routes";
import { teamMatchesSearch } from "@/lib/roster-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamsListPageProps {
  onBack: () => void;
  onCreateTeam: () => void;
}

function TeamCard({
  team,
  onEdit,
  onDelete,
  deleting = false,
}: {
  team: Team;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}) {
  const squadCount = team.players.length;

  return (
    <CricketBroadcastCard
      className={`roster-card overflow-visible${deleting ? " opacity-60 pointer-events-none" : ""}`}
    >
      <div className="roster-card__menu">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="roster-card__menu-btn"
              aria-label={`Options for ${team.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="cricket-select-content min-w-[8.5rem] border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)]"
          >
            <DropdownMenuItem
              className="focus:bg-[oklch(0.22_0.04_295)] cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                onEdit(team.id);
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
                onDelete(team.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CricketProfileHero
        imageUrl={team.logoUrl}
        alt={team.name}
        variant="team"
        placeholder={<Users className="h-10 w-10 text-[oklch(0.45_0.1_295)]" />}
      />
      <div className="roster-card__body">
        <h2 className="roster-card__title cricket-display">{team.name}</h2>
        <div className="roster-card__details">
          <CricketDetailRow
            label="Owner"
            value={team.ownerName?.trim() ? team.ownerName : "—"}
          />
          <CricketDetailRow
            label="Squad"
            value={
              squadCount === 0
                ? "No players"
                : `${squadCount} player${squadCount === 1 ? "" : "s"}`
            }
          />
        </div>
      </div>
    </CricketBroadcastCard>
  );
}

export default function TeamsListPage({
  onBack,
  onCreateTeam,
}: TeamsListPageProps) {
  const router = useRouter();
  const teams = useTeams();
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const filteredTeams = useMemo(
    () => teams.filter((team) => teamMatchesSearch(team, searchQuery)),
    [teams, searchQuery]
  );

  const handleEdit = (teamId: string) => {
    router.push(routes.editTeam(teamId));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const teamId = deleteTarget.id;
    setDeletingId(teamId);
    void (async () => {
      try {
        await deleteTeam(teamId);
        appToast.success("Team deleted");
        setDeleteTarget(null);
      } catch (err) {
        appToast.error(
          err instanceof Error ? err.message : "Could not delete team"
        );
      } finally {
        setDeletingId(null);
      }
    })();
  };

  return (
    <CricketPage roster>
      <CricketPageHeader
        onBack={onBack}
        title="Teams"
        action={
          <RosterHeaderActions>
            <RefreshRosterButton />
            <button
              type="button"
              className="btn-12 btn-12--sm"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="h-3.5 w-3.5" />
              CSV
            </button>
            <CricketAddButton variant="team" onClick={onCreateTeam}>
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </CricketAddButton>
          </RosterHeaderActions>
        }
      />

      <CsvImportDialog
        kind="teams"
        open={importOpen}
        onOpenChange={setImportOpen}
        existingNames={teams.map((t) => t.name)}
        onImported={() => {}}
      />

      {teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No teams yet"
          description="Register a side and take them to the middle."
          action={
            <CricketAddButton variant="team" onClick={onCreateTeam}>
              <UserPlus className="h-3.5 w-3.5" />
              Add team
            </CricketAddButton>
          }
        />
      ) : (
        <>
          <RosterSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search teams by name, owner, or player…"
          />
          {filteredTeams.length === 0 ? (
            <p className="text-center text-sm text-[oklch(0.55_0.03_255)] py-10">
              No teams match &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          ) : (
            <div className="roster-card-grid roster-card-grid--players">
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    const team = teams.find((t) => t.id === id);
                    setDeleteTarget({
                      id,
                      label: team?.name ?? "this team",
                    });
                  }}
                  deleting={deletingId === team.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete team?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.label}? This will remove the team from your saved teams list.`
            : ""
        }
        onConfirm={confirmDelete}
        loading={deletingId != null}
      />
    </CricketPage>
  );
}
