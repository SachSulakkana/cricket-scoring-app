"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CricketEyebrow } from "@/components/cricket-shell";
import { TournamentMatchFaceoff } from "@/components/TournamentMatchFaceoff";
import { TournamentFixtureResult } from "@/components/TournamentFixtureResult";
import { TournamentNextMatchHero } from "@/components/TournamentNextMatchHero";
import type { Team } from "@/lib/cricket-types";
import type { TournamentFixture } from "@/lib/roster-storage";
import { reorderTournamentFixtures } from "@/lib/tournament-fixtures";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export interface ScheduleFixtureRow {
  id: string;
  teamA: Team;
  teamB: Team;
  played: boolean;
  fixture: TournamentFixture;
  runsA?: number;
  wicketsA?: number;
  runsB?: number;
  wicketsB?: number;
  winnerId?: string;
}

interface TournamentScheduleListProps {
  rows: ScheduleFixtureRow[];
  fixtures: TournamentFixture[];
  nextFixtureId?: string;
  /** When false, drag-to-reorder is disabled (e.g. viewing a past/upcoming stage). */
  canReorder?: boolean;
  onPlayNow: (fixtureId: string) => void;
  onSummary: (fixtureId: string) => void;
  onReplay: (fixtureId: string, teamA: string, teamB: string) => void;
  onReorderFixtures: (fixtures: TournamentFixture[]) => void | Promise<void>;
}

function MatchCardHeader({
  matchNumber,
  dragHandle,
}: {
  matchNumber: number;
  dragHandle: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      {dragHandle}
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[oklch(0.55_0.03_255)]">
        Match {matchNumber}
      </p>
    </div>
  );
}

export default function TournamentScheduleList({
  rows,
  fixtures,
  nextFixtureId,
  canReorder = true,
  onPlayNow,
  onSummary,
  onReplay,
  onReorderFixtures,
}: TournamentScheduleListProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [orderedRows, setOrderedRows] = useState(rows);

  useEffect(() => {
    setOrderedRows(rows);
  }, [rows]);

  const finishReorder = (activeId: string, targetId: string) => {
    if (!canReorder || activeId === targetId) return;
    const nextFixtures = reorderTournamentFixtures(fixtures, activeId, targetId);
    const map = new Map(orderedRows.map((row) => [row.id, row]));
    const nextRows = nextFixtures
      .map((fx) => map.get(fx.id))
      .filter((row): row is ScheduleFixtureRow => Boolean(row));
    setOrderedRows(nextRows);
    void Promise.resolve(onReorderFixtures(nextFixtures)).catch(() => {
      setOrderedRows(rows);
    });
  };

  const handleDragStart = (fixtureId: string) => {
    if (!canReorder) return;
    setDragId(fixtureId);
    setOverId(fixtureId);
  };

  const handleDragEnd = () => {
    if (dragId && overId && dragId !== overId) {
      finishReorder(dragId, overId);
    }
    setDragId(null);
    setOverId(null);
  };

  const dragHandle = canReorder ? (
    <span
      className="flex h-9 w-9 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded border border-[oklch(0.35_0.05_295/0.5)] bg-[oklch(0.16_0.03_295/0.4)] text-[oklch(0.55_0.04_288)] active:cursor-grabbing"
      aria-hidden
      title="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </span>
  ) : null;

  return (
    <div className="space-y-3">
      <div className="tournament-game-section-head">
        <CricketEyebrow className="mb-0">Schedule matches</CricketEyebrow>
        {canReorder ? (
          <span className="tournament-game-pill">Drag to reorder</span>
        ) : (
          <span className="tournament-game-pill">View only</span>
        )}
      </div>
      <p className="text-xs text-[oklch(0.55_0.03_255)]">
        {canReorder
          ? "Drag matches to set play order. The highlighted match in the list is up next."
          : "Browsing another stage. Switch back to the current stage to play or reorder matches."}
      </p>
      <div className="space-y-3">
        {orderedRows.map((fx, idx) => {
          const isDragging = dragId === fx.id;
          const isOver = overId === fx.id && dragId !== fx.id;
          const isNextMatch = !fx.played && fx.id === nextFixtureId;

          const rowProps = {
            draggable: canReorder,
            onDragStart: (e: React.DragEvent) => {
              if (!canReorder) return;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", fx.id);
              handleDragStart(fx.id);
            },
            onDragEnd: handleDragEnd,
            onDragOver: (e: React.DragEvent) => {
              if (!canReorder) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverId(fx.id);
            },
            onDragLeave: () => {
              if (overId === fx.id) setOverId(null);
            },
            onDrop: (e: React.DragEvent) => {
              if (!canReorder) return;
              e.preventDefault();
              if (dragId) finishReorder(dragId, fx.id);
              setDragId(null);
              setOverId(null);
            },
            className: cn(
              "tournament-match-card transition-[border-color,box-shadow,opacity,transform]",
              isDragging && "opacity-50 scale-[0.99]",
              isNextMatch
                ? cn(
                    "tournament-match-card--next",
                    isOver &&
                      "border-[oklch(0.55_0.12_295/0.85)] shadow-[0_0_0_2px_oklch(0.55_0.12_295/0.45)]"
                  )
                : cn(
                    "tournament-game-row",
                    isOver
                      ? "border-[oklch(0.55_0.12_295/0.75)] shadow-[0_0_0_1px_oklch(0.55_0.12_295/0.35)]"
                      : ""
                  )
            ),
          };

          if (isNextMatch) {
            return (
              <div key={fx.id} {...rowProps}>
                <TournamentNextMatchHero
                  embedded
                  teamA={fx.teamA}
                  teamB={fx.teamB}
                  matchNumber={idx + 1}
                  onPlayNow={() => onPlayNow(fx.id)}
                  headerPrefix={dragHandle}
                />
              </div>
            );
          }

          return (
            <div key={fx.id} {...rowProps} className={cn(rowProps.className, "flex flex-col")}>
              <MatchCardHeader matchNumber={idx + 1} dragHandle={dragHandle} />
              {fx.played ? (
                <TournamentFixtureResult
                  teamA={fx.teamA}
                  teamB={fx.teamB}
                  abandoned={fx.fixture.result?.abandoned}
                  winnerId={fx.winnerId}
                  runsA={fx.runsA}
                  wicketsA={fx.wicketsA}
                  runsB={fx.runsB}
                  wicketsB={fx.wicketsB}
                />
              ) : (
                <div className="tournament-match-card__faceoff">
                  <TournamentMatchFaceoff teamA={fx.teamA} teamB={fx.teamB} size="sm" />
                </div>
              )}
              <div className="tournament-match-card__footer space-y-2">
                {fx.played ? (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      draggable={false}
                      className="btn-12 btn-12--sm !w-auto px-3 text-xs"
                      onClick={() => onSummary(fx.id)}
                    >
                      Match summary
                    </button>
                    <button
                      type="button"
                      draggable={false}
                      className="btn-12 btn-12--outline btn-12--md !w-auto !min-h-[2.2rem] px-3 text-xs"
                      onClick={() => onReplay(fx.id, fx.teamA.name, fx.teamB.name)}
                    >
                      Replay match
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[oklch(0.55_0.03_255)]">Awaiting play</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
