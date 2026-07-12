"use client";

import type { ReactNode } from "react";
import CricketLoader from "@/components/CricketLoader";
import { cn } from "@/lib/utils";

interface LiveEmbedPanelShellProps {
  children?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  /** Fill the viewport and center content (for full-screen OBS overlays). */
  centered?: boolean;
}

export default function LiveEmbedPanelShell({
  children,
  loading = false,
  emptyMessage,
  centered = false,
}: LiveEmbedPanelShellProps) {
  const rootClassName = cn(
    "live-embed-panel-root",
    centered && "live-embed-panel-root--centered",
    loading && "live-embed-panel-root--loading"
  );

  if (loading) {
    return (
      <div className={rootClassName}>
        <CricketLoader size="sm" label="Loading…" />
      </div>
    );
  }

  if (emptyMessage) {
    return (
      <div className={rootClassName}>
        <p className="live-embed-panel-root__empty">{emptyMessage}</p>
      </div>
    );
  }

  return <div className={rootClassName}>{children}</div>;
}
