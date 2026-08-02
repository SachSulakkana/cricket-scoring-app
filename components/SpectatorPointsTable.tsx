"use client";

import Image from "next/image";
import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import { computeStandings } from "@/lib/tournament-stage-engine";
import { formatStandingNrr } from "@/lib/tournament-nrr";
import { teamAbbrev } from "@/lib/live-score-view";

interface SpectatorPointsTableProps {
  data: SpectatorTournamentData;
  title?: string;
}

const STAT_HEADERS = [
  "Matches",
  "Won",
  "Lost",
  "NR",
  "NRR",
  "PTS",
] as const;

export default function SpectatorPointsTable({
  data,
  title = "Points table",
}: SpectatorPointsTableProps) {
  const { tournament, teams } = data;
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const teamIds = tournament.selectedTeamIds.filter((id) => teamMap.has(id));
  const standings = computeStandings(teamIds, tournament.fixtures, {
    totalOvers: tournament.totalOvers,
    ballsPerOver: tournament.ballsPerOver,
  });

  const railLabel = title.trim() || "Points table";

  return (
    <section className="live-embed-points live-embed-points--broadcast">
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

      <div className="live-embed-points__main">
        <div className="live-embed-points__row live-embed-points__row--header">
          <span className="live-embed-points__rank" aria-hidden />
          <div className="live-embed-points__row-body">
            <span className="live-embed-points__logo-slot" aria-hidden />
            <div className="live-embed-points__pill live-embed-points__pill--header">
              <span className="live-embed-points__team" aria-hidden />
              <div className="live-embed-points__stats">
                {STAT_HEADERS.map((label) => (
                  <span key={label} className="live-embed-points__stat-label">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {standings.length === 0 ? (
          <p className="live-embed-points__empty">No standings yet</p>
        ) : (
          <ol className="live-embed-points__rows">
            {standings.map((row, index) => {
              const team = teamMap.get(row.teamId);
              if (!team) return null;
              const abbrev = teamAbbrev(team.name);
              return (
                <li key={row.teamId} className="live-embed-points__row">
                  <span className="live-embed-points__rank">{index + 1}.</span>
                  <div className="live-embed-points__row-body">
                    <div className="live-embed-points__logo" title={team.name}>
                      {team.logoUrl ? (
                        <Image
                          src={team.logoUrl}
                          alt=""
                          width={120}
                          height={120}
                          className="live-embed-points__logo-img"
                          unoptimized
                        />
                      ) : (
                        <span className="live-embed-points__logo-fallback">
                          {abbrev}
                        </span>
                      )}
                    </div>
                    <div className="live-embed-points__pill">
                      <span className="live-embed-points__team">{abbrev}</span>
                      <div className="live-embed-points__stats">
                        <span className="live-embed-points__stat">{row.played}</span>
                        <span className="live-embed-points__stat">{row.won}</span>
                        <span className="live-embed-points__stat">{row.lost}</span>
                        <span className="live-embed-points__stat">{row.tied}</span>
                        <span className="live-embed-points__stat live-embed-points__stat--nrr">
                          {formatStandingNrr(row.nrr, row.played)}
                        </span>
                        <span className="live-embed-points__stat live-embed-points__stat--pts">
                          {row.points}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
