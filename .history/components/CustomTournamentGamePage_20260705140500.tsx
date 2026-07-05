"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import TournamentScheduleList from "@/components/TournamentScheduleList";
import { TournamentFixtureResult } from "@/components/TournamentFixtureResult";
import ExportPdfButton from "@/components/ExportPdfButton";
import {
  TournamentChampionHero,
  TournamentCompleteHero,
} from "@/components/TournamentNextMatchHero";
import {
  getActiveStageIndex,
  isStageComplete,
  tryAdvanceStage,
} from "@/lib/tournament-stage-engine";
import {
  getFormatPreset,
  DEFAULT_FORMAT_PRESET_ID,
} from "@/lib/tournament-format-presets";
import {
  formatStageStyle,
  type TournamentStageStyle,
} from "@/lib/tournament-stage-options";
import { appToast } from "@/lib/app-toast";
import { exportTournamentFullResultsPdf } from "@/lib/pdf-export";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team } from "@/lib/cricket-types";
import { SavedTournament, TournamentFixture } from "@/lib/roster-storage";
import {
  addNrrTotals,
  computeTournamentNrr,
  emptyNrrTotals,
  formatTournamentNrr,
  getMatchNrrContributions,
} from "@/lib/tournament-nrr";
import { buildTournamentPlayerStats } from "@/lib/tournament-stats";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Trophy, Users } from "lucide-react";

/** Shared column layout: Team | P | W | L | Pts | NRR */
const POINTS_TABLE_GRID =
  "grid w-full items-center gap-x-1.5 gap-y-0.5 px-3 py-2.5 sm:gap-x-2 sm:px-3.5 sm:py-3 grid-cols-[minmax(0,1fr)_1.6rem_1.6rem_1.6rem_2.4rem_minmax(3.25rem,1fr)] sm:grid-cols-[minmax(0,1fr)_2rem_2rem_2rem_2.75rem_4.5rem]";

const STANDINGS_STAGE_STYLES: TournamentStageStyle[] = [
  "round-robin",
  "league",
  "group-stage",
];

function stageSupportsStandings(style: TournamentStageStyle | undefined): boolean {
  return style != null && STANDINGS_STAGE_STYLES.includes(style);
}

function normalizeStageFilter(
  stageFilter?: number | number[]
): number[] | undefined {
  if (stageFilter == null) return undefined;
  return Array.isArray(stageFilter) ? stageFilter : [stageFilter];
}

interface CustomTournamentGamePageProps {
  tournament: SavedTournament;
  teams: Team[];
  fixtures: TournamentFixture[];
  onBack: () => void;
  onPlayNow: (fixtureId: string) => void;
  onReorderFixtures: (fixtures: TournamentFixture[]) => void | Promise<void>;
  onAdvanceStage?: (tournament: SavedTournament) => void | Promise<void>;
}

interface StandingRow {
  team: Team;
  played: number;
  won: number;
  lost: number;
  points: number;
  runDiff: number;
  nrr: number | null;
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
}

function buildStats(fixtures: FixtureWithTeams[], teams: Team[]) {
  return buildTournamentPlayerStats(
    fixtures.map((fx) => fx.fixture),
    teams
  );
}

function buildPointsTable(
  teams: Team[],
  fixtures: FixtureWithTeams[],
  config: { totalOvers: number; ballsPerOver: number },
  stageFilter?: number | number[]
): StandingRow[] {
  const stageIndices = normalizeStageFilter(stageFilter);
  const nrrTotals = new Map<string, ReturnType<typeof emptyNrrTotals>>();
  const map = new Map<string, StandingRow>();
  teams.forEach((team) => {
    map.set(team.id, {
      team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      runDiff: 0,
      nrr: null,
    });
    nrrTotals.set(team.id, emptyNrrTotals());
  });

  fixtures.forEach((fx) => {
    if (
      stageIndices != null &&
      !stageIndices.includes(fx.fixture.stageIndex)
    ) {
      return;
    }
    if (
      !fx.played ||
      fx.fixture.result?.abandoned ||
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

    const result = fx.fixture.result;
    if (result) {
      const contribA = getMatchNrrContributions(
        result,
        fx.teamA.id,
        fx.teamA.players.length,
        config
      );
      const contribB = getMatchNrrContributions(
        result,
        fx.teamB.id,
        fx.teamB.players.length,
        config
      );
      if (contribA) {
        nrrTotals.set(
          fx.teamA.id,
          addNrrTotals(nrrTotals.get(fx.teamA.id) ?? emptyNrrTotals(), contribA)
        );
      }
      if (contribB) {
        nrrTotals.set(
          fx.teamB.id,
          addNrrTotals(nrrTotals.get(fx.teamB.id) ?? emptyNrrTotals(), contribB)
        );
      }
    }

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

  map.forEach((row, teamId) => {
    row.nrr = computeTournamentNrr(nrrTotals.get(teamId) ?? emptyNrrTotals());
  });

  return Array.from(map.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    const xNrr = x.nrr ?? -Infinity;
    const yNrr = y.nrr ?? -Infinity;
    if (yNrr !== xNrr) return yNrr - xNrr;
    if (y.runDiff !== x.runDiff) return y.runDiff - x.runDiff;
    return x.team.name.localeCompare(y.team.name);
  });
}

function playoffMatchLabel(kind: TournamentFixture["playoffMatchKind"]): string {
  if (kind === "qualifier") return "Qualifier — #2 vs #3";
  if (kind === "final") return "Final — #1 vs qualifier winner";
  return "Playoff match";
}

function orderStageFixtures(
  stageFixtures: FixtureWithTeams[],
  style: TournamentStageStyle
): FixtureWithTeams[] {
  const list = [...stageFixtures];
  if (style === "playoffs") {
    const kindOrder: Record<string, number> = { qualifier: 0, final: 1 };
    return list.sort(
      (a, b) =>
        (kindOrder[a.fixture.playoffMatchKind ?? ""] ?? 2) -
        (kindOrder[b.fixture.playoffMatchKind ?? ""] ?? 2)
    );
  }
  if (style === "knockout") {
    return list.sort(
      (a, b) => (a.fixture.bracketRound ?? 0) - (b.fixture.bracketRound ?? 0)
    );
  }
  return list;
}

function StageFixtureResultsPanel({
  fixtures,
  style,
}: {
  fixtures: FixtureWithTeams[];
  style: TournamentStageStyle;
}) {
  const ordered = orderStageFixtures(fixtures, style);

  if (ordered.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3 text-sm text-[oklch(0.55_0.03_255)]">
        No fixtures for this stage yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ordered.map((fx, idx) => {
        const teamBName =
          fx.fixture.teamBId === "__pending_qualifier_winner__"
            ? "Qualifier winner (TBD)"
            : fx.teamB.name;
        const label =
          style === "playoffs"
            ? playoffMatchLabel(fx.fixture.playoffMatchKind)
            : style === "knockout"
              ? `Knockout · Round ${(fx.fixture.bracketRound ?? 0) + 1}`
              : `Match ${idx + 1}`;

        return (
          <div
            key={fx.id}
            className="tournament-game-row tournament-match-card overflow-hidden rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)]"
          >
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[oklch(0.55_0.04_288)]">
              {label}
            </p>
            {fx.played ? (
              <TournamentFixtureResult
                teamA={fx.teamA}
                teamB={fx.teamB}
                teamBLabel={teamBName}
                abandoned={fx.fixture.result?.abandoned}
                abandonedMessage="Abandoned (rain) — no points"
                winnerId={fx.winnerId}
                runsA={fx.runsA}
                wicketsA={fx.wicketsA}
                runsB={fx.runsB}
                wicketsB={fx.wicketsB}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <p className="font-medium text-[var(--cricket-cream)]">{fx.teamA.name}</p>
                  <span className="text-xs text-[oklch(0.55_0.03_255)]">vs</span>
                  <p className="font-medium text-[var(--cricket-cream)] sm:text-right">
                    {teamBName}
                  </p>
                </div>
                <p className="px-3 pb-3 text-xs text-[oklch(0.55_0.03_255)]">Not played</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PointsTableBlock({
  rows,
  emptyMessage,
  ariaLabel = "Tournament points table",
}: {
  rows: StandingRow[];
  emptyMessage?: string;
  ariaLabel?: string;
}) {
  if (rows.length === 0) {
    return emptyMessage ? (
      <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3 text-sm text-[oklch(0.55_0.03_255)]">
        {emptyMessage}
      </div>
    ) : null;
  }

  const displayRows = rows.filter((r) => r.played > 0).slice(0, 10);

  return (
    <section className="space-y-2">
      <div className="tournament-game-section-head">
        <span className="tournament-game-pill shrink-0">Top 10</span>
      </div>
      <div
        className="tournament-points-table-scroll rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.1_0.02_288/0.65)]"
        role="table"
        aria-label={ariaLabel}
      >
        <div className="tournament-points-table-inner min-w-[18.5rem] overflow-hidden">
          <div
            className={cn(
              POINTS_TABLE_GRID,
              "border-b border-[oklch(0.32_0.05_295/0.55)] bg-[oklch(0.14_0.03_295/0.5)] text-center text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[oklch(0.58_0.04_288)]"
            )}
            role="row"
          >
            <span className="text-left" role="columnheader">
              Team
            </span>
            <span role="columnheader">P</span>
            <span role="columnheader">W</span>
            <span role="columnheader">L</span>
            <span className="text-[var(--cricket-cream)]" role="columnheader">
              Pts
            </span>
            <span className="text-[var(--cricket-gold)]" role="columnheader">
              NRR
            </span>
          </div>
          {displayRows.map((row, i) => (
            <div
              key={row.team.id}
              className={cn(
                POINTS_TABLE_GRID,
                "tournament-game-row border-b border-[oklch(0.28_0.04_288/0.45)] last:border-b-0"
              )}
              role="row"
            >
              <span
                className="min-w-0 truncate text-left text-sm font-medium text-[var(--cricket-cream)]"
                role="cell"
              >
                <span className="mr-1.5 inline-flex min-w-[1.35rem] justify-center text-xs font-bold text-[oklch(0.55_0.04_288)]">
                  {i + 1}
                </span>
                {row.team.name}
              </span>
              <span
                className="text-center text-xs tabular-nums text-[oklch(0.62_0.03_288)]"
                role="cell"
              >
                {row.played}
              </span>
              <span
                className="text-center text-xs tabular-nums text-[oklch(0.62_0.03_288)]"
                role="cell"
              >
                {row.won}
              </span>
              <span
                className="text-center text-xs tabular-nums text-[oklch(0.62_0.03_288)]"
                role="cell"
              >
                {row.lost}
              </span>
              <span
                className="text-center text-sm font-bold tabular-nums text-[var(--cricket-cream)]"
                role="cell"
              >
                {row.points}
              </span>
              <span
                className="text-center text-base font-bold tabular-nums text-[var(--cricket-gold)] sm:text-[1.0625rem]"
                role="cell"
              >
                {formatTournamentNrr(row.nrr)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TournamentStagePointsNavigator({
  preset,
  activeStageIndex,
  viewingStageIndex,
  onViewingStageChange,
  teams,
  mappedFixtures,
  matchPointsConfig,
}: {
  preset: NonNullable<ReturnType<typeof getFormatPreset>>;
  activeStageIndex: number;
  viewingStageIndex: number;
  onViewingStageChange: (index: number) => void;
  teams: Team[];
  mappedFixtures: FixtureWithTeams[];
  matchPointsConfig: { totalOvers: number; ballsPerOver: number };
}) {
  const totalStages = preset.stages.length;
  const stage = preset.stages[viewingStageIndex];
  const style = stage?.style ?? "round-robin";
  const stageFixtures = mappedFixtures.filter(
    (fx) => fx.fixture.stageIndex === viewingStageIndex
  );
  const hasFixtures = stageFixtures.length > 0;
  const stageStatus =
    viewingStageIndex < activeStageIndex
      ? "Completed"
      : viewingStageIndex === activeStageIndex
        ? "Current"
        : "Upcoming";

  const statusClass =
    stageStatus === "Current"
      ? "border-[oklch(0.62_0.12_85/0.55)] bg-[oklch(0.34_0.09_85/0.35)] text-[oklch(0.82_0.12_85)]"
      : stageStatus === "Completed"
        ? "border-[oklch(0.45_0.08_295/0.5)] bg-[oklch(0.2_0.04_295/0.45)] text-[oklch(0.7_0.05_288)]"
        : "border-[oklch(0.35_0.04_255)] bg-[oklch(0.14_0.02_255/0.5)] text-[oklch(0.55_0.03_255)]";

  let body: ReactNode;

  if (!hasFixtures) {
    body = (
      <div className="rounded-md border border-dashed border-[oklch(0.35_0.04_255)] p-3 text-sm text-[oklch(0.55_0.03_255)]">
        {stageStatus === "Upcoming"
          ? "This stage has not started yet. Finish the previous stage to unlock it."
          : "No fixtures recorded for this stage yet."}
      </div>
    );
  } else if (stageSupportsStandings(style)) {
    const rows = buildPointsTable(
      teams,
      mappedFixtures,
      matchPointsConfig,
      viewingStageIndex
    );
    body = (
      <PointsTableBlock
        rows={rows}
        emptyMessage="No completed matches in this stage yet."
        ariaLabel={`Stage ${viewingStageIndex + 1} points table`}
      />
    );
  } else if (style === "playoffs" || style === "knockout") {
    body = <StageFixtureResultsPanel fixtures={stageFixtures} style={style} />;
  } else {
    body = (
      <StageFixtureResultsPanel fixtures={stageFixtures} style={style} />
    );
  }

  return (
    <div className="space-y-3">
      <div className="tournament-stage-points-nav flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={viewingStageIndex <= 0}
          onClick={() => onViewingStageChange(viewingStageIndex - 1)}
          className="tournament-stage-points-nav__btn flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[oklch(0.35_0.05_295/0.55)] bg-[oklch(0.16_0.03_295/0.5)] text-[var(--cricket-cream)] transition hover:border-[oklch(0.55_0.1_295/0.6)] disabled:cursor-not-allowed disabled:opacity-35 touch-manipulation"
          aria-label="Previous stage"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center px-1">
          <p className="cricket-display text-sm sm:text-base font-semibold text-[var(--cricket-cream)]">
            Stage {viewingStageIndex + 1} of {totalStages}
          </p>
          <p className="text-xs sm:text-sm text-[oklch(0.65_0.04_288)] mt-0.5">
            {formatStageStyle(style)}
          </p>
          <span
            className={cn(
              "inline-flex mt-2 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
              statusClass
            )}
          >
            {stageStatus}
          </span>
        </div>

        <button
          type="button"
          disabled={viewingStageIndex >= totalStages - 1}
          onClick={() => onViewingStageChange(viewingStageIndex + 1)}
          className="tournament-stage-points-nav__btn flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[oklch(0.35_0.05_295/0.55)] bg-[oklch(0.16_0.03_295/0.5)] text-[var(--cricket-cream)] transition hover:border-[oklch(0.55_0.1_295/0.6)] disabled:cursor-not-allowed disabled:opacity-35 touch-manipulation"
          aria-label="Next stage"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {body}
    </div>
  );
}

export default function CustomTournamentGamePage({
  tournament,
  teams,
  fixtures,
  onBack,
  onPlayNow,
  onReorderFixtures,
  onAdvanceStage,
}: CustomTournamentGamePageProps) {
  const [advancing, setAdvancing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [summaryFixtureId, setSummaryFixtureId] = useState<string | null>(null);
  const [replayTarget, setReplayTarget] = useState<{
    id: string;
    teamA: string;
    teamB: string;
  } | null>(null);
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const mappedFixtures: FixtureWithTeams[] = [];
  for (const fixture of fixtures) {
    const teamA = teamMap.get(fixture.teamAId);
    const teamB = teamMap.get(fixture.teamBId);
    if (!teamA || !teamB) continue;
    mappedFixtures.push({
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
    });
  }

  const activeStageIndex = getActiveStageIndex(tournament);
  const preset = getFormatPreset(
    tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  const [viewingStageIndex, setViewingStageIndex] = useState(activeStageIndex);

  useEffect(() => {
    setViewingStageIndex(activeStageIndex);
  }, [activeStageIndex]);
  const activeStageConfig = preset?.stages[activeStageIndex];
  const isPlayable = (fx: FixtureWithTeams) =>
    fx.fixture.teamBId !== "__pending_qualifier_winner__";

  const activeMapped = mappedFixtures.filter(
    (fx) => fx.fixture.stageIndex === activeStageIndex && isPlayable(fx)
  );
  const nextFixture = activeMapped.find((fx) => !fx.played);
  const nextFixtureId = nextFixture?.id;
  const championTeam = tournament.championTeamId
    ? teams.find((t) => t.id === tournament.championTeamId)
    : undefined;
  const stageDone =
    !tournament.championTeamId &&
    isStageComplete(tournament, activeStageIndex);
  const stageMarkedComplete = tournament.stageComplete?.[activeStageIndex];
  const needsAdvance = stageDone && !stageMarkedComplete;

  const matchPointsConfig = {
    totalOvers: tournament.totalOvers,
    ballsPerOver: tournament.ballsPerOver,
  };

  const playedFixtures = mappedFixtures.filter((fx) => fx.played);
  const stats = buildStats(playedFixtures, teams);

  const handleExportFullResultsPdf = () => {
    setExportingPdf(true);
    void exportTournamentFullResultsPdf({ tournament, teams })
      .then(() => appToast.success("Tournament results PDF downloaded"))
      .catch((err) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not export PDF"
        )
      )
      .finally(() => setExportingPdf(false));
  };

  const activeFixtures = fixtures.filter(
    (fx) => fx.stageIndex === activeStageIndex
  );
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
        <CricketBroadcastCard accent className="p-4 sm:p-5 tournament-game-hero">
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
            {playedFixtures.length > 0 && (
              <ExportPdfButton
                onClick={handleExportFullResultsPdf}
                loading={exportingPdf}
                label="Export PDF"
                variant="outline"
                className="shrink-0"
              />
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CricketDetailRow
              label="Stage"
              value={
                preset
                  ? `${activeStageIndex + 1} / ${preset.stages.length} · ${formatStageStyle(activeStageConfig?.style ?? "round-robin")}`
                  : String(activeStageIndex + 1)
              }
            />
            <CricketDetailRow
              label="Active fixtures"
              value={String(activeMapped.length)}
            />
            <CricketDetailRow label="Teams" value={String(teams.length)} />
            <CricketDetailRow label="Overs / Match" value={String(tournament.totalOvers)} />
          </div>
        </CricketBroadcastCard>

        {championTeam ? (
          <TournamentChampionHero
            championName={championTeam.name}
            tournamentName={tournament.name}
          />
        ) : needsAdvance ? (
          <CricketBroadcastCard className="p-5 border border-[oklch(0.55_0.12_295/0.5)]">
            <CricketEyebrow className="mb-2 text-[var(--cricket-gold)]">
              Stage {activeStageIndex + 1} complete
            </CricketEyebrow>
            <p className="text-sm text-[oklch(0.7_0.03_255)] mb-4">
              All matches in this stage are done. Continue to generate the next
              stage fixtures.
            </p>
            <button
              type="button"
              disabled={advancing}
              className="btn-12 btn-12--lg btn-12--full w-full sm:w-auto min-h-10 px-6"
              onClick={() => {
                setAdvancing(true);
                const result = tryAdvanceStage(tournament);
                void Promise.resolve(onAdvanceStage?.(result.tournament))
                  .then(() => {
                    if (result.message) appToast.success(result.message);
                    if (result.championTeamId) {
                      appToast.success("Tournament complete!");
                    }
                  })
                  .finally(() => setAdvancing(false));
              }}
            >
              {advancing ? "Starting next stage…" : "Continue to next stage"}
            </button>
          </CricketBroadcastCard>
        ) : activeMapped.length > 0 &&
          activeMapped.every((fx) => fx.played) ? (
          <TournamentCompleteHero
            playedCount={activeMapped.filter((fx) => fx.played).length}
            totalFixtures={activeMapped.length}
          />
        ) : null}

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
              <TournamentScheduleList
                rows={activeMapped}
                fixtures={activeFixtures}
                nextFixtureId={nextFixtureId}
                onPlayNow={onPlayNow}
                onSummary={setSummaryFixtureId}
                onReplay={(id, teamA, teamB) =>
                  setReplayTarget({ id, teamA, teamB })
                }
                onReorderFixtures={(reorderedActive) => {
                  const other = fixtures.filter(
                    (fx) => fx.stageIndex !== activeStageIndex
                  );
                  onReorderFixtures([...other, ...reorderedActive]);
                }}
              />
            </TabsContent>

            <TabsContent value="points" className="space-y-3">
              <div className="tournament-game-section-head">
                <CricketEyebrow className="mb-0">Point table by stage</CricketEyebrow>
                {preset && preset.stages.length > 1 ? (
                  <span className="tournament-game-pill shrink-0">
                    {preset.stages.length} stages
                  </span>
                ) : null}
              </div>
              {preset ? (
                <TournamentStagePointsNavigator
                  preset={preset}
                  activeStageIndex={activeStageIndex}
                  viewingStageIndex={Math.min(
                    viewingStageIndex,
                    preset.stages.length - 1
                  )}
                  onViewingStageChange={setViewingStageIndex}
                  teams={teams}
                  mappedFixtures={mappedFixtures}
                  matchPointsConfig={matchPointsConfig}
                />
              ) : (
                <PointsTableBlock
                  rows={buildPointsTable(
                    teams,
                    mappedFixtures,
                    matchPointsConfig,
                    activeStageIndex
                  )}
                  emptyMessage="No completed matches yet."
                />
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-3">
              <div className="tournament-game-section-head">
                <CricketEyebrow className="mb-0">Stats</CricketEyebrow>
                <span className="tournament-game-pill">All stages · top 10</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-[oklch(0.55_0.03_255)] uppercase tracking-[0.12em]">
                    Most Runs (tournament)
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
                    Most wickets (tournament)
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
                    Stats include every completed match across all tournament
                    stages.
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
          tournamentName={tournament.name}
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

