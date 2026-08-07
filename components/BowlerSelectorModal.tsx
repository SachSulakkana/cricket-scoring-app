"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player, type BowlingStyle } from "@/lib/cricket-types";
import { formatBowlingStyle } from "@/lib/player-options";
import { cn } from "@/lib/utils";

const BOWLING_STYLE_SHORT: Record<BowlingStyle, string> = {
  none: "—",
  "right-arm-fast": "RAF",
  "right-arm-medium": "RAM",
  "right-arm-off-spin": "RAOS",
  "right-arm-leg-spin": "RALeg",
  "left-arm-fast": "LAF",
  "left-arm-medium": "LAM",
  "left-arm-orthodox": "LAO",
  "left-arm-chinaman": "LAC",
};

function bowlingStyleShort(style: Player["bowlingStyle"]): string {
  return BOWLING_STYLE_SHORT[style] ?? style;
}

export type BowlerSelectorMode =
  | "end-of-over"
  | "change-pre-over"
  | "change-mid-over";

interface BowlerSelectorModalProps {
  players: Player[];
  /** @deprecated Prefer disabledPlayerIds */
  disabledPlayerId?: string;
  disabledPlayerIds?: string[];
  mode?: BowlerSelectorMode;
  onSubmit: (bowlerId: string) => void;
  onCancel?: () => void;
}

export default function BowlerSelectorModal({
  players,
  disabledPlayerId,
  disabledPlayerIds,
  mode = "end-of-over",
  onSubmit,
  onCancel,
}: BowlerSelectorModalProps) {
  const [selectedBowler, setSelectedBowler] = useState<string | null>(null);

  const blockedIds = new Set([
    ...(disabledPlayerIds ?? []),
    ...(disabledPlayerId ? [disabledPlayerId] : []),
  ]);

  const title =
    mode === "change-mid-over"
      ? "Replace bowler"
      : mode === "change-pre-over"
        ? "Change bowler"
        : "End of over — select next bowler";

  const description =
    mode === "change-mid-over"
      ? "The current bowler cannot continue. Select a replacement to finish this over. Bowlers who already bowled this over or the previous over cannot be selected."
      : mode === "change-pre-over"
        ? "Select who will bowl this over. The previous over’s bowler cannot bowl consecutive overs."
        : "The previous bowler cannot bowl consecutive overs. Select a new bowler to continue.";

  const submitLabel =
    mode === "change-mid-over"
      ? "Confirm replacement"
      : mode === "change-pre-over"
        ? "Confirm bowler"
        : "Start next over";

  const disabledBadge =
    mode === "end-of-over" ? "LAST OVER" : "UNAVAILABLE";

  const getPlayerCard = (player: Player) => {
    const isDisabled = blockedIds.has(player.id);
    const isSelected = selectedBowler === player.id;

    return (
      <button
        key={player.id}
        type="button"
        onClick={() => !isDisabled && setSelectedBowler(player.id)}
        disabled={isDisabled}
        title={`${player.name} · ${formatBowlingStyle(player.bowlingStyle)}`}
        className={cn(
          "relative flex aspect-square w-full flex-col rounded-lg border-2 p-2.5 text-center transition-all sm:p-3",
          isDisabled
            ? "cursor-not-allowed border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.5_0.03_255)] opacity-50"
            : isSelected
              ? "border-[oklch(0.55_0.12_300)] bg-[oklch(0.2_0.06_300/0.35)] text-[var(--cricket-cream)]"
              : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.16_0.025_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_300/0.5)]"
        )}
      >
        {isSelected && (
          <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.75_0.12_300)] sm:text-[0.65rem]">
            BOWLER
          </span>
        )}
        {isDisabled && (
          <span className="mb-1 text-[0.6rem] font-bold leading-none tracking-wide text-[oklch(0.5_0.03_255)] sm:text-[0.65rem]">
            {disabledBadge}
          </span>
        )}

        <div className="flex flex-1 items-center justify-center">
          <p className="line-clamp-3 w-full text-xs font-semibold leading-tight sm:text-sm">
            {player.name}
          </p>
        </div>

        <span
          className={cn(
            "mt-1 line-clamp-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:text-[0.65rem]",
            isDisabled
              ? "text-[oklch(0.45_0.03_255)]"
              : isSelected
                ? "text-[oklch(0.72_0.08_300)]"
                : "text-[oklch(0.55_0.03_255)]"
          )}
        >
          {bowlingStyleShort(player.bowlingStyle)}
        </span>
      </button>
    );
  };

  const isSubmitEnabled = selectedBowler !== null;
  const canCancel = mode !== "end-of-over" && Boolean(onCancel);

  return (
    <div className="cricket-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="cricket-modal w-full max-w-2xl gap-0 border-0 py-0 shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="cricket-display text-[var(--cricket-cream)]">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex max-h-[min(80dvh,44rem)] flex-col gap-4 px-5 pb-5">
          <p className="text-sm text-[oklch(0.65_0.03_255)]">{description}</p>

          {selectedBowler && (
            <div className="rounded-lg border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.04_295)] p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[oklch(0.48_0.12_295)] px-2 py-1 text-xs font-bold text-[var(--cricket-cream)]">
                  {mode === "end-of-over" ? "NEXT BOWLER" : "BOWLER"}
                </span>
                <span className="font-semibold text-[var(--cricket-cream)]">
                  {players.find((p) => p.id === selectedBowler)?.name}
                </span>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {players.map((player) => getPlayerCard(player))}
            </div>
          </div>

          <div className="sticky bottom-0 space-y-2 border-t border-[oklch(0.28_0.04_288/0.45)] bg-[var(--cricket-surface)] pt-4">
            <Button
              onClick={() => onSubmit(selectedBowler!)}
              disabled={!isSubmitEnabled}
              className={cn(
                "w-full py-6 text-lg font-bold",
                isSubmitEnabled
                  ? "btn-12 btn-12--lg btn-12--full"
                  : "cursor-not-allowed bg-[oklch(0.2_0.03_255)] text-[oklch(0.5_0.03_255)]"
              )}
            >
              {submitLabel}
            </Button>
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="btn-12 btn-12--outline btn-12--md w-full"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
