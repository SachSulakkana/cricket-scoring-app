"use client";

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
  const statLabel = mode === "batting" ? "Runs" : "Wickets";
  const displayRows = Array.from({ length: 10 }, (_, index) => rows[index] ?? null);

  return (
    <section className="live-embed-points live-embed-leaderboard live-embed-leaderboard--fit">
      <h2 className="live-embed-points__title">{title}</h2>
      <div className="live-embed-leaderboard__table spectator-stats-table-wrap">
        <table className="spectator-stats-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>{statLabel}</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={row ? `${row.team}-${row.player}` : `empty-${index}`}>
                <td>
                  <span className="spectator-stats-table__rank">{index + 1}</span>
                  {row?.player ?? "—"}
                </td>
                <td className="spectator-stats-table__pts">
                  {row ? (mode === "batting" ? row.runs : row.wickets) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
