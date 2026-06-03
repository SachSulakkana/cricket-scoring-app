"use client";

import { useState } from "react";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import TournamentFlowSteps from "@/components/TournamentFlowSteps";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import TournamentMatchSummaryDialog from "@/components/TournamentMatchSummaryDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team } from "@/lib/cricket-types";
import { SavedTournament, TournamentFixture } from "@/lib/roster-storage";
import { Trophy, Users } from "lucide-react";

interface CustomTournamentGamePageProps {
  tournament: SavedTournament;
  teams: Team[];
  fixtures: TournamentFixture[];
  onBack: () => void;
  onPlayNow: (fixtureId: string) => void;
}

interface StandingRow {
  team: Team;
  played: number;
  won: number;
  lost: number;
  points: number;
  runDiff: number;
}

interface BattingRecord {
  player: string;
  team: string;
  runs: number;
}

interface BowlingRecord {
  player: string;
  team: string;
  wickets: number;
}

interface FixtureWithTeams {
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
  bestBatting?: { player: string; team: string; runs: number };
  bestBowling?: { player: string; team: string; wickets: number };
}

function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

function buildPointsTable(teams: Team[], fixtures: FixtureWithTeams[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  teams.forEach((team) => {
    map.set(team.id, {
      team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      runDiff: 0,
    });
  });

  fixtures.forEach((fx) => {
    if (
      !fx.played ||
      fx.runsA == null ||
      fx.runsB == null ||
      fx.wicketsA == null ||
      fx.wicketsB == null
    ) {
      return;
    }
    const a = map.get(fx.teamA.id);
    const b = map.get(fx.teamB.id);
    if (!a || !b) return;
    a.played += 1;
    b.played += 1;
    a.runDiff += fx.runsA - fx.runsB;
    b.runDiff += fx.runsB - fx.runsA;

    if (!fx.winnerId) {
      a.points += 1;
      b.points += 1;
      return;
    }

    if (fx.winnerId === a.team.id) {
      a.won += 1;
      a.points += 2;
      b.lost += 1;
    } else {
      b.won += 1;
      b.points += 2;
      a.lost += 1;
    }
  });

  return Array.from(map.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (y.runDiff !== x.runDiff) return y.runDiff - x.runDiff;
    return x.team.name.localeCompare(y.team.name);
  });
}

function buildStats(fixtures: FixtureWithTeams[]) {
  const batting: BattingRecord[] = [];
  const bowling: BowlingRecord[] = [];

  fixtures.forEach((fx) => {
    if (!fx.played) return;
    if (fx.bestBatting) batting.push(fx.bestBatting);
    if (fx.bestBowling) bowling.push(fx.bestBowling);
  });

  batting.sort((a, b) => b.runs - a.runs);
  bowling.sort((a, b) => b.wickets - a.wickets);

  return {
    battingTop: batting.slice(0, 10),
    bowlingTop: bowling.slice(0, 10),
  };
}

export default function CustomTournamentGamePage({
  tournament,
  teams,
  fixtures,
  onBack,
  onPlayNow,
}: CustomTournamentGamePageProps) {
  const [summaryFixtureId, setSummaryFixtureId] = useState<string | null>(null);
  const [replayTarget, setReplayTarget] = useState<{
    id: string;
    teamA: string;
    teamB: string;
  } | null>(null);
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const mappedFixtures: FixtureWithTeams[] = fixtures
    .map((fixture) => {
      const teamA = teamMap.get(fixture.teamAId);
      const teamB = teamMap.get(fixture.teamBId);
      if (!teamA || !teamB) return null;
      return {
        id: fixture.id,
        teamA,
        teamB,
        played: fixture.played,
        fixture,
        runsA: fixture.result?.runsA,
        wicketsA: fixture.result?.wicketsA,
        runsB: fixture.result?.runsB,
        wicketsB: fixture.result?.wicketsB,
        winnerId: fixture.result?.winnerTeamId,
        bestBatting: fixture.result?.bestBatting
          ? {
              player: fixture.result.bestBatting.playerName,
              team: teamMap.get(fixture.result.bestBatting.teamId)?.name ?? "Team",
              runs: fixture.result.bestBatting.runs,
            }
          : undefined,
        bestBowling: fixture.result?.bestBowling
          ? {
              player: fixture.result.bestBowling.playerName,
              team: teamMap.get(fixture.result.bestBowling.teamId)?.name ?? "Team",
              wickets: fixture.result.bestBowling.wickets,
            }
          : undefined,
      };
    })
    .filter((fx): fx is FixtureWithTeams => Boolean(fx));
  const nextFixtureId = mappedFixtures.find((fx) => !fx.played)?.id;
  const fixtureRows = mappedFixtures.slice(0, 10);
  const points = buildPointsTable(teams, mappedFixtures);
  const stats = buildStats(mappedFixtures);
  const pointsRows = points.slice(0, 10);
  const summaryFx = summaryFixtureId
    ? mappedFixtures.find((fx) => fx.id === summaryFixtureId)
    : undefined;

  return (
    <CricketPage extraWide>
      <CricketPageHeader
        onBack={onBack}
        title={`${tournament.name} - Game`}
        homeHref="/"
      />
      <TournamentFlowSteps current="Fixtures" className="mb-5" />

      <div className="space-y-5 tournament-game-page">
        <CricketBroadcastCard accent className="p-5 tournament-game-hero">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)]">
              <Trophy className="h-5 w-5 text-[var(--cricket-gold)]" />
            </div>
            <div className="min-w-0 flex-1">
              <CricketEyebrow className="mb-1">Tournament dashboard</CricketEyebrow>
              <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
                {tournament.name}
              </h2>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <CricketDetailRow label="Fixtures" value={String(fixtures.length)} />
            <CricketDetailRow label="Teams" value={String(teams.length)} />
            <CricketDetailRow label="Overs / Match" value={String(tournament.totalOvers)} />
          </div>
        </CricketBroadcastCard>

        <CricketBroadcastCard className="p-5 tournament-game-panel">
          <Tabs defaultValue="schedule" className="gap-4">
            <TabsList className="tournament-game-tabs-list h-auto w-full bg-[oklch(0.16_0.03_255)] border border-[oklch(0.3_0.04_255)] p-1 grid grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="schedule" className="tournament-game-tab text-[var(--cricket-cream)]">
                Schedule matches
              </TabsTrigger>
              <TabsTrigger value="points" className="tournament-game-tab text-[var(--cricket-cream)]">
                Point table
              </TabsTrigger>
              <TabsTrigger value="stats" className="tournament-game-tab text-[var(--cricket-cream)]">
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-3">
              <div className="tournament-game-section-head">
                <CricketEyebrow className="mb-0">Schedule matches</CricketEyebrow>
                <span className="tournament-game-pill">Top 10</span>
              </div>
              <div className="space-y-2">
                {fixtureRows.map((fx, idx) => (
                  <div
                    key={fx.id}
                    className="tournament-game-row rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-[oklch(0.55_0.03_255)]">Match {idx + 1}</p>
                      {!fx.played && fx.id === nextFixtureId && (
                        <span className="inline-flex items-center rounded-full border border-[oklch(0.62_0.12_85/0.55)] bg-[oklch(0.34_0.09_85/0.35)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.82_0.12_85)]">
                          Next match
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--cricket-cream)] truncate">
                          {fx.teamA.name}
                        </p>
                        {fx.played ? (
                          <p className="text-sm text-[oklch(0.65_0.03_255)]">
                            {formatScore(fx.runsA ?? 0, fx.wicketsA ?? 0)}
                          </p>
                        ) : (
                          <p className="text-sm text-[oklch(0.55_0.03_255)]">Not played</p>
                        )}
                      </div>
                      <p className="text-xs text-[oklch(0.55_0.03_255)] text-center">vs</p>
                      <div className="min-w-0 sm:text-right">
                        <p className="font-medium text-[var(--cricket-cream)] truncate">
                          {fx.teamB.name}
                        </p>
                        {fx.played ? (
                          <p className="text-sm text-[oklch(0.65_0.03_255)]">
                            {formatScore(fx.runsB ?? 0, fx.wicketsB ?? 0)}
                          </p>
                        ) : (
                          <p className="text-sm text-[oklch(0.55_0.03_255)]">Not played</p>
                        )}
                      </div>
                    </div>
                    {fx.played ? (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[oklch(0.72_0.1_75)]">
                          {fx.winnerId
                            ? `${fx.winnerId === fx.teamA.id ? fx.teamA.name : fx.teamB.name} won`
                            : "Match tied"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament !w-auto px-3 text-xs"
                            onClick={() => setSummaryFixtureId(fx.id)}
                          >
                            Match summary
                          </button>
                          <button
                            type="button"
                            className="cricket-btn-setup !w-auto !min-h-[2.2rem] px-3 text-xs"
                            onClick={() =>
                              setReplayTarget({
                                id: fx.id,
                                teamA: fx.teamA.name,
                                teamB: fx.teamB.name,
                              })
                            }
                          >
                            Replay match
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-[oklch(0.55_0.03_255)]">Awaiting play</p>
                        <button
                          type="button"
                          className="cricket-btn-add cricket-btn-add--inline cricket-btn-add--tournament !w-auto px-3"
                          onClick={() => onPlayNow(fx.id)}
                        >
                          Play now
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="points" className="space-y-3">
              <div className="tournament-game-section-head">
                <CricketEyebrow className="mb-0">Point table</CricketEyebrow>
                <span className="tournament-game-pill">Top 10</span>
              </div>
              <div className="space-y-2">
                {pointsRows.map((row, i) => (
                  <div
                    key={row.team.id}
                    className="tournament-game-row rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--cricket-cream)] truncate">
                        {i + 1}. {row.team.name}
                      </p>
                      <p className="text-sm text-[oklch(0.75_0.12_85)] font-semibold">
                        {row.points} pts
                      </p>
                    </div>
                    <p className="text-xs text-[oklch(0.55_0.03_255)] mt-1">
                      P {row.played} · W {row.won} · L {row.lost} · Run diff{" "}
                      {row.runDiff >= 0 ? "+" : ""}
                      {row.runDiff}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-3">
              <div className="tournament-game-section-head">
                <CricketEyebrow className="mb-0">Stats</CricketEyebrow>
                <span className="tournament-game-pill">10 records each</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-[oklch(0.55_0.03_255)] uppercase tracking-[0.12em]">
                    Highest batting scores
                  </p>
                  {stats.battingTop.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3 text-sm text-[oklch(0.55_0.03_255)]">
                      No batting records yet. Complete matches to populate stats.
                    </div>
                  ) : (
                    stats.battingTop.map((record, i) => (
                      <div
                        key={`${record.player}-${record.team}-${i}`}
                        className="tournament-game-row rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--cricket-cream)] truncate">
                            {i + 1}. {record.player}
                          </p>
                          <p className="text-sm text-[oklch(0.75_0.12_85)] font-semibold">
                            {record.runs}
                          </p>
                        </div>
                        <p className="text-xs text-[oklch(0.55_0.03_255)] mt-1">
                          {record.team}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[oklch(0.55_0.03_255)] uppercase tracking-[0.12em]">
                    Most wickets
                  </p>
                  {stats.bowlingTop.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3 text-sm text-[oklch(0.55_0.03_255)]">
                      No bowling records yet. Complete matches to populate stats.
                    </div>
                  ) : (
                    stats.bowlingTop.map((record, i) => (
                      <div
                        key={`${record.player}-${record.team}-${i}`}
                        className="tournament-game-row rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--cricket-cream)] truncate">
                            {i + 1}. {record.player}
                          </p>
                          <p className="text-sm text-[oklch(0.75_0.12_85)] font-semibold">
                            {record.wickets}
                          </p>
                        </div>
                        <p className="text-xs text-[oklch(0.55_0.03_255)] mt-1">
                          {record.team}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[oklch(0.55_0.03_255)]" />
                  <p className="text-sm text-[oklch(0.55_0.03_255)]">
                    Data will populate from real played matches only.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CricketBroadcastCard>
      </div>

      {summaryFx && (
        <TournamentMatchSummaryDialog
          open={summaryFixtureId !== null}
          onOpenChange={(open) => {
            if (!open) setSummaryFixtureId(null);
          }}
          fixture={summaryFx.fixture}
          teamA={summaryFx.teamA}
          teamB={summaryFx.teamB}
        />
      )}

      <ConfirmActionDialog
        open={replayTarget != null}
        onOpenChange={(open) => {
          if (!open) setReplayTarget(null);
        }}
        title="Replay match?"
        description={
          replayTarget
            ? `Replay ${replayTarget.teamA} vs ${replayTarget.teamB}? This will replace the existing result.`
            : ""
        }
        confirmLabel="Replay"
        onConfirm={() => {
          if (replayTarget) {
            onPlayNow(replayTarget.id);
            setReplayTarget(null);
          }
        }}
      />
    </CricketPage>
  );
}

