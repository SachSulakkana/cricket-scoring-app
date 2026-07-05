"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OngoingQuickMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1Name: string;
  team2Name: string;
  ballCount: number;
  onContinue: () => void;
  onStartNew: () => void;
}

export default function OngoingQuickMatchDialog({
  open,
  onOpenChange,
  team1Name,
  team2Name,
  ballCount,
  onContinue,
}: OngoingQuickMatchDialogProps) {
  const label =
    team1Name && team2Name ? `${team1Name} vs ${team2Name}` : "your quick match";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)] text-[var(--cricket-cream)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Ongoing match</AlertDialogTitle>
          <AlertDialogDescription className="text-[oklch(0.65_0.03_255)]">
            You have an in-progress quick match ({label}) with {ballCount} ball
            {ballCount === 1 ? "" : "s"} recorded. Continue where you left off or
            start a new match?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[oklch(0.42_0.1_295)] px-4 text-sm font-semibold text-[var(--cricket-cream)] hover:bg-[oklch(0.48_0.12_295)]"
          >
            Continue match
          </button>
          <AlertDialogCancel className="mt-0 w-full border-[oklch(0.35_0.04_255)]">
            Start new match
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
