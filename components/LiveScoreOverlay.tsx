"use client";

import { useMemo } from "react";
import LiveScoreBar from "@/components/LiveScoreBar";
import LiveScoreBoundaryCelebration from "@/components/LiveScoreBoundaryCelebration";
import CricketLoader from "@/components/CricketLoader";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { useLiveScoreEventHighlight } from "@/hooks/use-live-score-event-highlight";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import { cn } from "@/lib/utils";

interface LiveScoreOverlayProps {
  preview?: boolean;
}

export default function LiveScoreOverlay({ preview = false }: LiveScoreOverlayProps) {
  const { draft, loading, error } = useLiveMatchSnapshot();

  const view = useMemo(() => {
    if (!draft?.matchState) {
      return {
        kind: "empty" as const,
        message: error ?? "No live match",
      };
    }
    const derived = deriveLiveScoreView(draft.matchState);
    if (derived.kind === "none") {
      return {
        kind: "empty" as const,
        message: error ?? "No live match",
      };
    }
    return derived;
  }, [draft, error]);

  const eventHighlight = useLiveScoreEventHighlight(view);

  const rootClassName = cn(
    "live-embed-root",
    preview && "live-embed-root--preview",
    loading && "live-embed-root--loading"
  );

  if (loading) {
    return (
      <div className={rootClassName}>
        <CricketLoader size="sm" label="Loading live score…" />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <LiveScoreBoundaryCelebration
        event={eventHighlight.event}
        phase={eventHighlight.phase}
        playKey={eventHighlight.playKey}
      />
      <LiveScoreBar view={view} eventHighlight={eventHighlight} />
    </div>
  );
}
