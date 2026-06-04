"use client";

import { useMemo, useState } from "react";
import ImageDropUpload from "@/components/ImageDropUpload";
import { Spinner } from "@/components/ui/spinner";
import { usePendingAction } from "@/hooks/use-pending-action";
import { appToast } from "@/lib/app-toast";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketFormFieldError,
  CricketFormLabel,
  CricketBackButton,
  CricketPage,
} from "@/components/cricket-shell";
import PlayerAssignCombobox from "@/components/PlayerAssignCombobox";
import {
  findPlayersAlreadyOnOtherTeams,
  getPlayerTeamAssignments,
  saveTeam,
  updateTeam,
} from "@/lib/roster-storage";
import { usePlayers } from "@/lib/store/roster-hooks";
import { Player, Team } from "@/lib/cricket-types";
import { formatPlayerRole } from "@/lib/player-options";
import { Users, X } from "lucide-react";

interface AddTeamPageProps {
  onBack: () => void;
  onSaved: () => void;
  team?: Team;
}

export default function AddTeamPage({
  onBack,
  onSaved,
  team: editingTeam,
}: AddTeamPageProps) {
  const [teamName, setTeamName] = useState(editingTeam?.name ?? "");
  const [ownerName, setOwnerName] = useState(editingTeam?.ownerName ?? "");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(editingTeam?.logoUrl);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    editingTeam?.logoUrl
  );
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>(
    () => editingTeam?.players?.map((p) => p.id) ?? []
  );

  const allPlayers = usePlayers();
  const otherTeamAssignments = useMemo(
    () => getPlayerTeamAssignments(editingTeam?.id),
    [editingTeam?.id]
  );

  const assignedPlayers = useMemo(
    () =>
      assignedPlayerIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter((p): p is Player => Boolean(p)),
    [assignedPlayerIds, allPlayers]
  );

  const handleAddPlayer = (playerId: string) => {
    if (otherTeamAssignments.has(playerId)) return;
    if (assignedPlayerIds.includes(playerId)) return;
    setAssignedPlayerIds((prev) => [...prev, playerId]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setAssignedPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  const getPlayerOptionLabel = (player: Player) => {
    const otherTeam = otherTeamAssignments.get(player.id);
    if (otherTeam) return `${player.name} · ${otherTeam}`;
    if (assignedPlayerIds.includes(player.id)) return `${player.name} · Added`;
    return player.name;
  };

  const isPlayerOptionDisabled = (player: Player) =>
    otherTeamAssignments.has(player.id) ||
    assignedPlayerIds.includes(player.id);

  const { pending, run } = usePendingAction();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!teamName.trim()) errors.teamName = "Enter team name.";
    if (!ownerName.trim()) errors.ownerName = "Enter owner name.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const conflicts = findPlayersAlreadyOnOtherTeams(
      assignedPlayerIds,
      editingTeam?.id
    );
    if (conflicts.length > 0) {
      const names = conflicts
        .map((c) => `${c.playerName} (${c.teamName})`)
        .join(", ");
      appToast.validation(
        `These players are already on another team: ${names}`
      );
      return;
    }

    const savedTeam: Team = {
      id: editingTeam?.id ?? `team-${Date.now()}`,
      name: teamName.trim(),
      ownerName: ownerName.trim(),
      logoUrl,
      players: assignedPlayers,
    };

    void run(
      async () => {
        if (editingTeam?.id) {
          await updateTeam(savedTeam);
        } else {
          await saveTeam(savedTeam);
        }
        onSaved();
      },
      {
        successMessage: editingTeam?.id ? "Team updated" : "Team saved",
        errorMessage: "Could not save team",
      }
    );
  };

  return (
    <CricketPage>
      <div className="max-w-md mx-auto">
      <CricketBackButton
        onClick={onBack}
        ariaLabel="Go back"
        className="mb-5 -ml-2"
      />

      <CricketBroadcastCard className="p-5 space-y-5">
        <div className="flex items-center gap-2.5 pb-1">
          <Users className="h-5 w-5 text-[var(--cricket-gold)]" />
          <div>
            <CricketEyebrow className="mb-0.5">Club registry</CricketEyebrow>
            <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
              {editingTeam?.id ? "Edit Team" : "Create Team"}
            </h2>
          </div>
        </div>

        <div>
          <CricketFormLabel>Team name</CricketFormLabel>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            className={`cricket-form-input${fieldErrors.teamName ? " cricket-form-input--error" : ""}`}
          />
          {fieldErrors.teamName ? (
            <CricketFormFieldError>{fieldErrors.teamName}</CricketFormFieldError>
          ) : null}
        </div>

        <div>
          <CricketFormLabel>Owner name</CricketFormLabel>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Owner name"
            className={`cricket-form-input${fieldErrors.ownerName ? " cricket-form-input--error" : ""}`}
          />
          {fieldErrors.ownerName ? (
            <CricketFormFieldError>{fieldErrors.ownerName}</CricketFormFieldError>
          ) : null}
        </div>

        <div>
          <CricketFormLabel>Assign players</CricketFormLabel>
          {allPlayers.length === 0 ? (
            <p className="text-[oklch(0.72_0.1_75)] text-sm">
              Create players first, then assign them to a team.
            </p>
          ) : (
            <>
              <PlayerAssignCombobox
                players={allPlayers}
                getOptionLabel={getPlayerOptionLabel}
                isOptionDisabled={isPlayerOptionDisabled}
                onSelectPlayer={handleAddPlayer}
                placeholder="Search player to add"
              />
              <p className="text-[oklch(0.5_0.03_255)] text-xs mt-1.5">
                Players already on another team are disabled with that team shown.
              </p>
            </>
          )}

          {assignedPlayers.length > 0 && (
            <ul className="mt-3 space-y-2">
              {assignedPlayers.map((player) => (
                <li key={player.id} className="cricket-squad-chip">
                  <div className="min-w-0">
                    <p className="text-[var(--cricket-cream)] text-sm font-semibold truncate">
                      {player.name}
                    </p>
                    <p className="text-[oklch(0.55_0.03_255)] text-xs">
                      {formatPlayerRole(player.role)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(player.id)}
                    className="shrink-0 p-1 rounded text-[oklch(0.55_0.03_255)] hover:text-[var(--cricket-cream)] hover:bg-[oklch(0.22_0.03_255)]"
                    aria-label={`Remove ${player.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <CricketFormLabel>Logo</CricketFormLabel>
          <ImageDropUpload
            previewUrl={logoPreview}
            onImageChange={(dataUrl) => {
              setLogoUrl(dataUrl);
              setLogoPreview(dataUrl);
            }}
            emptyHint="Drag & drop logo here, or tap to browse"
            previewAlt="Team logo preview"
            inputLabel="Upload team logo"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="cricket-btn-play cricket-btn-play--tournament w-full inline-flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Saving…
            </>
          ) : editingTeam?.id ? (
            "Save Changes"
          ) : (
            "Save Team"
          )}
        </button>
      </CricketBroadcastCard>
      </div>
    </CricketPage>
  );
}
