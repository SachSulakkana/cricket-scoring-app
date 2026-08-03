"use client";

import type { LiveScoreEventPhase } from "@/hooks/use-live-score-event-highlight";
import type { LiveScoreEvent } from "@/lib/live-score-event";
import {
  LIVE_SCORE_CELEBRATION_SRC,
  type LiveScoreCelebrationKind,
} from "@/lib/live-score-celebration";
import { cn } from "@/lib/utils";

interface LiveScoreBoundaryCelebrationProps {
  event: LiveScoreEvent | null;
  phase: LiveScoreEventPhase;
  playKey?: number;
}

function isCelebrationKind(
  kind: LiveScoreEvent["kind"]
): kind is LiveScoreCelebrationKind {
  return kind === "four" || kind === "six" || kind === "wicket";
}

export default function LiveScoreBoundaryCelebration({
  event,
  phase,
  playKey = 0,
}: LiveScoreBoundaryCelebrationProps) {
  if (!event || !isCelebrationKind(event.kind) || phase === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "boundary-celebration",
        `boundary-celebration--${event.kind}`,
        phase === "exit" && "boundary-celebration--exit"
      )}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF must remount via key */}
      <img
        key={`${event.kind}-${playKey}`}
        src={LIVE_SCORE_CELEBRATION_SRC[event.kind]}
        alt=""
        className="boundary-celebration__media"
      />
    </div>
  );
}
