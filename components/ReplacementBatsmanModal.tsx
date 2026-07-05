"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/cricket-types";
import { formatBattingStyle } from "@/lib/player-options";
import { cn } from "@/lib/utils";

function battingStyleShort(style: Player["battingStyle"]): string {
  return style === "left-hand" ? "LHB" : "RHB";
}

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
    <div className="cricket-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="cricket-modal w-full max-w-2xl gap-0 border-0 py-0 shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="cricket-display text-[var(--cricket-cream)]">
            Select replacement batsman
          </CardTitle>
        </CardHeader>
        <CardContent className="flex max-h-[min(80dvh,44rem)] flex-col gap-4 px-5 pb-5">
          <p className="text-sm text-[oklch(0.65_0.03_255)]">
            <span className="font-semibold text-[var(--cricket-cream)]">
              {dismissedPlayerName}
            </span>{" "}
            has been dismissed. Select the next{" "}
            <span className="font-semibold text-[var(--cricket-cream)]">
              {isStriker ? "striker" : "non-striker"}
            </span>
            .
          </p>

          {selectedPlayer && (
            <div className="rounded-lg border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.04_295)] p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[oklch(0.48_0.12_295)] px-2 py-1 text-xs font-bold text-[var(--cricket-cream)]">
                  {roleLabel}
                </span>
                <span className="font-semibold text-[var(--cricket-cream)]">
                  {availableBatsmen.find((p) => p.id === selectedPlayer)?.name}
                </span>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {availableBatsmen.map((player) => {
                const isSelected = selectedPlayer === player.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayer(player.id)}
                    title={`${player.name} · ${formatBattingStyle(player.battingStyle)}`}
                    className={cn(
                      "relative flex aspect-square w-full flex-col rounded-lg border-2 p-2.5 text-center transition-all sm:p-3",
                      isSelected
                        ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
                        : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
                    )}
                  >
                    {isSelected && (
                      <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.75_0.12_300)] sm:text-[0.65rem]">
                        {roleLabel}
                      </span>
                    )}

                    <div className="flex flex-1 items-center justify-center">
                      <p className="line-clamp-3 w-full text-xs font-semibold leading-tight sm:text-sm">
                        {player.name}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
                        isSelected
                          ? "text-[oklch(0.72_0.08_300)]"
                          : "text-[oklch(0.55_0.03_255)]"
                      )}
                    >
                      {battingStyleShort(player.battingStyle)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[oklch(0.28_0.04_288/0.45)] bg-[var(--cricket-surface)] pt-4">
            <Button
              type="button"
              onClick={() => {
                if (isSubmitEnabled) {
                  onSubmit(selectedPlayer!);
                }
              }}
              disabled={!isSubmitEnabled}
              className={cn(
                "w-full py-6 text-lg font-bold",
                isSubmitEnabled
                  ? "btn-12 btn-12--lg btn-12--full"
                  : "cursor-not-allowed bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)]"
              )}
            >
              Confirm replacement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
