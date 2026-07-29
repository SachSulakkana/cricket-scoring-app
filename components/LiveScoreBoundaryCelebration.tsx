"use client";

import type { LiveScoreEventPhase } from "@/hooks/use-live-score-event-highlight";
import type { LiveScoreEvent } from "@/lib/live-score-event";
import { cn } from "@/lib/utils";

interface LiveScoreBoundaryCelebrationProps {
  event: LiveScoreEvent | null;
  phase: LiveScoreEventPhase;
  playKey?: number;
}

const CELEBRATION_SRC: Record<"four" | "six" | "wicket", string> = {
  four: "/celebrations/four.gif",
  six: "/celebrations/six.gif",
  wicket: "/celebrations/wicket.gif",
};

export default function LiveScoreBoundaryCelebration({
  event,
  phase,
  playKey = 0,
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
      {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF must remount via key */}
      <img
        key={playKey}
        src={CELEBRATION_SRC[event.kind]}
        alt=""
        className="boundary-celebration__media"
      />
    </div>
  );
}
