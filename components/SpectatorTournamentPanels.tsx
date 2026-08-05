"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TournamentFixtureResult } from "@/components/TournamentFixtureResult";
import TournamentMatchScorecardView from "@/components/TournamentMatchScorecardView";
import CricketLoader from "@/components/CricketLoader";
import { CricketEyebrow } from "@/components/cricket-shell";
import type { SpectatorTournamentData } from "@/hooks/use-spectator-tournament";
import type { Team } from "@/lib/cricket-types";
import type { SavedTournament, TournamentFixture } from "@/lib/roster-types";
import { computeStandings } from "@/lib/tournament-stage-engine";
import { formatStandingNrr } from "@/lib/tournament-nrr";
import { buildTournamentPlayerStats } from "@/lib/tournament-stats";
import { resolveFixtureDisplayScores } from "@/lib/fixture-team-scores";
import { cn } from "@/lib/utils";

interface MappedFixture {
  id: string;
  teamA: Team;
  teamB: Team;
  played: boolean;
  fixture: TournamentFixture;
  runsA?: number;
  wicketsA?: number;
  runsB?: number;
  wicketsB?: number;
  winnerId?: string;
}

function mapFixtures(
  tournament: SavedTournament,
  teams: Team[]
): MappedFixture[] {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const rows: MappedFixture[] = [];

  for (const fixture of tournament.fixtures) {
    const teamA = teamMap.get(fixture.teamAId);
    const teamB = teamMap.get(fixture.teamBId);
    if (!teamA || !teamB) continue;
    const scores = resolveFixtureDisplayScores(teamA, teamB, fixture.result);
    rows.push({
      id: fixture.id,
      teamA,
      teamB,
      played: fixture.played,
      fixture,
      runsA: scores.runsA,
      wicketsA: scores.wicketsA,
      runsB: scores.runsB,
      wicketsB: scores.wicketsB,
      winnerId: fixture.result?.winnerTeamId,
    });
  }

  return rows;
}

function fixtureLabel(fx: MappedFixture, index: number): string {
  const stage = fx.fixture.stageIndex + 1;
  if (fx.fixture.playoffMatchKind === "qualifier") {
    return `Stage ${stage} · Qualifier`;
  }
  if (fx.fixture.playoffMatchKind === "final") {
    return `Stage ${stage} · Final`;
  }
  if (fx.fixture.bracketRound != null) {
    return `Stage ${stage} · Knockout R${fx.fixture.bracketRound + 1}`;
  }
  return `Stage ${stage} · Match ${index + 1}`;
}

function formatCompactScore(runs?: number, wickets?: number): string {
  if (runs == null || wickets == null) return "—";
  return `${runs}/${wickets}`;
}

interface SpectatorTournamentMatchCardProps {
  fx: MappedFixture;
  index: number;
  teamBName: string;
  isLive: boolean;
  isCurrent: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function SpectatorTournamentMatchCard({
  fx,
  index,
  teamBName,
  isLive,
  isCurrent,
  expanded,
  onToggle,
}: SpectatorTournamentMatchCardProps) {
  const hasScorecard = Boolean(fx.fixture.result?.scorecard);
  const canExpand = fx.played && hasScorecard;

  return (
    <article
      className={cn(
        "spectator-tournament-match",
        isLive && "spectator-tournament-match--live",
        isCurrent && "spectator-tournament-match--current",
        expanded && "spectator-tournament-match--expanded"
      )}
    >
      <div className="spectator-tournament-match__head">
        <p className="spectator-tournament-match__label">
          {fixtureLabel(fx, index)}
        </p>
        {isLive ? (
          <span className="spectator-tournament-match__live-pill">Live</span>
        ) : fx.played ? (
          <span className="spectator-tournament-match__status">Result</span>
        ) : (
          <span className="spectator-tournament-match__status">Upcoming</span>
        )}
      </div>

      {fx.played ? (
        <>
          <button
            type="button"
            className={cn(
              "spectator-tournament-match__summary",
              !canExpand && "spectator-tournament-match__summary--static"
            )}
            onClick={canExpand ? onToggle : undefined}
            aria-expanded={
              canExpand ? (expanded ? "true" : "false") : undefined
            }
            disabled={!canExpand}
          >
            <span className="spectator-tournament-match__summary-scores">
              <span className="spectator-tournament-match__summary-team">
                <span className="spectator-tournament-match__summary-name">
                  {fx.teamA.name}
                </span>
                <span className="spectator-tournament-match__summary-runs">
                  {formatCompactScore(fx.runsA, fx.wicketsA)}
                </span>
              </span>
              <span className="spectator-tournament-match__vs">vs</span>
              <span className="spectator-tournament-match__summary-team spectator-tournament-match__summary-team--right">
                <span className="spectator-tournament-match__summary-name">
                  {teamBName}
                </span>
                <span className="spectator-tournament-match__summary-runs">
                  {formatCompactScore(fx.runsB, fx.wicketsB)}
                </span>
              </span>
            </span>
            {canExpand ? (
              <ChevronDown
                className={cn(
                  "spectator-tournament-match__chevron",
                  expanded && "spectator-tournament-match__chevron--open"
                )}
                size={18}
                aria-hidden
              />
            ) : null}
          </button>

          {!canExpand ? (
            <TournamentFixtureResult
              teamA={fx.teamA}
              teamB={fx.teamB}
              teamBLabel={teamBName}
              abandoned={fx.fixture.result?.abandoned}
              winnerId={fx.winnerId}
              runsA={fx.runsA}
              wicketsA={fx.wicketsA}
              runsB={fx.runsB}
              wicketsB={fx.wicketsB}
            />
          ) : null}

          {expanded && fx.fixture.result?.scorecard ? (
            <div className="spectator-tournament-match__scorecard">
              <TournamentMatchScorecardView
                snapshot={fx.fixture.result.scorecard}
              />
            </div>
          ) : null}

          {canExpand && !expanded ? (
            <p className="spectator-tournament-match__hint">
              Tap to view full scorecard
            </p>
          ) : null}
        </>
      ) : (
        <div className="spectator-tournament-match__faceoff">
          <p className="spectator-tournament-match__team">{fx.teamA.name}</p>
          <span className="spectator-tournament-match__vs">vs</span>
          <p className="spectator-tournament-match__team">{teamBName}</p>
        </div>
      )}
    </article>
  );
}

interface SpectatorTournamentMatchesProps {
  data: SpectatorTournamentData | null;
  loading: boolean;
  error: string | null;
  activeFixtureId?: string;
}

export function SpectatorTournamentMatches({
  data,
  loading,
  error,
  activeFixtureId,
}: SpectatorTournamentMatchesProps) {
  const [expandedFixtureId, setExpandedFixtureId] = useState<string | null>(
    null
  );

  if (loading && !data) {
    return <CricketLoader block size="md" label="Loading matches…" />;
  }

  if (error && !data) {
    return <p className="spectator-tournament-empty">{error}</p>;
  }

  if (!data) {
    return (
      <p className="spectator-tournament-empty">
        Tournament schedule is not available.
      </p>
    );
  }

  const fixtures = mapFixtures(data.tournament, data.teams);
  if (fixtures.length === 0) {
    return (
      <p className="spectator-tournament-empty">No matches scheduled yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="spectator-tournament-head">
        <CricketEyebrow className="mb-0">{data.tournament.name}</CricketEyebrow>
        <p className="spectator-tournament-head__sub">
          {fixtures.filter((fx) => fx.played).length} of {fixtures.length} played
        </p>
      </div>

      {fixtures.map((fx, index) => {
        const isLive = fx.id === activeFixtureId && !fx.played;
        const teamBName =
          fx.fixture.teamBId === "__pending_qualifier_winner__"
            ? "Qualifier winner (TBD)"
            : fx.teamB.name;

        return (
          <SpectatorTournamentMatchCard
            key={fx.id}
            fx={fx}
            index={index}
            teamBName={teamBName}
            isLive={isLive}
            isCurrent={fx.id === activeFixtureId}
            expanded={expandedFixtureId === fx.id}
            onToggle={() =>
              setExpandedFixtureId((prev) => (prev === fx.id ? null : fx.id))
            }
          />
        );
      })}
    </div>
  );
}

interface SpectatorTournamentStatsProps {
  data: SpectatorTournamentData | null;
  loading: boolean;
  error: string | null;
}

export function SpectatorTournamentStats({
  data,
  loading,
  error,
}: SpectatorTournamentStatsProps) {
  if (loading && !data) {
    return <CricketLoader block size="md" label="Loading stats…" />;
  }

  if (error && !data) {
    return <p className="spectator-tournament-empty">{error}</p>;
  }

  if (!data) {
    return (
      <p className="spectator-tournament-empty">
        Tournament stats are not available.
      </p>
    );
  }

  const { tournament, teams } = data;
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const teamIds = tournament.selectedTeamIds.filter((id) => teamMap.has(id));
  const standings = computeStandings(teamIds, tournament.fixtures, {
    totalOvers: tournament.totalOvers,
    ballsPerOver: tournament.ballsPerOver,
  });
  const playedFixtures = tournament.fixtures.filter((fx) => fx.played);
  const { battingTop, bowlingTop } = buildTournamentPlayerStats(
    playedFixtures,
    teams
  );

  return (
    <div className="space-y-5">
      <section>
        <CricketEyebrow className="mb-3">Points table</CricketEyebrow>
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

      <section>
        <CricketEyebrow className="mb-3">Top run scorers</CricketEyebrow>
        {battingTop.length === 0 ? (
          <p className="spectator-tournament-empty">No batting stats yet.</p>
        ) : (
          <ul className="spectator-stats-leaders">
            {battingTop.map((row, index) => (
              <li key={`${row.team}-${row.player}`} className="spectator-stats-leader">
                <span className="spectator-stats-leader__rank">{index + 1}</span>
                <div className="min-w-0">
                  <p className="spectator-stats-leader__name">{row.player}</p>
                  <p className="spectator-stats-leader__team">{row.team}</p>
                </div>
                <span className="spectator-stats-leader__value">{row.runs}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <CricketEyebrow className="mb-3">Top wicket takers</CricketEyebrow>
        {bowlingTop.length === 0 ? (
          <p className="spectator-tournament-empty">No bowling stats yet.</p>
        ) : (
          <ul className="spectator-stats-leaders">
            {bowlingTop.map((row, index) => (
              <li key={`${row.team}-${row.player}`} className="spectator-stats-leader">
                <span className="spectator-stats-leader__rank">{index + 1}</span>
                <div className="min-w-0">
                  <p className="spectator-stats-leader__name">{row.player}</p>
                  <p className="spectator-stats-leader__team">{row.team}</p>
                </div>
                <span className="spectator-stats-leader__value">{row.wickets}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
