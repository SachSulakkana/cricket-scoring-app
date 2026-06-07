"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/cricket-types";

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
        className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between gap-3 text-left ${
          isDisabled
            ? "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.5_0.03_255)] opacity-50 cursor-not-allowed"
            : isSelected
              ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
              : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
        }`}
      >
        <div className="font-semibold">{player.name}</div>
        {isSelected && (
          <span className="text-xs font-bold tracking-wide text-[oklch(0.75_0.12_300)] shrink-0">
            SELECTED
          </span>
        )}
        {isDisabled && (
          <span className="text-xs font-bold tracking-wide text-[oklch(0.5_0.03_255)] shrink-0">
            Last over
          </span>
        )}
      </button>
    );
  };

  const isSubmitEnabled = selectedBowler !== null;

  return (
    <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="cricket-display text-[var(--cricket-cream)]">
          {isOpening ? "Select Opening Bowler" : "Select Next Bowler"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm">
          {disabledPlayerId
            ? "Click a player to select the next bowler. The previous bowler is disabled."
            : "Click a player to select the opening bowler."}
        </p>

        {/* Selection Summary */}
        {selectedBowler && (
          <div className="bg-slate-900 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-600 px-2 py-1 rounded text-white">
                BOWLER
              </span>
              <span className="text-white font-semibold">
                {players.find((p) => p.id === selectedBowler)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Player list — one per row */}
        <div className="flex flex-col gap-3">
          {players.map((player) => getPlayerCard(player))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => onSubmit(selectedBowler!)}
          disabled={!isSubmitEnabled}
          className={`w-full py-6 text-lg font-bold ${
            isSubmitEnabled
              ? "cricket-btn-play cricket-btn-play--quick"
              : "bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)] cursor-not-allowed"
          }`}
        >
          Confirm Bowler
        </Button>
      </CardContent>
    </Card>
  );
}
