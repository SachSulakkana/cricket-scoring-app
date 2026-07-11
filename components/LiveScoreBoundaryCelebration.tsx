"use client";

import type { LiveScoreEventPhase } from "@/hooks/use-live-score-event-highlight";
import type { LiveScoreEvent } from "@/lib/live-score-event";
import { cn } from "@/lib/utils";

interface LiveScoreBoundaryCelebrationProps {
  event: LiveScoreEvent | null;
  phase: LiveScoreEventPhase;
}

export default function LiveScoreBoundaryCelebration({
  event,
  phase,
}: LiveScoreBoundaryCelebrationProps) {
  const isBigEvent =
    event?.kind === "four" ||
    event?.kind === "six" ||
    event?.kind === "wicket";

  if (!event || !isBigEvent || phase === "idle") {
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
      <span className="boundary-celebration__flash" aria-hidden />

      <div className="boundary-celebration__center">
        <span className="boundary-celebration__rays" aria-hidden />
        <span className="boundary-celebration__ring" aria-hidden />
        <span className="boundary-celebration__ring boundary-celebration__ring--delayed" aria-hidden />
        <span className="boundary-celebration__word">{event.label}</span>
        {event.sublabel ? (
          <span className="boundary-celebration__subword">
            {event.sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
