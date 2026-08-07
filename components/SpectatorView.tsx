"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CricketBackButton,
  CricketBroadcastCard,
  CricketEyebrow,
  CricketLivePill,
  CricketPage,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import SpectatorUpcomingMatchCard from "@/components/SpectatorUpcomingMatchCard";
import SpectatorNavTabs, {
  type SpectatorMatchTab,
} from "@/components/SpectatorNavTabs";
import SpectatorScorecard from "@/components/SpectatorScorecard";
import SpectatorScoresheet from "@/components/SpectatorScoresheet";
import {
  SpectatorTournamentMatches,
  SpectatorTournamentStats,
} from "@/components/SpectatorTournamentPanels";
import CricketLoader from "@/components/CricketLoader";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { useEffectiveSpectatorMeta } from "@/hooks/use-spectator-meta";
import { routes } from "@/lib/app-routes";
import { deriveLiveScoreView } from "@/lib/live-score-view";
import { getMatchResult } from "@/lib/match-result";
import type { MatchState } from "@/lib/cricket-types";
import { countsAsDelivery } from "@/lib/cricket-types";
import type { LiveMatchMeta } from "@/lib/store/match-slice";
import {
  formatBallChip,
  formatOversFromLegalBalls,
  getCurrentOverProgress,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "@/lib/spectator-live-stats";
import { cn } from "@/lib/utils";
import { useSpectatorTournament } from "@/hooks/use-spectator-tournament";

type SpectatorSyncSource = "share" | "firestore" | "poll";

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function MatchMetaLabel({
  meta,
}: {
  meta: NonNullable<ReturnType<typeof useLiveMatchSnapshot>["draft"]>["meta"];
}) {
  if (!meta) return null;
  if (meta.kind === "quick") {
    return <p className="spectator-meta">Quick match</p>;
  }
  return (
    <p className="spectator-meta truncate" title={meta.label}>
      {meta.label}
    </p>
  );
}

function SpectatorFooter({
  error,
  updatedAt,
  source,
}: {
  error: string | null;
  updatedAt: string;
  source: SpectatorSyncSource;
}) {
  return (
    <footer className="spectator-footer">
      {error ? (
        <p className="spectator-footer__error">{error}</p>
      ) : (
        <p className="spectator-footer__sync">
          Updated {formatUpdatedAt(updatedAt)}
          {source === "firestore" ? " · live" : " · auto-refresh"}
        </p>
      )}
    </footer>
  );
}

function SpectatorTabPanels({
  tab,
  matchState,
  meta,
  liveContent,
  scoresheet,
}: {
  tab: SpectatorMatchTab;
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  liveContent: ReactNode;
  scoresheet?: ReactNode;
}) {
  const isTournament = meta?.kind === "tournament";
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const activeFixtureId =
    meta?.kind === "tournament" ? meta.fixtureId : undefined;
  const { data, loading, error } = useSpectatorTournament(
    isTournament ? tournamentId : undefined
  );

  return (
    <div className="spectator-tab-panel">
      {tab === "live" ? (
        <>
          {liveContent}
          {scoresheet}
        </>
      ) : null}
      {tab === "scorecard" ? <SpectatorScorecard matchState={matchState} /> : null}
      {tab === "matches" ? (
        <SpectatorTournamentMatches
          data={data}
          loading={loading}
          error={error}
          activeFixtureId={activeFixtureId}
        />
      ) : null}
      {tab === "stats" ? (
        <SpectatorTournamentStats data={data} loading={loading} error={error} />
      ) : null}
    </div>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Live</h1>
        <div className="w-11" aria-hidden />
      </header>
      <div className="spectator-empty">
        <span className="spectator-empty__icon" aria-hidden>
          📡
        </span>
        <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
          No live match
        </h2>
        <p className="spectator-empty__text">
          When a scorer starts a match, the live score will appear here automatically.
        </p>
      </div>
    </CricketPage>
  );
}

function WaitingState({
  matchState,
  meta,
  tab,
  onTabChange,
  onBack,
  onRefresh,
  error,
  updatedAt,
  source,
}: {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  tab: SpectatorMatchTab;
  onTabChange: (tab: SpectatorMatchTab) => void;
  onBack: () => void;
  onRefresh: () => void;
  error: string | null;
  updatedAt: string;
  source: SpectatorSyncSource;
}) {
  const isTournament = meta?.kind === "tournament";
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const activeFixtureId =
    meta?.kind === "tournament" ? meta.fixtureId : undefined;
  const { data: tournamentData } = useSpectatorTournament(
    isTournament ? tournamentId : undefined
  );
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const formatLabel = matchState.config
    ? `${matchState.config.totalOvers} overs`
    : tournamentData?.tournament
      ? `${tournamentData.tournament.totalOvers} overs`
      : null;

  const metaLabel =
    meta?.kind === "tournament"
      ? (meta.label ?? tournamentData?.tournament.name ?? "Tournament match")
      : meta?.kind === "quick"
        ? "Quick match"
        : null;

  const upcomingCards = (() => {
    const cards: {
      key: string;
      teamAName: string;
      teamBName: string;
      status: "starting-soon" | "upcoming";
      stageLabel?: string;
      highlighted?: boolean;
    }[] = [
      {
        key: activeFixtureId ?? "current",
        teamAName: matchState.team1.name,
        teamBName: matchState.team2.name,
        status: "starting-soon",
        highlighted: true,
      },
    ];

    if (!tournamentData || !activeFixtureId) return cards;

    const teamMap = new Map(
      tournamentData.teams.map((team) => [team.id, team.name])
    );

    tournamentData.tournament.fixtures.forEach((fixture) => {
      if (fixture.played || fixture.id === activeFixtureId) return;

      const teamAName = teamMap.get(fixture.teamAId);
      const teamBName =
        fixture.teamBId === "__pending_qualifier_winner__"
          ? "Qualifier winner (TBD)"
          : teamMap.get(fixture.teamBId);
      if (!teamAName || !teamBName) return;

      cards.push({
        key: fixture.id,
        teamAName,
        teamBName,
        status: "upcoming",
        stageLabel: `Stage ${fixture.stageIndex + 1}`,
      });
    });

    return cards;
  })();

  const liveContent = (
    <div className="spectator-upcoming-cards">
      {upcomingCards.map((card) => (
        <SpectatorUpcomingMatchCard
          key={card.key}
          teamAName={card.teamAName}
          teamBName={card.teamBName}
          status={card.status}
          metaLabel={
            card.highlighted
              ? metaLabel
              : tournamentData?.tournament.name ?? metaLabel
          }
          formatLabel={formatLabel}
          stageLabel={card.stageLabel}
          highlighted={card.highlighted}
          expanded={expandedCardId === card.key}
          onToggle={() =>
            setExpandedCardId((prev) => (prev === card.key ? null : card.key))
          }
        />
      ))}
    </div>
  );

  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Live</h1>
        <button
          type="button"
          onClick={onRefresh}
          className="spectator-refresh-btn"
          aria-label="Refresh"
        >
          ↻
        </button>
      </header>

      {isTournament ? (
        <>
          <SpectatorNavTabs
            active={tab}
            onChange={onTabChange}
            isTournament={isTournament}
          />
          <SpectatorTabPanels
            tab={tab}
            matchState={matchState}
            meta={meta}
            liveContent={liveContent}
          />
        </>
      ) : (
        liveContent
      )}

      <SpectatorFooter error={error} updatedAt={updatedAt} source={source} />
    </CricketPage>
  );
}

function InningsBreakView({
  matchState,
  meta,
  tab,
  onTabChange,
  onBack,
  onRefresh,
  error,
  updatedAt,
  source,
}: {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  tab: SpectatorMatchTab;
  onTabChange: (tab: SpectatorMatchTab) => void;
  onBack: () => void;
  onRefresh: () => void;
  error: string | null;
  updatedAt: string;
  source: SpectatorSyncSource;
}) {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings1Wickets = getInningsWickets(matchState.innings1);
  const innings1Overs = formatOversFromLegalBalls(
    getLegalBalls(matchState.innings1),
    ballsPerOver
  );
  const target = innings1Runs + 1;
  const chasingTeam = matchState.team2.name;
  const isTournament = meta?.kind === "tournament";

  const liveContent = (
    <>
      <div className="spectator-hero">
        <div className="spectator-hero__status">
          <CricketLivePill />
          <MatchMetaLabel meta={meta} />
        </div>
        <p className="spectator-hero__innings">Innings break</p>
        <h2 className="spectator-hero__team">
          {matchState.innings1?.teamName ?? matchState.team1.name}
        </h2>
        <div className="spectator-hero__score">
          <CricketScoreDisplay size="xl" className="spectator-hero__runs">
            {innings1Runs}/{innings1Wickets}
          </CricketScoreDisplay>
          <span className="spectator-hero__overs">({innings1Overs} ov)</span>
        </div>
        <p className="spectator-hero__over">1st innings complete</p>
      </div>

      <div className="spectator-team-row">
        <div className="spectator-team-card spectator-team-card--active">
          <p className="spectator-team-card__name">{matchState.team1.name}</p>
          <p className="spectator-team-card__score">
            {innings1Runs}/{innings1Wickets}
          </p>
        </div>
        <div className="spectator-team-card">
          <p className="spectator-team-card__name">{matchState.team2.name}</p>
          <p className="spectator-team-card__score">Yet to bat</p>
        </div>
      </div>

      <div className="spectator-chase">
        {chasingTeam} need {target} to win
      </div>

      <p className="spectator-empty__hint text-center mb-4">
        2nd innings starting soon — waiting for lineup setup…
      </p>
    </>
  );

  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Live</h1>
        <button
          type="button"
          onClick={onRefresh}
          className="spectator-refresh-btn"
          aria-label="Refresh score"
        >
          ↻
        </button>
      </header>

      <SpectatorNavTabs
        active={tab}
        onChange={onTabChange}
        isTournament={isTournament}
      />

      <SpectatorTabPanels
        tab={tab}
        matchState={matchState}
        meta={meta}
        liveContent={liveContent}
      />

      <SpectatorFooter error={error} updatedAt={updatedAt} source={source} />
    </CricketPage>
  );
}

function MatchCompleteView({
  matchState,
  meta,
  tab,
  onTabChange,
  onBack,
  onRefresh,
  error,
  updatedAt,
  source,
}: {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  tab: SpectatorMatchTab;
  onTabChange: (tab: SpectatorMatchTab) => void;
  onBack: () => void;
  onRefresh: () => void;
  error: string | null;
  updatedAt: string;
  source: SpectatorSyncSource;
}) {
  const result = getMatchResult(matchState);
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings1Wickets = getInningsWickets(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const innings2Wickets = getInningsWickets(matchState.innings2);
  const isTournament = meta?.kind === "tournament";

  const liveContent = (
    <>
      <div className="spectator-result-hero">
        <div className="spectator-hero__status">
          <MatchMetaLabel meta={meta} />
        </div>
        <CricketEyebrow className="mb-2">Full time</CricketEyebrow>
        <p className="spectator-result-hero__teams">
          {matchState.team1.name} vs {matchState.team2.name}
        </p>
        <p
          className={cn(
            "spectator-result-hero__winner",
            result.isTie && "spectator-result-hero__winner--tie"
          )}
        >
          {result.text}
        </p>
      </div>

      <div className="spectator-team-row">
        <div
          className={cn(
            "spectator-team-card",
            result.winnerTeamId === matchState.team1.id &&
              "spectator-team-card--winner"
          )}
        >
          <p className="spectator-team-card__name">{matchState.team1.name}</p>
          <p className="spectator-team-card__score">
            {innings1Runs}/{innings1Wickets}
          </p>
        </div>
        <div
          className={cn(
            "spectator-team-card",
            result.winnerTeamId === matchState.team2.id &&
              "spectator-team-card--winner"
          )}
        >
          <p className="spectator-team-card__name">{matchState.team2.name}</p>
          <p className="spectator-team-card__score">
            {innings2Runs}/{innings2Wickets}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Result</h1>
        <button
          type="button"
          onClick={onRefresh}
          className="spectator-refresh-btn"
          aria-label="Refresh score"
        >
          ↻
        </button>
      </header>

      <SpectatorNavTabs
        active={tab}
        onChange={onTabChange}
        isTournament={isTournament}
      />

      <SpectatorTabPanels
        tab={tab}
        matchState={matchState}
        meta={meta}
        liveContent={liveContent}
      />

      <SpectatorFooter error={error} updatedAt={updatedAt} source={source} />
    </CricketPage>
  );
}

export default function SpectatorView() {
  const router = useRouter();
  const { draft, loading, error, refresh, source } = useLiveMatchSnapshot();
  const effectiveMeta = useEffectiveSpectatorMeta(draft?.meta ?? null);
  const [tab, setTab] = useState<SpectatorMatchTab>("live");

  const onBack = () => router.push(routes.live);

  const liveView = useMemo(() => {
    if (!draft?.matchState?.matchStarted) return null;
    const derived = deriveLiveScoreView(draft.matchState);
    if (derived.kind === "none") return null;
    return derived;
  }, [draft]);

  if (loading) {
    return (
      <CricketPage className="spectator-page">
        <header className="spectator-topbar">
          <CricketBackButton onClick={onBack} ariaLabel="Back to live matches" />
          <h1 className="spectator-topbar__title">Live</h1>
          <div className="w-11" aria-hidden />
        </header>
        <CricketLoader block size="lg" label="Loading live score…" />
      </CricketPage>
    );
  }

  if (!draft?.matchState?.matchStarted) {
    return <EmptyState onBack={onBack} />;
  }

  if (liveView?.kind === "waiting") {
    return (
      <WaitingState
        matchState={liveView.matchState}
        meta={effectiveMeta}
        tab={tab}
        onTabChange={setTab}
        onBack={onBack}
        onRefresh={() => void refresh()}
        error={error}
        updatedAt={draft.updatedAt}
        source={source}
      />
    );
  }

  if (liveView?.kind === "inningsBreak") {
    return (
      <InningsBreakView
        matchState={liveView.matchState}
        meta={effectiveMeta}
        tab={tab}
        onTabChange={setTab}
        onBack={onBack}
        onRefresh={() => void refresh()}
        error={error}
        updatedAt={draft.updatedAt}
        source={source}
      />
    );
  }

  if (liveView?.kind === "complete") {
    return (
      <MatchCompleteView
        matchState={liveView.matchState}
        meta={effectiveMeta}
        tab={tab}
        onTabChange={setTab}
        onBack={onBack}
        onRefresh={() => void refresh()}
        error={error}
        updatedAt={draft.updatedAt}
        source={source}
      />
    );
  }

  if (!liveView || liveView.kind !== "live") {
    return <EmptyState onBack={onBack} />;
  }

  const {
    matchState,
    currentInnings,
    ballsPerOver,
    batters,
    bowlerName,
    bowlerRuns,
    bowlerWickets,
    ticker: chaseText,
  } = liveView;

  const striker = batters.find((batter) => batter.isStriker);
  const nonStriker = batters.find((batter) => !batter.isStriker);
  const strikerRuns = striker?.runs ?? 0;
  const nonStrikerRuns = nonStriker?.runs ?? 0;
  const bowlerStats = { runsConceded: bowlerRuns, wickets: bowlerWickets };
  const { overNumber, ballsInOver } = getCurrentOverProgress(
    currentInnings,
    ballsPerOver
  );
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings1Wickets = getInningsWickets(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const innings2Wickets = getInningsWickets(matchState.innings2);
  const recentBalls = currentInnings.balls
    .filter((ball) => countsAsDelivery(ball))
    .slice(-8);

  const currentRuns = getInningsRuns(currentInnings);
  const currentWickets = getInningsWickets(currentInnings);
  const currentOvers = formatOversFromLegalBalls(
    getLegalBalls(currentInnings),
    ballsPerOver
  );
  const isTournament = effectiveMeta?.kind === "tournament";

  const liveContent = (
    <>
      <div className="spectator-hero">
        <div className="spectator-hero__status">
          <CricketLivePill />
          <MatchMetaLabel meta={effectiveMeta} />
        </div>

        <p className="spectator-hero__innings">
          Innings {matchState.currentInnings}
          {matchState.config ? ` · ${matchState.config.totalOvers} overs` : ""}
        </p>

        <h2 className="spectator-hero__team">{currentInnings.teamName}</h2>

        <div className="spectator-hero__score">
          <CricketScoreDisplay size="xl" className="spectator-hero__runs">
            {currentRuns}/{currentWickets}
          </CricketScoreDisplay>
          <span className="spectator-hero__overs">({currentOvers} ov)</span>
        </div>

        <p className="spectator-hero__over">
          Over {overNumber}.{ballsInOver}
        </p>
      </div>

      <div className="spectator-team-row">
        <div
          className={cn(
            "spectator-team-card",
            matchState.currentInnings === 1 && "spectator-team-card--active"
          )}
        >
          <p className="spectator-team-card__name">{matchState.team1.name}</p>
          <p className="spectator-team-card__score">
            {matchState.innings1
              ? `${innings1Runs}/${innings1Wickets}`
              : "—"}
          </p>
        </div>
        <div
          className={cn(
            "spectator-team-card",
            matchState.currentInnings === 2 && "spectator-team-card--active"
          )}
        >
          <p className="spectator-team-card__name">{matchState.team2.name}</p>
          <p className="spectator-team-card__score">
            {matchState.innings2
              ? `${innings2Runs}/${innings2Wickets}`
              : matchState.currentInnings === 2
                ? `${innings2Runs}/${innings2Wickets}`
                : "—"}
          </p>
        </div>
      </div>

      {chaseText && <div className="spectator-chase">{chaseText}</div>}

      <CricketBroadcastCard className="spectator-crease overflow-hidden">
        <div className="spectator-crease__grid">
          <div className="cricket-striker-panel">
            <p className="cricket-panel-label text-[var(--cricket-score)]">Striker</p>
            <p className="cricket-score text-lg text-[var(--cricket-cream)] mt-1">
              {striker?.name}{" "}
              <span className="text-[var(--cricket-gold)]">({strikerRuns})</span>
            </p>
          </div>
          <div className="cricket-non-striker-panel">
            <p className="cricket-panel-label text-[oklch(0.65_0.08_300)]">
              Non-striker
            </p>
            <p className="cricket-score text-lg text-[var(--cricket-cream)] mt-1">
              {nonStriker
                ? `${nonStriker.name} (${nonStrikerRuns})`
                : "—"}
            </p>
          </div>
        </div>
        <div className="cricket-bowler-panel mx-3 mb-3">
          <p className="cricket-panel-label text-[var(--cricket-gold)]">Bowler</p>
          <p className="cricket-score text-lg text-[var(--cricket-cream)] mt-1">
            {bowlerName}{" "}
            <span className="text-[oklch(0.7_0.08_75)]">
              ({bowlerStats.runsConceded}-{bowlerStats.wickets})
            </span>
          </p>
        </div>
      </CricketBroadcastCard>

      {recentBalls.length > 0 && (
        <div className="spectator-recent-balls">
          <p className="cricket-eyebrow mb-2">This over</p>
          <div className="spectator-recent-balls__track">
            {recentBalls.map((ball) => (
              <span
                key={ball.id}
                className={cn(
                  "spectator-ball-pill",
                  ball.dismissal !== "none" &&
                    ball.dismissal !== "retired-hurt" &&
                    "spectator-ball-pill--wicket",
                  ball.extra !== "none" && "spectator-ball-pill--extra"
                )}
              >
                {formatBallChip(ball)}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const scoresheet = (
    <SpectatorScoresheet innings={currentInnings} ballsPerOver={ballsPerOver} />
  );

  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Live</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="spectator-refresh-btn"
          aria-label="Refresh score"
        >
          ↻
        </button>
      </header>

      <SpectatorNavTabs
        active={tab}
        onChange={setTab}
        isTournament={isTournament}
      />

      <SpectatorTabPanels
        tab={tab}
        matchState={matchState}
        meta={effectiveMeta}
        liveContent={liveContent}
        scoresheet={scoresheet}
      />

      <SpectatorFooter
        error={error}
        updatedAt={draft.updatedAt}
        source={source}
      />
    </CricketPage>
  );
}
