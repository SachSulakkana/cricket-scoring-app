"use client";

import { Spinner } from "@/components/ui/spinner";

interface CricketPageLoaderProps {
  label?: string;
}

export default function CricketPageLoader({
  label = "Loading…",
}: CricketPageLoaderProps) {
  return (
    <div
      className="cricket-page flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="h-8 w-8 text-[var(--cricket-gold)]" />
      <p className="text-sm text-[oklch(0.65_0.03_255)]">{label}</p>
    </div>
  );
}
