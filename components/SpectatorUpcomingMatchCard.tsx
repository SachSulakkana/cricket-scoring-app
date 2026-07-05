"use client";

import { ChevronDown } from "lucide-react";
import { CricketBroadcastCard, CricketLivePill } from "@/components/cricket-shell";
import { cn } from "@/lib/utils";

export type SpectatorUpcomingMatchStatus = "starting-soon" | "upcoming";

interface SpectatorUpcomingMatchCardProps {
  teamAName: string;
  teamBName: string;
  status: SpectatorUpcomingMatchStatus;
  metaLabel?: string | null;
  formatLabel?: string | null;
  stageLabel?: string | null;
  highlighted?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function SpectatorUpcomingMatchCard({
  teamAName,
  teamBName,
  status,
  metaLabel,
  formatLabel,
  stageLabel,
  highlighted = false,
  expanded = false,
  onToggle,
}: SpectatorUpcomingMatchCardProps) {
  const isStartingSoon = status === "starting-soon";

  return (
    <CricketBroadcastCard
      className={cn(
        "spectator-upcoming-card overflow-hidden",
        highlighted && "spectator-upcoming-card--highlight",
        expanded && "spectator-upcoming-card--expanded"
      )}
    >
      <button
        type="button"
        className="spectator-upcoming-card__summary"
        onClick={onToggle}
        aria-expanded={expanded ? "true" : "false"}
      >
        <span className="spectator-upcoming-card__faceoff">
          <span className="spectator-upcoming-card__team">{teamAName}</span>
          <span className="spectator-upcoming-card__vs">vs</span>
          <span className="spectator-upcoming-card__team">{teamBName}</span>
        </span>
        <ChevronDown
          className={cn(
            "spectator-upcoming-card__chevron",
            expanded && "spectator-upcoming-card__chevron--open"
          )}
          size={18}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="spectator-upcoming-card__details">
          <div className="live-match-card__header">
            <div className="live-match-card__status">
              {isStartingSoon ? (
                <CricketLivePill />
              ) : (
                <span className="spectator-upcoming-card__badge">Upcoming</span>
              )}
              {metaLabel ? (
                <span className="live-match-card__meta">{metaLabel}</span>
              ) : null}
            </div>
            {formatLabel ? (
              <p className="live-match-card__format">{formatLabel}</p>
            ) : null}
          </div>

          {stageLabel ? (
            <p className="spectator-upcoming-card__stage">{stageLabel}</p>
          ) : null}

          <p className="spectator-upcoming-card__message">
            {isStartingSoon
              ? "Match starting soon — waiting for lineup setup…"
              : "Not started yet"}
          </p>
        </div>
      ) : null}
    </CricketBroadcastCard>
  );
}
