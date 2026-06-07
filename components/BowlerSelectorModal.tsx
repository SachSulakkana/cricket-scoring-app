"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/cricket-types";

interface BowlerSelectorModalProps {
  players: Player[];
  disabledPlayerId?: string;
  onSubmit: (bowlerId: string) => void;
}

export default function BowlerSelectorModal({
  players,
  disabledPlayerId,
  onSubmit,
}: BowlerSelectorModalProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            End of Over - Select Next Bowler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-300 text-base">
            The previous bowler cannot bowl consecutive overs. Select a new bowler to continue.
          </p>

          {/* Selection Summary */}
          {selectedBowler && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm bg-slate-600 px-3 py-1 rounded text-white font-bold">
                  NEXT BOWLER
                </span>
                <span className="text-white font-bold text-lg">
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
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-600 text-slate-400 cursor-not-allowed"
            }`}
          >
            Start Next Over
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
