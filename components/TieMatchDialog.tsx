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

interface TieMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  superOverContext?: boolean;
  onContinueAsDraw: () => void;
  onStartSuperOver: () => void;
}

export default function TieMatchDialog({
  open,
  onOpenChange,
  superOverContext = false,
  onContinueAsDraw,
  onStartSuperOver,
}: TieMatchDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)] text-[var(--cricket-cream)]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {superOverContext ? "Super over tied" : "Match tied"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[oklch(0.65_0.03_255)]">
            {superOverContext
              ? "Scores are level after the super over. Continue as a draw or play another super over."
              : "Both teams finished on the same score. Continue as a draw or play a super over to decide a winner."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <button
            type="button"
            onClick={onStartSuperOver}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[oklch(0.42_0.1_295)] px-4 text-sm font-semibold text-[var(--cricket-cream)] hover:bg-[oklch(0.48_0.12_295)]"
          >
            Start super over
          </button>
          <AlertDialogCancel
            onClick={onContinueAsDraw}
            className="mt-0 w-full border-[oklch(0.35_0.04_255)]"
          >
            Continue as draw
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
