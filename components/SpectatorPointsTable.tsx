"use client";

import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import { computeStandings } from "@/lib/tournament-stage-engine";
import { formatStandingNrr } from "@/lib/tournament-nrr";

interface SpectatorPointsTableProps {
  data: SpectatorTournamentData;
  title?: string;
}

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

  return (
    <section className="live-embed-points">
      <h2 className="live-embed-points__title">{title}</h2>
      <div className="spectator-stats-table-wrap">
        <table className="spectator-stats-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>L</th>
              <th>Pts</th>
              <th>NRR</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => {
              const team = teamMap.get(row.teamId);
              if (!team) return null;
              return (
                <tr key={row.teamId}>
                  <td>
                    <span className="spectator-stats-table__rank">
                      {index + 1}
                    </span>
                    {team.name}
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.lost + row.tied}</td>
                  <td className="spectator-stats-table__pts">{row.points}</td>
                  <td className="spectator-stats-table__nrr">
                    {formatStandingNrr(row.nrr, row.played)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
