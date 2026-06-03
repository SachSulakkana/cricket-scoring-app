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
        onClick={() => !isDisabled && setSelectedBowler(player.id)}
        disabled={isDisabled}
        className={`p-4 rounded-lg border-2 transition-all ${
          isDisabled
            ? "bg-slate-700 border-slate-600 text-slate-500 opacity-50 cursor-not-allowed"
            : isSelected
            ? "bg-slate-600 border-slate-500 text-white font-bold"
            : "bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-600"
        }`}
      >
        <div className="font-semibold">{player.name}</div>
        {isSelected && <div className="text-xs mt-1">SELECTED</div>}
        {isDisabled && <div className="text-xs mt-1">Last Over</div>}
      </button>
    );
  };

  const isSubmitEnabled = selectedBowler !== null;

  return (
    <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
      <CardHeader>
        <CardTitle className="text-white">
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

        {/* Player Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          Confirm Bowler
        </Button>
      </CardContent>
    </Card>
  );
}
