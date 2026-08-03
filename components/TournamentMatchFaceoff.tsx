"use client";

import type { Team } from "@/lib/cricket-types";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface TournamentMatchFaceoffProps {
  teamA: Team;
  teamB: Team;
  size?: "sm" | "lg";
  /** Full-width matchup title below the logos (LPL-style) */
  showMatchTitle?: boolean;
  className?: string;
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function TeamLogoDisc({
  team,
  size,
}: {
  team: Team;
  size: "sm" | "lg";
}) {
  const isLarge = size === "lg";

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div
        className={cn(
          "tournament-match-faceoff__disc rounded-full",
          isLarge
            ? "h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]"
            : "h-[3.25rem] w-[3.25rem] sm:h-[3.75rem] sm:w-[3.75rem]"
        )}
      >
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt=""
            className="tournament-match-faceoff__disc-img rounded-full"
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full bg-[oklch(0.88_0.02_295)] font-bold text-[oklch(0.35_0.08_295)]",
              isLarge ? "text-lg sm:text-xl" : "text-sm sm:text-base"
            )}
          >
            {teamInitials(team.name) || (
              <Users
                className={isLarge ? "h-7 w-7 sm:h-8 sm:w-8" : "h-5 w-5 sm:h-6 sm:w-6"}
                aria-hidden
              />
            )}
          </span>
        )}
      </div>
      <p
        className={cn(
          "max-w-full truncate text-center font-semibold leading-tight text-[var(--cricket-cream)]",
          isLarge ? "text-sm sm:text-base" : "text-xs sm:text-sm"
        )}
      >
        {team.name}
      </p>
    </div>
  );
}

export function TournamentMatchFaceoff({
  teamA,
  teamB,
  size = "sm",
  showMatchTitle = true,
  className,
}: TournamentMatchFaceoffProps) {
  const isLarge = size === "lg";

  return (
    <div className={cn("tournament-match-faceoff", className)}>
      <div className="tournament-match-faceoff__logos">
        <TeamLogoDisc team={teamA} size={size} />
        <span
          className={cn(
            "cricket-display shrink-0 self-start font-semibold text-[var(--cricket-gold)]",
            isLarge
              ? "mt-5 text-base sm:mt-6 sm:text-lg"
              : "mt-3.5 text-xs sm:mt-4 sm:text-sm"
          )}
          aria-hidden
        >
          Vs
        </span>
        <TeamLogoDisc team={teamB} size={size} />
      </div>
      {showMatchTitle ? (
        <p
          className={cn(
            "cricket-display text-center font-bold leading-snug text-[var(--cricket-cream)]",
            isLarge ? "text-lg sm:text-2xl" : "text-sm sm:text-base"
          )}
        >
          {teamA.name}{" "}
          <span className="font-normal text-[var(--cricket-gold)]">Vs</span>{" "}
          {teamB.name}
        </p>
      ) : null}
    </div>
  );
}
