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
            Start Next Over
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
