"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CricketFormLabel } from "@/components/cricket-shell";
import { SUPER_OVER_BALLS, SUPER_OVER_MAX_BALLS } from "@/lib/super-over";

export interface SuperOverSetupResult {
  firstBattingTeamId: string;
  ballsPerOver: number;
}

interface SuperOverSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  onConfirm: (result: SuperOverSetupResult) => void;
}

export default function SuperOverSetupDialog({
  open,
  onOpenChange,
  team1,
  team2,
  onConfirm,
}: SuperOverSetupDialogProps) {
  const [firstBattingTeamId, setFirstBattingTeamId] = useState<string | null>(
    null
  );
  const [ballCount, setBallCount] = useState(SUPER_OVER_BALLS);

  useEffect(() => {
    if (open) {
      setFirstBattingTeamId(null);
      setBallCount(SUPER_OVER_BALLS);
    }
  }, [open]);

  const teamButtonClass = (selected: boolean) =>
    `rounded-md border p-3 min-h-11 text-left text-sm font-semibold transition touch-manipulation ${
      selected
        ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
        : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_295/0.5)]"
    }`;

  const ballButtonClass = (selected: boolean) =>
    `rounded-md border py-3 min-h-11 text-center text-sm font-bold transition touch-manipulation ${
      selected
        ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
        : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_295/0.5)]"
    }`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)] text-[var(--cricket-cream)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Super over setup</AlertDialogTitle>
          <AlertDialogDescription className="text-[oklch(0.65_0.03_255)]">
            Choose how many legal balls each team faces (max {SUPER_OVER_MAX_BALLS}
            ). One bowler bowls the entire super over for each team.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <CricketFormLabel>Balls per team</CricketFormLabel>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {Array.from({ length: SUPER_OVER_MAX_BALLS }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBallCount(n)}
                  className={ballButtonClass(ballCount === n)}
                >
                  {n}
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <CricketFormLabel>Batting first in super over</CricketFormLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[team1, team2].map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setFirstBattingTeamId(team.id)}
                className={teamButtonClass(firstBattingTeamId === team.id)}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-[oklch(0.35_0.04_255)]">
            Cancel
          </AlertDialogCancel>
          <button
            type="button"
            disabled={!firstBattingTeamId}
            onClick={() => {
              if (firstBattingTeamId) {
                onConfirm({
                  firstBattingTeamId,
                  ballsPerOver: ballCount,
                });
              }
            }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[oklch(0.42_0.1_295)] px-4 text-sm font-semibold text-[var(--cricket-cream)] hover:bg-[oklch(0.48_0.12_295)] disabled:opacity-50"
          >
            Continue
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
