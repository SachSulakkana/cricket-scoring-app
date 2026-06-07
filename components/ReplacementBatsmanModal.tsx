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
  const roleLabel = isStriker ? "STRIKER" : "NON-STRIKER";

  return (
    <div className="cricket-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
      <Card className="cricket-modal border-0 shadow-none w-full max-w-md gap-0 py-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="cricket-display text-[var(--cricket-cream)]">
            Select replacement batsman
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[oklch(0.65_0.03_255)] text-sm">
            <span className="font-semibold text-[var(--cricket-cream)]">
              {dismissedPlayerName}
            </span>{" "}
            has been dismissed. Select the next{" "}
            <span className="font-semibold text-[var(--cricket-cream)]">
              {isStriker ? "striker" : "non-striker"}
            </span>
            .
          </p>

          <div className="flex flex-col gap-3">
            {availableBatsmen.map((player) => {
              const isSelected = selectedPlayer === player.id;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
                      : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
                  }`}
                >
                  <div className="font-semibold">{player.name}</div>
                  {isSelected && (
                    <span className="text-xs font-bold tracking-wide text-[oklch(0.75_0.12_300)] shrink-0">
                      {roleLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={() => {
              if (isSubmitEnabled) {
                onSubmit(selectedPlayer!);
              }
            }}
            disabled={!isSubmitEnabled}
            className={`w-full py-6 text-lg font-bold ${
              isSubmitEnabled
                ? "cricket-btn-play cricket-btn-play--quick"
                : "bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)] cursor-not-allowed"
            }`}
          >
            Confirm replacement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
