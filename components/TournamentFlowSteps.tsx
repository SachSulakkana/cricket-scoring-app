"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Setup", "Fixtures", "Score"] as const;

export type TournamentFlowStep = (typeof STEPS)[number];

export default function TournamentFlowSteps({
  current,
  className,
}: {
  current: TournamentFlowStep;
  className?: string;
}) {
  const index = STEPS.indexOf(current);

  return (
    <nav
      className={cn("tournament-flow-steps", className)}
      aria-label="Tournament progress"
    >
      <ol className="tournament-flow-steps__list">
        {STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li
              key={step}
              className={cn(
                "tournament-flow-steps__item",
                done && "tournament-flow-steps__item--done",
                active && "tournament-flow-steps__item--active"
              )}
            >
              <span className="tournament-flow-steps__dot" aria-hidden>
                {done ? "✓" : i + 1}
              </span>
              <span className="tournament-flow-steps__label">{step}</span>
              {i < STEPS.length - 1 ? (
                <span className="tournament-flow-steps__connector" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
