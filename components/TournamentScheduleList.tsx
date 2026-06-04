"use client";

import { useEffect, useState } from "react";
import { CricketEyebrow } from "@/components/cricket-shell";
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
  onPlayNow: (fixtureId: string) => void;
  onSummary: (fixtureId: string) => void;
  onReplay: (fixtureId: string, teamA: string, teamB: string) => void;
  onReorderFixtures: (fixtures: TournamentFixture[]) => void | Promise<void>;
}

function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

export default function TournamentScheduleList({
  rows,
  fixtures,
  nextFixtureId,
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
    if (activeId === targetId) return;
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

  return (
    <div className="space-y-3">
      <div className="tournament-game-section-head">
        <CricketEyebrow className="mb-0">Schedule matches</CricketEyebrow>
        <span className="tournament-game-pill">Drag to reorder</span>
      </div>
      <p className="text-xs text-[oklch(0.55_0.03_255)]">
        Drag matches to set play order. The first unplayed match is up next.
      </p>
      <div className="space-y-2">
        {orderedRows.map((fx, idx) => {
          const isDragging = dragId === fx.id;
          const isOver = overId === fx.id && dragId !== fx.id;
          return (
            <div
              key={fx.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", fx.id);
                handleDragStart(fx.id);
              }}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverId(fx.id);
              }}
              onDragLeave={() => {
                if (overId === fx.id) setOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) finishReorder(dragId, fx.id);
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "tournament-game-row rounded-md border bg-[oklch(0.12_0.02_255/0.6)] p-3 transition-[border-color,box-shadow,opacity,transform]",
                isDragging && "opacity-50 scale-[0.99]",
                isOver
                  ? "border-[oklch(0.55_0.12_295/0.75)] shadow-[0_0_0_1px_oklch(0.55_0.12_295/0.35)]"
                  : "border-[oklch(0.32_0.04_255)]"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-11 w-11 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded border border-[oklch(0.35_0.05_295/0.5)] bg-[oklch(0.16_0.03_295/0.4)] text-[oklch(0.55_0.04_288)] active:cursor-grabbing"
                    aria-hidden
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <p className="text-xs text-[oklch(0.55_0.03_255)]">Match {idx + 1}</p>
                </div>
                {!fx.played && fx.id === nextFixtureId && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-[oklch(0.62_0.12_85/0.55)] bg-[oklch(0.34_0.09_85/0.35)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.82_0.12_85)]">
                    Next match
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--cricket-cream)]">
                    {fx.teamA.name}
                  </p>
                  {fx.played ? (
                    <p className="text-sm text-[oklch(0.65_0.03_255)]">
                      {formatScore(fx.runsA ?? 0, fx.wicketsA ?? 0)}
                    </p>
                  ) : (
                    <p className="text-sm text-[oklch(0.55_0.03_255)]">Not played</p>
                  )}
                </div>
                <p className="text-center text-xs text-[oklch(0.55_0.03_255)]">vs</p>
                <div className="min-w-0 sm:text-right">
                  <p className="truncate font-medium text-[var(--cricket-cream)]">
                    {fx.teamB.name}
                  </p>
                  {fx.played ? (
                    <p className="text-sm text-[oklch(0.65_0.03_255)]">
                      {formatScore(fx.runsB ?? 0, fx.wicketsB ?? 0)}
                    </p>
                  ) : (
                    <p className="text-sm text-[oklch(0.55_0.03_255)]">Not played</p>
                  )}
                </div>
              </div>
              {fx.played ? (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p className="text-xs text-[oklch(0.72_0.1_75)]">
                    {fx.winnerId
                      ? `${fx.winnerId === fx.teamA.id ? fx.teamA.name : fx.teamB.name} won`
                      : "Match tied"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      draggable={false}
                      className="cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament !w-auto px-3 text-xs"
                      onClick={() => onSummary(fx.id)}
                    >
                      Match summary
                    </button>
                    <button
                      type="button"
                      draggable={false}
                      className="cricket-btn-setup !w-auto !min-h-[2.2rem] px-3 text-xs"
                      onClick={() => onReplay(fx.id, fx.teamA.name, fx.teamB.name)}
                    >
                      Replay match
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-xs text-[oklch(0.55_0.03_255)]">Awaiting play</p>
                  <button
                    type="button"
                    draggable={false}
                    className="cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament w-full px-3 sm:!w-auto min-h-11"
                    onClick={() => onPlayNow(fx.id)}
                  >
                    Play now
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
