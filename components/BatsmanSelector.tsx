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
    const isSelected = striker === player.id || nonStriker === player.id;
    const isStriker = striker === player.id;
    const isNonStriker = nonStriker === player.id;

    return (
      <button
        key={player.id}
        onClick={() => togglePlayerSelection(player.id)}
        className={`p-4 rounded-lg border-2 transition-all ${
          isStriker
            ? "bg-slate-600 border-slate-500 text-white font-bold"
            : isNonStriker
            ? "bg-slate-600 border-slate-500 text-white font-bold"
            : isSelected
            ? "bg-slate-600 border-slate-500 text-white"
            : "bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-600"
        }`}
      >
        <div className="font-semibold">{player.name}</div>
        {isStriker && <div className="text-xs mt-1">STRIKER</div>}
        {isNonStriker && <div className="text-xs mt-1">NON-STRIKER</div>}
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

        {/* Player Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
