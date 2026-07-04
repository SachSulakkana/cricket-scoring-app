"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player, type BowlingStyle } from "@/lib/cricket-types";
import { formatBowlingStyle } from "@/lib/player-options";
import { cn } from "@/lib/utils";

const BOWLING_STYLE_SHORT: Record<BowlingStyle, string> = {
  none: "—",
  "right-arm-fast": "RAF",
  "right-arm-medium": "RAM",
  "right-arm-off-spin": "RAOS",
  "right-arm-leg-spin": "RALeg",
  "left-arm-fast": "LAF",
  "left-arm-medium": "LAM",
  "left-arm-orthodox": "LAO",
  "left-arm-chinaman": "LAC",
};

function bowlingStyleShort(style: Player["bowlingStyle"]): string {
  return BOWLING_STYLE_SHORT[style] ?? style;
}

interface BowlerSelectorProps {
  players: Player[];
  disabledPlayerId?: string;
  onSubmit: (bowlerId: string) => void;
  isOpening?: boolean;
}

export default function BowlerSelector({
  players,
  disabledPlayerId,
  onSubmit,
  isOpening = false,
}: BowlerSelectorProps) {
  const [selectedBowler, setSelectedBowler] = useState<string | null>(null);

  const getPlayerCard = (player: Player) => {
    const isDisabled = disabledPlayerId === player.id;
    const isSelected = selectedBowler === player.id;

    return (
      <button
        key={player.id}
        type="button"
        onClick={() => !isDisabled && setSelectedBowler(player.id)}
        disabled={isDisabled}
        title={`${player.name} · ${formatBowlingStyle(player.bowlingStyle)}`}
        className={cn(
          "relative flex aspect-square w-full flex-col rounded-lg border-2 p-2.5 text-center transition-all sm:p-3",
          isDisabled
            ? "cursor-not-allowed border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.5_0.03_255)] opacity-50"
            : isSelected
              ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
              : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
        )}
      >
        {isSelected && (
          <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.75_0.12_300)] sm:text-[0.65rem]">
            BOWLER
          </span>
        )}
        {isDisabled && (
          <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.5_0.03_255)] sm:text-[0.65rem]">
            LAST OVER
          </span>
        )}

        <div className="flex flex-1 items-center justify-center">
          <p className="line-clamp-3 w-full text-xs font-semibold leading-tight sm:text-sm">
            {player.name}
          </p>
        </div>

        <span
          className={cn(
            "mt-1 line-clamp-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:text-[0.65rem]",
            isDisabled
              ? "text-[oklch(0.45_0.03_255)]"
              : isSelected
                ? "text-[oklch(0.72_0.08_300)]"
                : "text-[oklch(0.55_0.03_255)]"
          )}
        >
          {bowlingStyleShort(player.bowlingStyle)}
        </span>
      </button>
    );
  };

  const isSubmitEnabled = selectedBowler !== null;

  return (
    <Card className="cricket-broadcast-card gap-0 border-0 py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="cricket-display text-[var(--cricket-cream)]">
          {isOpening ? "Select Opening Bowler" : "Select Next Bowler"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-[min(72dvh,42rem)] flex-col gap-4 px-5 pb-5">
        <p className="text-sm text-slate-300">
          {disabledPlayerId
            ? "Click a player to select the next bowler. The previous bowler is disabled."
            : "Click a player to select the opening bowler."}
        </p>

        {selectedBowler && (
          <div className="rounded-lg bg-slate-900 p-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-600 px-2 py-1 text-xs text-white">
                BOWLER
              </span>
              <span className="font-semibold text-white">
                {players.find((p) => p.id === selectedBowler)?.name}
              </span>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {players.map((player) => getPlayerCard(player))}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-[oklch(0.28_0.04_288/0.45)] bg-[var(--cricket-surface)] pt-4">
          <Button
            onClick={() => onSubmit(selectedBowler!)}
            disabled={!isSubmitEnabled}
            className={cn(
              "w-full py-6 text-lg font-bold",
              isSubmitEnabled
                ? "cricket-btn-play cricket-btn-play--quick"
                : "cursor-not-allowed bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)]"
            )}
          >
            Confirm Bowler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
