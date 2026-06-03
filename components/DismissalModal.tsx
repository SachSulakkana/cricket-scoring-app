"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DismissalType, Player } from "@/lib/cricket-types";

interface DismissalModalProps {
  batsmen: Player[];
  fielders: Player[];
  onSubmit: (
    dismissalType: DismissalType,
    dismissedPlayer: string,
    fielderId?: string
  ) => void;
  onCancel: () => void;
}

const DISMISSAL_TYPES: DismissalType[] = [
  "bowled",
  "lbw",
  "caught",
  "stumped",
  "run-out",
];

export default function DismissalModal({
  batsmen,
  fielders,
  onSubmit,
  onCancel,
}: DismissalModalProps) {
  const [selectedType, setSelectedType] = useState<DismissalType | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedFielder, setSelectedFielder] = useState<string | null>(null);

  const needsFielderSelection =
    selectedType === "caught" || selectedType === "run-out" || selectedType === "stumped";

  const isSubmitEnabled =
    !!selectedType && !!selectedPlayer && (!needsFielderSelection || !!selectedFielder);

  return (
    <div className="cricket-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
      <Card className="cricket-modal border-0 shadow-none w-full max-w-md gap-0 py-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="cricket-display text-[var(--cricket-cream)]">
            Record dismissal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dismissal Type Selection */}
          <div>
            <label className="cricket-form-label">
              Dismissal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DISMISSAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    if (type !== "caught" && type !== "run-out" && type !== "stumped") {
                      setSelectedFielder(null);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all capitalize ${
                    selectedType === type
                      ? "bg-[oklch(0.4_0.14_25)] border-[oklch(0.55_0.2_25)] text-white font-semibold"
                      : "bg-[oklch(0.16_0.025_255)] border-[oklch(0.32_0.04_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.2_25)]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {needsFielderSelection && (
            <div>
              <label className="cricket-form-label">
                {selectedType === "stumped" ? "Wicket Keeper" : "Fielder"}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {fielders.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedFielder(player.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedFielder === player.id
                        ? "bg-[oklch(0.5_0.12_75)] border-[oklch(0.6_0.14_75)] text-white font-semibold"
                        : "bg-[oklch(0.16_0.025_255)] border-[oklch(0.32_0.04_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.12_75)]"
                    }`}
                  >
                    <div className="text-sm font-semibold">{player.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dismissed Player Selection */}
          <div>
            <label className="cricket-form-label">
              Dismissed Batsman
            </label>
            <div className="grid grid-cols-2 gap-2">
              {batsmen.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPlayer === player.id
                      ? "bg-[oklch(0.4_0.14_25)] border-[oklch(0.55_0.2_25)] text-white font-semibold"
                      : "bg-[oklch(0.16_0.025_255)] border-[oklch(0.32_0.04_255)] text-[oklch(0.85_0.02_95)] hover:border-[oklch(0.55_0.2_25)]"
                  }`}
                >
                  <div className="text-sm font-semibold">{player.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 cricket-btn-setup !min-h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isSubmitEnabled) {
                  onSubmit(selectedType!, selectedPlayer!, selectedFielder || undefined);
                }
              }}
              disabled={!isSubmitEnabled}
              className={`flex-1 ${
                isSubmitEnabled
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-slate-600 text-slate-400 cursor-not-allowed"
              }`}
            >
              Confirm Dismissal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
