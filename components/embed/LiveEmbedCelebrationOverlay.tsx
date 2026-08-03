"use client";

import { useMemo } from "react";
import LiveScoreBoundaryCelebration from "@/components/LiveScoreBoundaryCelebration";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { useLiveScoreEventHighlight } from "@/hooks/use-live-score-event-highlight";
import { usePreloadLiveScoreCelebrations } from "@/hooks/use-preload-live-score-celebrations";
import { deriveLiveScoreView } from "@/lib/live-score-view";

/**
 * Full-frame OBS source: only the 4 / 6 / wicket GIFs (transparent otherwise).
 * Use 1920×1080 over the stream; keep the thin score bar as a separate source.
 */
export default function LiveEmbedCelebrationOverlay() {
  usePreloadLiveScoreCelebrations();
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

  return (
    <div className="live-embed-celebration-root" aria-busy={loading}>
      <LiveScoreBoundaryCelebration
        event={eventHighlight.event}
        phase={eventHighlight.phase}
        playKey={eventHighlight.playKey}
      />
    </div>
  );
}
