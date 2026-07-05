"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, MoreVertical, Pencil, Trash2, User, UserPlus } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import { deletePlayer, getPlayerTeamAssignments } from "@/lib/roster-storage";
import { usePlayers } from "@/lib/store/roster-hooks";
import { Player } from "@/lib/cricket-types";
import { playerMatchesSearch } from "@/lib/roster-search";
import {
  formatBattingStyle,
  formatBowlingStyle,
  formatPlayerGender,
  formatPlayerRole,
} from "@/lib/player-options";

interface PlayersListPageProps {
  onBack: () => void;
  onCreatePlayer: () => void;
}

function PlayerCard({
  player,
  teamName,
  onEdit,
  onDelete,
  deleting = false,
}: {
  player: Player;
  teamName?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}) {
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
              aria-label={`Options for ${player.name}`}
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
                onEdit(player.id);
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
                onDelete(player.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CricketProfileHero
        imageUrl={player.imageUrl}
        alt={player.name}
        placeholder={<User className="h-10 w-10 text-[oklch(0.45_0.08_295)]" />}
      />
      <div className="roster-card__body">
        <h2 className="roster-card__title cricket-display">{player.name}</h2>
        <div className="roster-card__details">
          <CricketDetailRow
            label="Gender"
            value={formatPlayerGender(player.gender)}
          />
          <CricketDetailRow
            label="Age"
            value={player.age != null ? `${player.age} years` : "—"}
          />
          <CricketDetailRow label="Role" value={formatPlayerRole(player.role)} />
          <CricketDetailRow
            label="Batting"
            value={formatBattingStyle(player.battingStyle)}
          />
          <CricketDetailRow
            label="Bowling"
            value={formatBowlingStyle(player.bowlingStyle)}
          />
          <CricketDetailRow label="Team" value={teamName ?? "Unassigned"} />
        </div>
      </div>
    </CricketBroadcastCard>
  );
}

export default function PlayersListPage({
  onBack,
  onCreatePlayer,
}: PlayersListPageProps) {
  const router = useRouter();
  const players = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const teamByPlayerId = useMemo(() => getPlayerTeamAssignments(), [players]);

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        playerMatchesSearch(player, searchQuery, teamByPlayerId.get(player.id))
      ),
    [players, searchQuery, teamByPlayerId]
  );

  const handleEdit = (playerId: string) => {
    router.push(routes.editPlayer(playerId));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const playerId = deleteTarget.id;
    setDeletingId(playerId);
    void (async () => {
      try {
        await deletePlayer(playerId);
        appToast.success("Player deleted");
        setDeleteTarget(null);
      } catch (err) {
        appToast.error(
          err instanceof Error ? err.message : "Could not delete player"
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
        title="Players"
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
            <CricketAddButton variant="player" onClick={onCreatePlayer}>
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </CricketAddButton>
          </RosterHeaderActions>
        }
      />

      <CsvImportDialog
        kind="players"
        open={importOpen}
        onOpenChange={setImportOpen}
        existingNames={players.map((p) => p.name)}
        onImported={() => {}}
      />

      {players.length === 0 ? (
        <EmptyState
          icon={<User className="h-12 w-12" />}
          title="No players yet"
          description="Build your squad before the first ball."
          action={
            <CricketAddButton variant="player" onClick={onCreatePlayer}>
              <UserPlus className="h-3.5 w-3.5" />
              Add player
            </CricketAddButton>
          }
        />
      ) : (
        <>
          <RosterSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search players by name, team, role…"
          />
          {filteredPlayers.length === 0 ? (
            <p className="text-center text-sm text-[oklch(0.55_0.03_255)] py-10">
              No players match &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          ) : (
            <div className="roster-card-grid roster-card-grid--players">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  teamName={teamByPlayerId.get(player.id)}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    const player = players.find((p) => p.id === id);
                    setDeleteTarget({
                      id,
                      label: player?.name ?? "this player",
                    });
                  }}
                  deleting={deletingId === player.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete player?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.label}? They will be removed from the squad list and any team.`
            : ""
        }
        onConfirm={confirmDelete}
        loading={deletingId != null}
      />
    </CricketPage>
  );
}
