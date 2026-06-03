"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/cricket-types";

interface ReplacementBatsmanModalProps {
  availableBatsmen: Player[];
  dismissedPlayerName: string;
  isStriker: boolean;
  onSubmit: (playerId: string) => void;
}

export default function ReplacementBatsmanModal({
  availableBatsmen,
  dismissedPlayerName,
  isStriker,
  onSubmit,
}: ReplacementBatsmanModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const isSubmitEnabled = selectedPlayer !== null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white">Select Replacement Batsman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm">
            <span className="font-semibold text-slate-100">{dismissedPlayerName}</span> has been dismissed.
            <br />
            Select the next{" "}
            <span className="font-semibold">
              {isStriker ? "striker" : "non-striker"}
            </span>
            .
          </p>

          {/* Player Selection Grid */}
          <div className="grid grid-cols-2 gap-2">
            {availableBatsmen.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlayer === player.id
                    ? "bg-slate-600 border-slate-500 text-white font-semibold"
                    : "bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-600"
                }`}
              >
                <div className="text-sm font-semibold">{player.name}</div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => {
              if (isSubmitEnabled) {
                onSubmit(selectedPlayer!);
              }
            }}
            disabled={!isSubmitEnabled}
            className={`w-full py-6 text-lg font-bold ${
              isSubmitEnabled
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-600 text-slate-400 cursor-not-allowed"
            }`}
          >
            Confirm Replacement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
