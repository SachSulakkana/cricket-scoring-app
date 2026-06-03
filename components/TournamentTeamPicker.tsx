"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CricketEyebrow, CricketProfileHero } from "@/components/cricket-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { routes } from "@/lib/app-routes";
import { Team } from "@/lib/cricket-types";
import {
  Check,
  Lock,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TournamentTeamPickerProps {
  teamCount: number;
  teamSlots: string[];
  savedTeams: Team[];
  onTeamSlotsChange: (slots: string[]) => void;
  /** Bump to highlight incomplete selection (e.g. failed save). */
  attentionSignal?: number;
  /** Render inside a parent card (no nested broadcast card). */
  embedded?: boolean;
  id?: string;
}

function findNextEmptySlot(slots: string[], afterIndex?: number): number | null {
  if (afterIndex !== undefined) {
    for (let i = afterIndex + 1; i < slots.length; i++) {
      if (!slots[i]) return i;
    }
    for (let i = 0; i <= afterIndex; i++) {
      if (!slots[i]) return i;
    }
    return null;
  }
  const idx = slots.findIndex((id) => !id);
  return idx === -1 ? null : idx;
}

export default function TournamentTeamPicker({
  teamCount,
  teamSlots,
  savedTeams,
  onTeamSlotsChange,
  attentionSignal = 0,
  embedded = false,
  id,
}: TournamentTeamPickerProps) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [justPickedSlot, setJustPickedSlot] = useState<number | null>(null);
  const [shakeSlots, setShakeSlots] = useState(false);
  const autoOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dialogOpen = activeSlot !== null;

  const teamsById = useMemo(
    () => new Map(savedTeams.map((team) => [team.id, team])),
    [savedTeams]
  );

  const selectedCount = useMemo(
    () => teamSlots.filter((id) => id.length > 0).length,
    [teamSlots]
  );

  const allSelected = selectedCount >= teamCount && teamCount > 0;
  const progressPct =
    teamCount > 0 ? Math.min(100, (selectedCount / teamCount) * 100) : 0;

  const nextEmptySlot = useMemo(() => findNextEmptySlot(teamSlots), [teamSlots]);

  const isTeamTaken = useCallback(
    (teamId: string, slotIndex: number) =>
      teamSlots.some((id, i) => i !== slotIndex && id === teamId),
    [teamSlots]
  );

  const getTeamSlotLabel = useCallback(
    (teamId: string, excludeSlot: number) => {
      const slotIndex = teamSlots.findIndex(
        (id, i) => id === teamId && i !== excludeSlot
      );
      return slotIndex === -1 ? null : slotIndex + 1;
    },
    [teamSlots]
  );

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedTeams;
    return savedTeams.filter((team) => team.name.toLowerCase().includes(q));
  }, [savedTeams, searchQuery]);

  const availableInDialogCount = useMemo(() => {
    if (activeSlot === null) return 0;
    return savedTeams.filter((team) => !isTeamTaken(team.id, activeSlot)).length;
  }, [activeSlot, savedTeams, isTeamTaken]);

  useEffect(() => {
    return () => {
      if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
    };
  }, []);

  useEffect(() => {
    if (attentionSignal <= 0 || allSelected) return;
    setShakeSlots(true);
    const t = setTimeout(() => setShakeSlots(false), 520);
    return () => clearTimeout(t);
  }, [attentionSignal, allSelected]);

  useEffect(() => {
    if (justPickedSlot === null) return;
    const t = setTimeout(() => setJustPickedSlot(null), 700);
    return () => clearTimeout(t);
  }, [justPickedSlot]);

  const openSlot = (index: number) => {
    setSearchQuery("");
    setActiveSlot(index);
  };

  const handlePickTeam = (teamId: string) => {
    if (activeSlot === null) return;
    const slot = activeSlot;
    const nextSlots = teamSlots.map((id, i) => (i === slot ? teamId : id));
    onTeamSlotsChange(nextSlots);
    setJustPickedSlot(slot);
    setActiveSlot(null);

    const nextEmpty = findNextEmptySlot(nextSlots, slot);
    if (nextEmpty !== null && nextEmpty !== slot) {
      if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = setTimeout(() => openSlot(nextEmpty), 380);
    }
  };

  const clearSlotAt = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onTeamSlotsChange(teamSlots.map((id, i) => (i === index ? "" : id)));
    setJustPickedSlot(null);
  };

  const handleClearActiveSlot = () => {
    if (activeSlot === null) return;
    clearSlotAt(activeSlot);
    setActiveSlot(null);
  };

  const activeSlotTeamId = activeSlot !== null ? teamSlots[activeSlot] : "";
  const showSearch = savedTeams.length > 5;

  const panelClass = cn(
    "tournament-team-picker-panel",
    embedded && "tournament-team-picker-panel--embedded",
    shakeSlots && "tournament-team-picker-panel--attention"
  );

  return (
    <div id={id} className={panelClass}>
      <div className="tournament-team-picker-header">
        <div>
          <CricketEyebrow className="mb-1">Select teams</CricketEyebrow>
          <p className="text-[oklch(0.65_0.03_255)] text-sm leading-relaxed">
            Tap a slot to pick a squad. We&apos;ll open the next empty slot
            automatically after each pick.
          </p>
        </div>

        {savedTeams.length >= teamCount && teamCount > 0 && (
          <div
            className="tournament-team-picker-progress"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="tournament-team-picker-progress__labels">
              <span
                className={cn(
                  "tournament-team-picker-progress__count",
                  allSelected && "tournament-team-picker-progress__count--done"
                )}
              >
                {allSelected ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    All teams selected
                  </>
                ) : (
                  <>
                    <span className="tabular-nums">
                      {selectedCount} / {teamCount}
                    </span>{" "}
                    teams
                  </>
                )}
              </span>
              {!allSelected && nextEmptySlot !== null && (
                <button
                  type="button"
                  className="tournament-team-picker-progress__next"
                  onClick={() => openSlot(nextEmptySlot)}
                >
                  Fill slot {nextEmptySlot + 1}
                </button>
              )}
            </div>
            <div
              className={cn(
                "tournament-team-picker-progress__track",
                allSelected && "tournament-team-picker-progress__track--done"
              )}
              role="progressbar"
              aria-valuenow={selectedCount}
              aria-valuemin={0}
              aria-valuemax={teamCount}
              aria-label={`${selectedCount} of ${teamCount} teams selected`}
            >
              <div
                className="tournament-team-picker-progress__fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {savedTeams.length === 0 ? (
        <div className="tournament-team-picker-empty">
          <Users className="h-10 w-10 text-[oklch(0.4_0.05_255)] mx-auto" />
          <p className="text-[oklch(0.65_0.03_255)] text-sm">
            No teams yet. Create teams first, then assign them here.
          </p>
          <Link
            href={routes.createTeam}
            className="tournament-team-picker-cta"
          >
            Create a team
          </Link>
        </div>
      ) : savedTeams.length < teamCount ? (
        <div className="tournament-team-picker-empty tournament-team-picker-empty--warn">
          <p className="text-[oklch(0.72_0.1_75)] text-sm">
            You need at least {teamCount} saved team{teamCount === 1 ? "" : "s"}.
            You have {savedTeams.length}.
          </p>
          <Link
            href={routes.createTeam}
            className="tournament-team-picker-cta"
          >
            Add another team
          </Link>
        </div>
      ) : (
        <div
          className={cn(
            "tournament-team-slots",
            shakeSlots && "tournament-team-slots--shake"
          )}
        >
          {teamSlots.map((teamId, index) => {
            const team = teamId ? teamsById.get(teamId) : undefined;
            const isNextEmpty = !team && nextEmptySlot === index;
            const isJustPicked = justPickedSlot === index;

            return (
              <button
                key={index}
                type="button"
                className={cn(
                  "tournament-team-slot",
                  team && "tournament-team-slot--filled",
                  isNextEmpty && "tournament-team-slot--next",
                  isJustPicked && "tournament-team-slot--picked",
                  shakeSlots && !team && "tournament-team-slot--nudge"
                )}
                onClick={() => openSlot(index)}
                aria-label={
                  team
                    ? `Change ${team.name} for team slot ${index + 1}`
                    : `Select team for slot ${index + 1}`
                }
              >
                <span className="tournament-team-slot__badge" aria-hidden>
                  {index + 1}
                </span>

                {team ? (
                  <>
                    <div className="tournament-team-slot__visual">
                      <CricketProfileHero
                        imageUrl={team.logoUrl}
                        alt=""
                        variant="team"
                        placeholder={
                          <Users className="h-10 w-10 text-[oklch(0.45_0.1_265)]" />
                        }
                      />
                      <span className="tournament-team-slot__overlay">
                        <Pencil className="h-4 w-4" aria-hidden />
                        Change
                      </span>
                    </div>
                    <span className="tournament-team-slot__label">{team.name}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="tournament-team-slot__clear"
                      aria-label={`Remove ${team.name} from slot ${index + 1}`}
                      onClick={(e) => clearSlotAt(index, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          clearSlotAt(index);
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="tournament-team-slot__placeholder-icon">
                      <Plus className="h-8 w-8" strokeWidth={1.5} />
                    </span>
                    <span className="tournament-team-slot__hint">Tap to add</span>
                    <span className="tournament-team-slot__label">
                      Team {index + 1}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSlot(null);
            setSearchQuery("");
            if (autoOpenTimer.current) {
              clearTimeout(autoOpenTimer.current);
              autoOpenTimer.current = null;
            }
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="tournament-team-picker-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-xl lg:max-w-3xl max-h-[min(90vh,720px)] flex flex-col gap-0 p-0 overflow-hidden"
        >
          <div className="p-6 pb-4 border-b border-[oklch(0.28_0.04_255)]">
            <DialogHeader className="text-left gap-2">
              <DialogTitle className="cricket-display text-lg text-[var(--cricket-cream)]">
                {activeSlot !== null ? (
                  <>
                    Slot {activeSlot + 1}
                    <span className="text-[oklch(0.55_0.03_255)] font-normal text-base">
                      {" "}
                      · pick a squad
                    </span>
                  </>
                ) : (
                  "Select team"
                )}
              </DialogTitle>
              <DialogDescription className="text-[oklch(0.6_0.03_255)]">
                {availableInDialogCount === 0
                  ? "Every team is already assigned. Clear another slot or add more teams."
                  : `${availableInDialogCount} squad${availableInDialogCount === 1 ? "" : "s"} available for this slot.`}
              </DialogDescription>
            </DialogHeader>

            {showSearch && (
              <label className="tournament-team-picker-search mt-4">
                <Search className="h-4 w-4 shrink-0" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams…"
                  className="tournament-team-picker-search__input"
                  autoFocus
                />
              </label>
            )}

            {activeSlotTeamId && (
              <button
                type="button"
                onClick={handleClearActiveSlot}
                className="mt-3 text-sm text-[oklch(0.65_0.1_75)] hover:text-[var(--cricket-cream)] underline-offset-2 hover:underline w-fit"
              >
                Clear this slot
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
            {filteredTeams.length === 0 ? (
              <p className="text-center text-sm text-[oklch(0.55_0.03_255)] py-8">
                No teams match &ldquo;{searchQuery.trim()}&rdquo;
              </p>
            ) : (
              <div className="tournament-team-choices">
                {filteredTeams.map((team) => {
                  const taken =
                    activeSlot !== null && isTeamTaken(team.id, activeSlot);
                  const takenSlot =
                    activeSlot !== null
                      ? getTeamSlotLabel(team.id, activeSlot)
                      : null;
                  const isCurrent = team.id === activeSlotTeamId;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      disabled={taken}
                      onClick={() => handlePickTeam(team.id)}
                      className={cn(
                        "tournament-team-choice-card",
                        isCurrent && "tournament-team-choice-card--current",
                        taken && "tournament-team-choice-card--disabled"
                      )}
                      aria-label={
                        taken
                          ? `${team.name} already in slot ${takenSlot}`
                          : `Select ${team.name}`
                      }
                    >
                      {isCurrent && (
                        <span
                          className="tournament-team-choice-card__check"
                          aria-hidden
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {taken && takenSlot !== null && (
                        <span className="tournament-team-choice-card__taken">
                          <Lock className="h-3 w-3" aria-hidden />
                          Slot {takenSlot}
                        </span>
                      )}
                      <div className="tournament-team-choice-card__visual">
                        <CricketProfileHero
                          imageUrl={team.logoUrl}
                          alt=""
                          variant="team"
                          placeholder={
                            <Users className="h-10 w-10 text-[oklch(0.45_0.1_265)]" />
                          }
                        />
                      </div>
                      <span className="tournament-team-choice-card__name">
                        {team.name}
                      </span>
                      <span className="tournament-team-choice-card__meta">
                        {team.players.length === 0
                          ? "No players"
                          : `${team.players.length} player${team.players.length === 1 ? "" : "s"}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-[oklch(0.28_0.04_255)] sm:justify-between">
            <p className="text-xs text-[oklch(0.5_0.03_255)] text-left">
              Tap a card to assign · Esc to close
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
