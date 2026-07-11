"use client";

import type { LiveScoreEventPhase } from "@/hooks/use-live-score-event-highlight";
import type { LiveScoreEvent } from "@/lib/live-score-event";
import { cn } from "@/lib/utils";

interface LiveScoreEventOverlayProps {
  event: LiveScoreEvent | null;
  phase: LiveScoreEventPhase;
}

export default function LiveScoreEventOverlay({
  event,
  phase,
}: LiveScoreEventOverlayProps) {
  if (!event || phase === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "live-score-event-overlay",
        `live-score-event-overlay--${event.kind}`,
        phase === "enter" && "live-score-event-overlay--enter",
        phase === "show" && "live-score-event-overlay--show",
        phase === "exit" && "live-score-event-overlay--exit"
      )}
      role="status"
      aria-live="assertive"
    >
      <div className="live-score-event-overlay__burst" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="live-score-event-overlay__glow" aria-hidden />
      <div className="live-score-event-overlay__content">
        <span className="live-score-event-overlay__label">{event.label}</span>
        {event.sublabel ? (
          <span className="live-score-event-overlay__sublabel">
            {event.sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
