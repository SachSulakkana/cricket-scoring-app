"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import type { Team } from "@/lib/cricket-types";

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function TeamLogoContent({ team }: { team: Team }) {
  const initials = teamInitials(team.name);

  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className="live-embed-next-match__disc-img"
      />
    );
  }

  return (
    <span className="live-embed-next-match__disc-fallback">
      {initials || (
        <Users className="live-embed-next-match__disc-icon" aria-hidden />
      )}
    </span>
  );
}

export function EmbedTeamLogoFlip({
  team,
  scoreLine,
}: {
  team: Team;
  scoreLine?: string | null;
}) {
  return (
    <div className="live-embed-next-match__team">
      <div className="live-embed-next-match__flip">
        <div className="live-embed-next-match__flip-inner">
          <div className="live-embed-next-match__disc live-embed-next-match__disc--front">
            <TeamLogoContent team={team} />
          </div>
          <div
            className="live-embed-next-match__disc live-embed-next-match__disc--back"
            aria-hidden
          >
            <TeamLogoContent team={team} />
          </div>
        </div>
      </div>
      <p className="live-embed-next-match__team-name">{team.name}</p>
      {scoreLine ? (
        <p className="live-embed-next-match__team-score">{scoreLine}</p>
      ) : null}
    </div>
  );
}

export function EmbedMatchFaceoffLayout({
  eyebrow,
  stageLabel,
  footer,
  teamA,
  teamB,
  teamAScoreLine,
  teamBScoreLine,
}: {
  eyebrow: string;
  eyebrowClassName?: string;
  stageLabel?: string;
  footer?: string | null;
  teamA: Team;
  teamB: Team;
  teamAScoreLine?: string | null;
  teamBScoreLine?: string | null;
}) {
  const railLabel = eyebrow.trim() || "Match";

  return (
    <section className="live-embed-points live-embed-points--broadcast live-embed-points--faceoff live-embed-next-match">
      <aside className="live-embed-points__rail" aria-hidden>
        <div className="live-embed-points__rail-logo">
          <div className="live-embed-points__rail-flip">
            <div className="live-embed-points__rail-flip-inner">
              <div className="live-embed-points__rail-disc live-embed-points__rail-disc--front">
                <Image
                  src="/qpl-logo-transparent.png"
                  alt=""
                  width={160}
                  height={160}
                  className="live-embed-points__rail-logo-img"
                  unoptimized
                />
              </div>
              <div className="live-embed-points__rail-disc live-embed-points__rail-disc--back">
                <Image
                  src="/qpl-logo-transparent.png"
                  alt=""
                  width={160}
                  height={160}
                  className="live-embed-points__rail-logo-img"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <p className="live-embed-points__rail-label">{railLabel}</p>
      </aside>

      <div className="live-embed-points__main live-embed-next-match__main">
        {stageLabel ? (
          <p className="live-embed-next-match__stage">{stageLabel}</p>
        ) : null}
        <div className="live-embed-next-match__faceoff">
          <EmbedTeamLogoFlip team={teamA} scoreLine={teamAScoreLine} />
          <p className="live-embed-next-match__vs" aria-hidden>
            Vs
          </p>
          <EmbedTeamLogoFlip team={teamB} scoreLine={teamBScoreLine} />
        </div>
        {footer ? (
          <p className="live-embed-next-match__chase">{footer}</p>
        ) : null}
      </div>
    </section>
  );
}
