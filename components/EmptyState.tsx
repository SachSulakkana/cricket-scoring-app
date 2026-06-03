"use client";

import type { ReactNode } from "react";
import { CricketBroadcastCard } from "@/components/cricket-shell";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <CricketBroadcastCard className="px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex justify-center text-[oklch(0.4_0.05_255)]">
        {icon}
      </div>
      <p className="text-[oklch(0.75_0.02_95)] font-medium">{title}</p>
      <p className="text-[oklch(0.55_0.03_255)] text-sm mt-1">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </CricketBroadcastCard>
  );
}
