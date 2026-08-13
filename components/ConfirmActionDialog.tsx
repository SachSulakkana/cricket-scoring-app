"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CricketLoader from "@/components/CricketLoader";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "default" | "destructive";
}

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "default",
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="border-[oklch(0.32_0.04_255)] bg-[oklch(0.14_0.025_255)] text-[var(--cricket-cream)]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[oklch(0.65_0.03_255)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {loading ? (
          <CricketLoader size="sm" label="Saving match result…" />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="border-[oklch(0.35_0.04_255)]"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            variant={variant}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? "Please wait…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
