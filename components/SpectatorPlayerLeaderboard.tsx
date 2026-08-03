"use client";

import Image from "next/image";
import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import { buildTournamentPlayerStats } from "@/lib/tournament-stats";

interface SpectatorPlayerLeaderboardProps {
  data: SpectatorTournamentData;
  mode: "batting" | "bowling";
  title: string;
}

export default function SpectatorPlayerLeaderboard({
  data,
  mode,
  title,
}: SpectatorPlayerLeaderboardProps) {
  const playedFixtures = data.tournament.fixtures.filter((fixture) => fixture.played);
  const { battingTop, bowlingTop } = buildTournamentPlayerStats(
    playedFixtures,
    data.teams,
    10
  );
  const rows = mode === "batting" ? battingTop : bowlingTop;
  const displayRows = Array.from({ length: 10 }, (_, index) => rows[index] ?? null);
  const valueLabel = mode === "batting" ? "Runs" : "Wickets";
  const railLabel = title.trim() || (mode === "batting" ? "Most Runs" : "Most Wickets");

  return (
    <section className="live-embed-points live-embed-points--broadcast live-embed-points--leaderboard">
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
            <div className="live-embed-points__pill live-embed-points__pill--header">
              <span className="live-embed-points__team live-embed-points__player live-embed-points__stat-label">
                Player
              </span>
              <div className="live-embed-points__stats">
                <span className="live-embed-points__stat-label">Matches</span>
                <span className="live-embed-points__stat-label">{valueLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <ol className="live-embed-points__rows">
          {displayRows.map((row, index) => {
            const matches = row?.matches ?? "—";
            const value =
              row == null
                ? "—"
                : mode === "batting"
                  ? (row as { runs: number }).runs
                  : (row as { wickets: number }).wickets;
            return (
              <li
                key={row ? `${row.team}-${row.player}-${index}` : `empty-${index}`}
                className="live-embed-points__row"
              >
                <span className="live-embed-points__rank">{index + 1}.</span>
                <div className="live-embed-points__row-body">
                  <div className="live-embed-points__pill">
                    <div className="live-embed-points__player-meta">
                      <span className="live-embed-points__team live-embed-points__player">
                        {row?.player ?? "—"}
                      </span>
                      <span className="live-embed-points__player-team">
                        {row?.team ?? "—"}
                      </span>
                    </div>
                    <div className="live-embed-points__stats">
                      <span className="live-embed-points__stat">{matches}</span>
                      <span className="live-embed-points__stat live-embed-points__stat--pts">
                        {value}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
