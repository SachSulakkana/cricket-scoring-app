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
    return `${parts[0]![0]}.${parts[parts.length - 1]!.toUpperCase()}`;
  }
  return name.toUpperCase();
}

function TeamPanel({
  team,
  side,
}: {
  team: { name: string; logoUrl?: string };
  side: "bat" | "bowl";
}) {
  const abbrev = teamAbbrev(team.name);
  const initials = abbrev.slice(0, 3);

  const shield = (
    <div className="live-score-bar__shield" aria-hidden>
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt=""
          width={40}
          height={40}
          className="live-score-bar__shield-img"
          unoptimized
        />
      ) : (
        <span className="live-score-bar__shield-initials">{initials}</span>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "live-score-bar__team",
        side === "bat" ? "live-score-bar__team--bat" : "live-score-bar__team--bowl"
      )}
    >
      {side === "bat" ? (
        <>
          {shield}
          <span className="live-score-bar__team-code">{abbrev}</span>
        </>
      ) : (
        <>
          <span className="live-score-bar__team-code">{abbrev}</span>
          {shield}
        </>
      )}
    </div>
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
              {batter.isStriker ? batter.name : formatPlayerShort(batter.name)}
              {batter.isStriker ? "*" : ""}
            </span>
            <span className="live-score-bar__batter-score">
              {batter.runs}
              <span className="live-score-bar__batter-balls">
                ({batter.balls})
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function buildContextItems(
  chaseInfo: LiveChaseInfo | null,
  currentRunRate: string,
  currentOvers: string
): string[] {
  if (chaseInfo) {
    // Required run rate is the headline stat, so it appears most often.
    return [
      `REQ RR ${chaseInfo.requiredRunRate}`,
      `TARGET ${chaseInfo.target} · ${chaseInfo.runsNeeded} OFF ${chaseInfo.ballsRemaining}`,
      `REQ RR ${chaseInfo.requiredRunRate}`,
      `CRR ${chaseInfo.currentRunRate}`,
    ];
  }
  return [`CRR ${currentRunRate}`, `OVERS ${currentOvers}`];
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

function CenterPanel({
  score,
  overs,
  footer,
}: {
  score: string;
  overs: string;
  footer: ReactNode;
}) {
  return (
    <div className="live-score-bar__center">
      <div className="live-score-bar__center-main">
        <span className="live-score-bar__score">{score}</span>
        <span className="live-score-bar__overs">{overs}</span>
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
          {runs}-{wickets}
          <span className="live-score-bar__bowler-overs">({overs})</span>
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
    </div>
  );
}

function LiveScoreBarShell({
  showLive,
  eventHighlight,
  children,
}: {
  showLive?: boolean;
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
      {showLive ? (
        <span className="live-score-bar__live-badge" aria-label="Live match">
          LIVE
        </span>
      ) : null}
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
  showLive,
  eventHighlight,
  children,
}: {
  showLive?: boolean;
  eventHighlight?: EventHighlight;
  children: ReactNode;
}) {
  return (
    <LiveScoreBarShell showLive={showLive} eventHighlight={eventHighlight}>
      {children}
    </LiveScoreBarShell>
  );
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
            <span className="live-score-bar__score">—</span>
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
          <TeamPanel team={view.battingTeam} side="bat" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <CenterPanel score="—" overs="—" footer={view.ticker} />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <TeamPanel team={view.bowlingTeam} side="bowl" />
        </div>
      </BarLayout>
    );
  }

  if (view.kind === "inningsBreak") {
    return (
      <BarLayout showLive>
        <div className="live-score-bar" role="status">
          <TeamPanel team={view.battingTeam} side="bat" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">INNINGS BREAK</span>
          </div>
          <CenterPanel
            score={`${view.innings1Runs}-${view.innings1Wickets}`}
            overs={`${view.innings1Overs} OV`}
            footer={view.ticker}
          />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">—</span>
          </div>
          <TeamPanel team={view.bowlingTeam} side="bowl" />
        </div>
      </BarLayout>
    );
  }

  if (view.kind === "complete") {
    return (
      <BarLayout>
        <div className="live-score-bar live-score-bar--complete" role="status">
          <TeamPanel team={view.matchState.team1} side="bat" />
          <div className="live-score-bar__panel live-score-bar__panel--bat">
            <span className="live-score-bar__placeholder">
              {view.innings1Runs}-{view.innings1Wickets}
            </span>
          </div>
          <CenterPanel
            score={`${view.innings2Runs}-${view.innings2Wickets}`}
            overs="FT"
            footer={view.ticker}
          />
          <div className="live-score-bar__panel live-score-bar__panel--bowl">
            <span className="live-score-bar__placeholder">
              {view.innings2Runs}-{view.innings2Wickets}
            </span>
          </div>
          <TeamPanel team={view.matchState.team2} side="bowl" />
        </div>
      </BarLayout>
    );
  }

  return (
    <BarLayout showLive eventHighlight={eventHighlight}>
      <div
        className={cn(
          "live-score-bar",
          eventHighlight?.isActive && "live-score-bar--event-dimmed"
        )}
        role="status"
        aria-live="polite"
      >
        <TeamPanel team={view.battingTeam} side="bat" />
        <BattersPanel batters={view.batters} />
        <CenterPanel
          score={`${view.currentRuns}-${view.currentWickets}`}
          overs={view.currentOvers}
          footer={
            <RotatingContext
              items={buildContextItems(
                view.chaseInfo,
                view.currentRunRate,
                view.currentOvers
              )}
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
        <TeamPanel team={view.bowlingTeam} side="bowl" />
      </div>
    </BarLayout>
  );
}
