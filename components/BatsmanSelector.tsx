"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/cricket-types";

interface BatsmanSelectorProps {
  players: Player[];
  onSubmit: (strikerId: string, nonStrikerId: string) => void;
}

export default function BatsmanSelector({
  players,
  onSubmit,
}: BatsmanSelectorProps) {
  const [striker, setStriker] = useState<string | null>(null);
  const [nonStriker, setNonStriker] = useState<string | null>(null);

  const togglePlayerSelection = (playerId: string) => {
    if (striker === playerId) {
      setStriker(null);
    } else if (nonStriker === playerId) {
      setNonStriker(null);
    } else if (!striker) {
      setStriker(playerId);
    } else if (!nonStriker) {
      setNonStriker(playerId);
    }
  };

  const isSubmitEnabled = striker && nonStriker && striker !== nonStriker;

  const getPlayerCard = (player: Player) => {
    const isStriker = striker === player.id;
    const isNonStriker = nonStriker === player.id;
    const isSelected = isStriker || isNonStriker;

    return (
      <button
        key={player.id}
        type="button"
        onClick={() => togglePlayerSelection(player.id)}
        className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between gap-3 text-left ${
          isSelected
            ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
            : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
        }`}
      >
        <div className="font-semibold">{player.name}</div>
        {isStriker && (
          <span className="text-xs font-bold tracking-wide text-[oklch(0.75_0.12_300)] shrink-0">
            STRIKER
          </span>
        )}
        {isNonStriker && (
          <span className="text-xs font-bold tracking-wide text-[oklch(0.75_0.12_300)] shrink-0">
            NON-STRIKER
          </span>
        )}
      </button>
    );
  };

  return (
    <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="cricket-display text-[var(--cricket-cream)]">
          Select opening batsmen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm">
          Click first player as <span className="font-bold text-slate-100">STRIKER</span>, then second player as{" "}
          <span className="font-bold text-slate-100">NON-STRIKER</span>. Click again to deselect.
        </p>

        {/* Selection Summary */}
        {(striker || nonStriker) && (
          <div className="bg-slate-900 p-3 rounded-lg space-y-2">
            {striker && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-600 px-2 py-1 rounded text-white">
                  STRIKER
                </span>
                <span className="text-white font-semibold">
                  {players.find((p) => p.id === striker)?.name}
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-600 px-2 py-1 rounded text-white">
                  NON-STRIKER
                </span>
                <span className="text-white font-semibold">
                  {players.find((p) => p.id === nonStriker)?.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Player list — one per row */}
        <div className="flex flex-col gap-3">
          {players.map((player) => getPlayerCard(player))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => onSubmit(striker!, nonStriker!)}
          disabled={!isSubmitEnabled}
          className={`w-full py-6 text-lg font-bold ${
            isSubmitEnabled
              ? "cricket-btn-play cricket-btn-play--quick"
              : "bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)] cursor-not-allowed"
          }`}
        >
          Confirm Opening Batsmen
        </Button>
      </CardContent>
    </Card>
  );
}
