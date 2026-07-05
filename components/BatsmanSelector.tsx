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
        title={`${player.name} · ${formatBattingStyle(player.battingStyle)}`}
        className={cn(
          "relative flex aspect-square w-full flex-col rounded-lg border-2 p-2.5 text-center transition-all sm:p-3",
          isSelected
            ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
            : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
        )}
      >
        {(isStriker || isNonStriker) && (
          <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.75_0.12_300)] sm:text-[0.65rem]">
            {isStriker ? "STRIKER" : "NON-STRIKER"}
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
  };

  return (
    <Card className="cricket-broadcast-card gap-0 border-0 py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="cricket-display text-[var(--cricket-cream)]">
          Select opening batsmen
        </CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-[min(72dvh,42rem)] flex-col gap-4 px-5 pb-5">
        <p className="text-sm text-slate-300">
          Click first player as <span className="font-bold text-slate-100">STRIKER</span>, then second player as{" "}
          <span className="font-bold text-slate-100">NON-STRIKER</span>. Click again to deselect.
        </p>

        {(striker || nonStriker) && (
          <div className="space-y-2 rounded-lg bg-slate-900 p-3">
            {striker && (
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-600 px-2 py-1 text-xs text-white">
                  STRIKER
                </span>
                <span className="font-semibold text-white">
                  {players.find((p) => p.id === striker)?.name}
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-600 px-2 py-1 text-xs text-white">
                  NON-STRIKER
                </span>
                <span className="font-semibold text-white">
                  {players.find((p) => p.id === nonStriker)?.name}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {players.map((player) => getPlayerCard(player))}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-[oklch(0.28_0.04_288/0.45)] bg-[var(--cricket-surface)] pt-4">
          <Button
            onClick={() => onSubmit(striker!, nonStriker!)}
            disabled={!isSubmitEnabled}
            className={cn(
              "w-full py-6 text-lg font-bold",
              isSubmitEnabled
                ? "btn-12 btn-12--lg btn-12--full"
                : "cursor-not-allowed bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)]"
            )}
          >
            Confirm Opening Batsmen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
