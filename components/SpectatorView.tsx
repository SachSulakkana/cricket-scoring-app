"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CricketBackButton,
  CricketBroadcastCard,
  CricketEyebrow,
  CricketLivePill,
  CricketPage,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import SpectatorScorecard from "@/components/SpectatorScorecard";
import SpectatorScoresheet from "@/components/SpectatorScoresheet";
import CricketLoader from "@/components/CricketLoader";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { routes } from "@/lib/app-routes";
import { getMatchResult, isMatchComplete } from "@/lib/match-result";
import type { MatchState } from "@/lib/cricket-types";
import {
  formatBallChip,
  formatOversFromLegalBalls,
  getBatsmanRuns,
  getBowlerStats,
  getCurrentOverProgress,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "@/lib/spectator-live-stats";
import { cn } from "@/lib/utils";

type SpectatorTab = "live" | "scorecard";

function getBattingTeam(matchState: MatchState) {
  return matchState.currentInnings === 1 ? matchState.team1 : matchState.team2;
}

function getBowlingTeam(matchState: MatchState) {
  return matchState.currentInnings === 1 ? matchState.team2 : matchState.team1;
}

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

function MatchMetaLabel({ meta }: { meta: NonNullable<ReturnType<typeof useLiveMatchSnapshot>["draft"]>["meta"] }) {
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
  onBack,
}: {
  matchState: MatchState;
  onBack: () => void;
}) {
  return (
    <CricketPage className="spectator-page">
      <header className="spectator-topbar">
        <CricketBackButton onClick={onBack} ariaLabel="Back to home" />
        <h1 className="spectator-topbar__title">Live</h1>
        <div className="w-11" aria-hidden />
      </header>
      <div className="spectator-empty">
        <CricketLivePill />
        <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)] mt-4">
          Match starting soon
        </h2>
        <p className="spectator-empty__text">
          {matchState.team1.name} vs {matchState.team2.name}
        </p>
        <p className="spectator-empty__hint">
          Waiting for the scorer to complete lineup setup…
        </p>
      </div>
    </CricketPage>
  );
}

function InningsBreakView({
  matchState,
  meta,
  onBack,
  onRefresh,
  error,
  updatedAt,
  source,
}: {
  matchState: MatchState;
  meta: NonNullable<ReturnType<typeof useLiveMatchSnapshot>["draft"]>["meta"];
  onBack: () => void;
  onRefresh: () => void;
  error: string | null;
  updatedAt: string;
  source: "firestore" | "poll";
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

      <SpectatorScorecard matchState={matchState} />

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
    </CricketPage>
  );
}

function MatchCompleteView({
  matchState,
  meta,
  onBack,
  onRefresh,
  error,
  updatedAt,
  source,
}: {
  matchState: MatchState;
  meta: NonNullable<ReturnType<typeof useLiveMatchSnapshot>["draft"]>["meta"];
  onBack: () => void;
  onRefresh: () => void;
  error: string | null;
  updatedAt: string;
  source: "firestore" | "poll";
}) {
  const result = getMatchResult(matchState);
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings1Wickets = getInningsWickets(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const innings2Wickets = getInningsWickets(matchState.innings2);

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

      <SpectatorScorecard matchState={matchState} />

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
    </CricketPage>
  );
}

export default function SpectatorView() {
  const router = useRouter();
  const { draft, loading, error, refresh, source } = useLiveMatchSnapshot();
  const [tab, setTab] = useState<SpectatorTab>("live");

  const onBack = () => router.push(routes.live);

  const liveView = useMemo(() => {
    if (!draft?.matchState?.matchStarted) return null;

    const matchState = draft.matchState;

    if (isMatchComplete(matchState)) {
      return { kind: "complete" as const, matchState };
    }

    const currentInnings =
      matchState.currentInnings === 1 ? matchState.innings1 : matchState.innings2;
    if (!currentInnings) return { kind: "waiting" as const, matchState };

    const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
    const battingTeam = getBattingTeam(matchState);
    const bowlingTeam = getBowlingTeam(matchState);

    const striker = battingTeam.players.find(
      (p) => p.id === currentInnings.strikerPlayerId
    );
    const nonStriker = battingTeam.players.find(
      (p) => p.id === currentInnings.nonStrikerPlayerId
    );
    const bowler = bowlingTeam.players.find(
      (p) => p.id === currentInnings.currentBowlerPlayerId
    );

    const lineupReady = Boolean(striker && bowler);
    if (!lineupReady) {
      const innings1Complete = Boolean(matchState.innings1?.balls.length);
      if (innings1Complete && matchState.currentInnings === 2) {
        return { kind: "inningsBreak" as const, matchState };
      }
      return { kind: "waiting" as const, matchState };
    }

    const strikerRuns = getBatsmanRuns(currentInnings, striker?.name);
    const nonStrikerRuns = getBatsmanRuns(currentInnings, nonStriker?.name);
    const bowlerStats = getBowlerStats(currentInnings, bowler?.name);
    const { overNumber, ballsInOver } = getCurrentOverProgress(
      currentInnings,
      ballsPerOver
    );

    const innings1Runs = getInningsRuns(matchState.innings1);
    const innings1Wickets = getInningsWickets(matchState.innings1);
    const innings2Runs = getInningsRuns(matchState.innings2);
    const innings2Wickets = getInningsWickets(matchState.innings2);

    const recentBalls = currentInnings.balls.slice(-8);

    let chaseText: string | null = null;
    if (
      matchState.currentInnings === 2 &&
      matchState.innings1 &&
      matchState.config &&
      !isMatchComplete(matchState)
    ) {
      const target = innings1Runs + 1;
      const runsNeeded = Math.max(target - innings2Runs, 0);
      const totalLegalBalls =
        matchState.config.totalOvers * matchState.config.ballsPerOver;
      const ballsRemaining = Math.max(
        totalLegalBalls - getLegalBalls(matchState.innings2),
        0
      );
      const oversRemaining = formatOversFromLegalBalls(
        ballsRemaining,
        ballsPerOver
      );
      chaseText = `${matchState.team2.name} need ${runsNeeded} from ${oversRemaining} overs`;
    }

    return {
      kind: "live" as const,
      matchState,
      currentInnings,
      ballsPerOver,
      striker,
      nonStriker,
      bowler,
      strikerRuns,
      nonStrikerRuns,
      bowlerStats,
      overNumber,
      ballsInOver,
      innings1Runs,
      innings1Wickets,
      innings2Runs,
      innings2Wickets,
      recentBalls,
      chaseText,
    };
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
    return <WaitingState matchState={liveView.matchState} onBack={onBack} />;
  }

  if (liveView?.kind === "inningsBreak") {
    return (
      <InningsBreakView
        matchState={liveView.matchState}
        meta={draft.meta}
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
        meta={draft.meta}
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
    striker,
    nonStriker,
    bowler,
    strikerRuns,
    nonStrikerRuns,
    bowlerStats,
    overNumber,
    ballsInOver,
    innings1Runs,
    innings1Wickets,
    innings2Runs,
    innings2Wickets,
    recentBalls,
    chaseText,
  } = liveView;

  const currentRuns = getInningsRuns(currentInnings);
  const currentWickets = getInningsWickets(currentInnings);
  const currentOvers = formatOversFromLegalBalls(
    getLegalBalls(currentInnings),
    ballsPerOver
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

      <div className="spectator-hero">
        <div className="spectator-hero__status">
          <CricketLivePill />
          <MatchMetaLabel meta={draft.meta} />
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
            {bowler?.name}{" "}
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
                  ball.dismissal !== "none" && ball.dismissal !== "retired-hurt" &&
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

      <div className="spectator-tabs" role="tablist" aria-label="Live views">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "live"}
          className={cn("spectator-tab", tab === "live" && "spectator-tab--active")}
          onClick={() => setTab("live")}
        >
          Ball by ball
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "scorecard"}
          className={cn(
            "spectator-tab",
            tab === "scorecard" && "spectator-tab--active"
          )}
          onClick={() => setTab("scorecard")}
        >
          Scorecard
        </button>
      </div>

      <div className="spectator-tab-panel">
        {tab === "live" ? (
          <SpectatorScoresheet
            innings={currentInnings}
            ballsPerOver={ballsPerOver}
          />
        ) : (
          <SpectatorScorecard matchState={matchState} />
        )}
      </div>

      <footer className="spectator-footer">
        {error ? (
          <p className="spectator-footer__error">{error}</p>
        ) : (
          <p className="spectator-footer__sync">
            Updated {formatUpdatedAt(draft.updatedAt)}
            {source === "firestore" ? " · live" : " · auto-refresh"}
          </p>
        )}
      </footer>
    </CricketPage>
  );
}
