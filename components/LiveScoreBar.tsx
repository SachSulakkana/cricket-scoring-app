"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import LiveScoreEventOverlay from "@/components/LiveScoreEventOverlay";
import type { useLiveScoreEventHighlight } from "@/hooks/use-live-score-event-highlight";
import { useRotatingIndex } from "@/hooks/use-rotating-index";
import {
  teamAbbrev,
  type LiveChaseInfo,
  type LiveScoreView,
} from "@/lib/live-score-view";
import { cn } from "@/lib/utils";

type EventHighlight = ReturnType<typeof useLiveScoreEventHighlight>;

function formatPlayerShort(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}.${parts[parts.length - 1]}`;
  }
  return name;
}

function TeamFlag({ team }: { team: { name: string; logoUrl?: string } }) {
  const abbrev = teamAbbrev(team.name);

  return (
    <div className="live-score-bar__flag">
      <div className="live-score-bar__flag-mark" aria-hidden>
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt=""
            width={56}
            height={40}
            className="live-score-bar__flag-img"
            unoptimized
          />
        ) : (
          <span className="live-score-bar__flag-fallback">{abbrev}</span>
        )}
      </div>
      <span className="live-score-bar__flag-name">{team.name}</span>
    </div>
  );
}

function ChevronEdge({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={cn(
        "live-score-bar__chevron-edge",
        direction === "left"
          ? "live-score-bar__chevron-edge--left"
          : "live-score-bar__chevron-edge--right"
      )}
      aria-hidden
    />
  );
}

function BattersPanel({
  batters,
}: {
  batters: Extract<LiveScoreView, { kind: "live" }>["batters"];
}) {
  return (
    <div className="live-score-bar__panel live-score-bar__panel--bat">
      {batters.length === 0 ? (
        <span className="live-score-bar__placeholder">—</span>
      ) : (
        batters.map((batter) => (
          <div
            key={batter.name}
            className={cn(
              "live-score-bar__batter",
              batter.isStriker && "live-score-bar__batter--striker"
            )}
          >
            <span className="live-score-bar__batter-name">
              {formatPlayerShort(batter.name)}
              {batter.isStriker ? " *" : ""}
            </span>
            <span className="live-score-bar__batter-score">
              {batter.runs} ({batter.balls})
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function buildContextItems(
  chaseInfo: LiveChaseInfo | null,
  currentRunRate: string
): string[] {
  if (chaseInfo) {
    return [
      `CRR ${chaseInfo.currentRunRate}`,
      `NEED ${chaseInfo.runsNeeded} FROM ${chaseInfo.oversRemaining} OV`,
    ];
  }
  return [`CRR ${currentRunRate}`];
}

function RotatingContext({ items }: { items: string[] }) {
  const index = useRotatingIndex(items.length);
  const text = items[index] ?? items[0] ?? "";

  return (
    <span key={index} className="live-score-bar__center-footer-text">
      {text}
    </span>
  );
}

function formatOversDisplay(overs: string): { value: string; label: string | null } {
  if (overs === "FT" || overs === "—") {
    return { value: overs, label: null };
  }
  const cleaned = overs.replace(/\s*(OV|OVERS?)$/i, "").trim();
  return { value: cleaned || overs, label: "Overs" };
}

function ScoreCluster({
  score,
  badge,
  anchored = false,
}: {
  score: string;
  badge?: string | null;
  anchored?: boolean;
}) {
  return (
    <div
      className={cn(
        "live-score-bar__score-cluster",
        anchored && "live-score-bar__score-cluster--anchored"
      )}
    >
      <span className="live-score-bar__score-block">{score}</span>
      {badge ? (
        <span
          className="live-score-bar__badge"
          aria-label={badge.startsWith("In") ? `Innings ${badge.slice(-1)}` : undefined}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function CenterPanel({
  overs,
  footer,
}: {
  overs: string;
  footer: ReactNode;
}) {
  const oversDisplay = formatOversDisplay(overs);

  return (
    <div className="live-score-bar__center">
      <div className="live-score-bar__center-main">
        <span className="live-score-bar__overs-block">
          <span className="live-score-bar__overs-value">{oversDisplay.value}</span>
          {oversDisplay.label ? (
            <span className="live-score-bar__overs-label">{oversDisplay.label}</span>
          ) : null}
        </span>
      </div>
      <div className="live-score-bar__center-footer">
        {typeof footer === "string" ? (
          <span className="live-score-bar__center-footer-text">{footer}</span>
        ) : (
          footer
        )}
      </div>
    </div>
  );
}

function BowlerPanel({
  name,
  runs,
  wickets,
  overs,
  overBalls,
}: {
  name: string;
  runs: number;
  wickets: number;
  overs: string;
  overBalls: Extract<LiveScoreView, { kind: "live" }>["overBalls"];
}) {
  return (
    <div className="live-score-bar__panel live-score-bar__panel--bowl">
      <div className="live-score-bar__bowler">
        <span className="live-score-bar__bowler-name">{formatPlayerShort(name)}</span>
        <span className="live-score-bar__bowler-figures">
          {wickets}-{runs}
        </span>
      </div>
      <div className="live-score-bar__balls" aria-label="Current over">
        {overBalls.map((ball) =>
          ball.variant === "pending" ? null : (
            <span
              key={ball.id}
              className={cn(
                "live-score-bar__ball",
                ball.variant === "wicket" && "live-score-bar__ball--wicket",
                ball.variant === "four" && "live-score-bar__ball--four",
                ball.variant === "six" && "live-score-bar__ball--six",
                ball.variant === "extra" && "live-score-bar__ball--extra",
                ball.variant === "dot" && "live-score-bar__ball--dot"
              )}
            >
              {ball.variant === "dot" ? (
                <span className="live-score-bar__ball-dot" aria-hidden />
              ) : (
                ball.broadcastLabel
              )}
            </span>
          )
        )}
      </div>
      <span className="live-score-bar__bowler-overs" aria-hidden>
        {overs}
      </span>
    </div>
  );
}

function LiveScoreBarShell({
  eventHighlight,
  children,
}: {
  eventHighlight?: EventHighlight;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "live-score-bar-shell",
        eventHighlight?.isActive &&
          eventHighlight.event &&
          `live-score-bar-shell--event-${eventHighlight.event.kind}`
      )}
    >
      {eventHighlight ? (
        <LiveScoreEventOverlay
          event={eventHighlight.event}
          phase={eventHighlight.phase}
        />
      ) : null}
      {children}
    </div>
  );
}

function BarLayout({
  eventHighlight,
  children,
}: {
  eventHighlight?: EventHighlight;
  children: ReactNode;
}) {
  return (
    <LiveScoreBarShell eventHighlight={eventHighlight}>
      {children}
    </LiveScoreBarShell>
  );
}

function getCenterBadge(view: LiveScoreView): string | null {
  if (view.kind === "live") {
    return view.chaseInfo ? "In 2" : "In 1";
  }
  if (view.kind === "inningsBreak") return "BREAK";
  if (view.kind === "complete") return "FT";
  return null;
}

export default function LiveScoreBar({
  view,
  eventHighlight,
}: {
  view: LiveScoreView;
  eventHighlight?: EventHighlight;
}) {
  if (view.kind === "none" || view.kind === "empty") {
    return (
      <div className="live-score-bar live-score-bar--idle" role="status">
        <div className="live-score-bar__center live-score-bar__center--solo">
          <div className="live-score-bar__center-main">
            <span className="live-score-bar__score-block">—</span>
          </div>
          <div className="live-score-bar__center-footer">
            <span className="live-score-bar__center-footer-text">
              {view.kind === "empty" ? view.message : "NO LIVE MATCH"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === "waiting") {
    return (
      <BarLayout>
        <div className="live-score-bar" role="status">
          <TeamFlag team={view.battingTeam} />
          <ChevronEdge direction="right" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <CenterPanel overs="—" footer={view.ticker} />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <ChevronEdge direction="left" />
          <TeamFlag team={view.bowlingTeam} />
          <ScoreCluster score="—" anchored />
        </div>
      </BarLayout>
    );
  }

  if (view.kind === "inningsBreak") {
    return (
      <BarLayout>
        <div className="live-score-bar" role="status">
          <TeamFlag team={view.battingTeam} />
          <ChevronEdge direction="right" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">INNINGS BREAK</span>
          </div>
          <CenterPanel overs={`${view.innings1Overs} OV`} footer={view.ticker} />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <ChevronEdge direction="left" />
          <TeamFlag team={view.bowlingTeam} />
          <ScoreCluster
            score={`${view.innings1Runs}-${view.innings1Wickets}`}
            badge={getCenterBadge(view)}
            anchored
          />
        </div>
      </BarLayout>
    );
  }

  if (view.kind === "complete") {
    return (
      <BarLayout>
        <div className="live-score-bar live-score-bar--complete" role="status">
          <TeamFlag team={view.matchState.team1} />
          <ChevronEdge direction="right" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">
              {view.innings1Runs}-{view.innings1Wickets}
            </span>
          </div>
          <CenterPanel overs="FT" footer={view.ticker} />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">
              {view.innings2Runs}-{view.innings2Wickets}
            </span>
          </div>
          <ChevronEdge direction="left" />
          <TeamFlag team={view.matchState.team2} />
          <ScoreCluster
            score={`${view.innings2Runs}-${view.innings2Wickets}`}
            badge={getCenterBadge(view)}
            anchored
          />
        </div>
      </BarLayout>
    );
  }

  return (
    <BarLayout eventHighlight={eventHighlight}>
      <div
        className={cn(
          "live-score-bar",
          eventHighlight?.isActive && "live-score-bar--event-dimmed"
        )}
        role="status"
        aria-live="polite"
      >
        <TeamFlag team={view.battingTeam} />
        <ChevronEdge direction="right" />
        <BattersPanel batters={view.batters} />
        <CenterPanel
          overs={view.currentOvers}
          footer={
            <RotatingContext
              items={buildContextItems(view.chaseInfo, view.currentRunRate)}
            />
          }
        />
        <BowlerPanel
          name={view.bowlerName}
          runs={view.bowlerRuns}
          wickets={view.bowlerWickets}
          overs={view.bowlerOvers}
          overBalls={view.overBalls}
        />
        <ChevronEdge direction="left" />
        <TeamFlag team={view.bowlingTeam} />
        <ScoreCluster
          score={`${view.currentRuns}-${view.currentWickets}`}
          badge={getCenterBadge(view)}
          anchored
        />
      </div>
    </BarLayout>
  );
}
