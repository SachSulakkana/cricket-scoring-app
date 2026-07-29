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
type TeamInfo = { name: string; logoUrl?: string };

function formatPlayerShort(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}.${parts[parts.length - 1]}`;
  }
  return name;
}

function TeamLogo({
  team,
  side,
}: {
  team: TeamInfo;
  side: "left" | "right";
}) {
  const abbrev = teamAbbrev(team.name);

  return (
    <div
      className={cn(
        "live-score-bar__logo",
        side === "left"
          ? "live-score-bar__logo--left"
          : "live-score-bar__logo--right"
      )}
      title={team.name}
    >
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={98}
          height={98}
          className="live-score-bar__logo-img"
          unoptimized
        />
      ) : (
        <span className="live-score-bar__logo-fallback">{abbrev}</span>
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
              {formatPlayerShort(batter.name)}
              {batter.isStriker ? (
                <span className="live-score-bar__strike" aria-label="On strike">
                  ›
                </span>
              ) : null}
            </span>
            <span className="live-score-bar__batter-score">
              <span className="live-score-bar__batter-runs">{batter.runs}</span>
              <span className="live-score-bar__batter-balls">{batter.balls}</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}

const CONTEXT_RR_MS = 8000;
const CONTEXT_MATCHUP_MS = 6000;

type ContextSlide = {
  text: string;
  durationMs: number;
};

function buildContextItems(
  chaseInfo: LiveChaseInfo | null,
  currentRunRate: string,
  team1Name: string,
  team2Name: string
): ContextSlide[] {
  const matchup: ContextSlide = {
    text: `${team1Name} vs ${team2Name}`,
    durationMs: CONTEXT_MATCHUP_MS,
  };

  if (chaseInfo) {
    return [
      {
        text: `RUN RATE ${chaseInfo.currentRunRate}`,
        durationMs: CONTEXT_RR_MS,
      },
      {
        text: `NEED ${chaseInfo.runsNeeded} FROM ${chaseInfo.oversRemaining} OV`,
        durationMs: CONTEXT_RR_MS,
      },
      matchup,
    ];
  }

  return [
    {
      text: `RUN RATE ${currentRunRate}`,
      durationMs: CONTEXT_RR_MS,
    },
    matchup,
  ];
}

function RotatingContext({ items }: { items: ContextSlide[] }) {
  const durations = items.map((item) => item.durationMs);
  const index = useRotatingIndex(items.length, durations);
  const text = items[index]?.text ?? items[0]?.text ?? "";

  return (
    <span key={index} className="live-score-bar__center-footer-text">
      {text}
    </span>
  );
}

function formatOversValue(overs: string): string {
  if (overs === "FT" || overs === "—") return overs;
  return overs.replace(/\s*(OV|OVERS?)$/i, "").trim() || overs;
}

function CenterPanel({
  battingAbbrev,
  bowlingAbbrev,
  score,
  overs,
  footer,
  solo = false,
}: {
  battingAbbrev?: string;
  bowlingAbbrev?: string;
  score: string;
  overs: string;
  footer: ReactNode;
  solo?: boolean;
}) {
  const matchup =
    battingAbbrev && bowlingAbbrev
      ? `${battingAbbrev} v ${bowlingAbbrev}`
      : null;

  return (
    <div
      className={cn(
        "live-score-bar__center",
        solo && "live-score-bar__center--solo"
      )}
    >
      <div className="live-score-bar__center-main">
        <span className="live-score-bar__matchup">{matchup}</span>
        <span className="live-score-bar__score">{score}</span>
        <span className="live-score-bar__overs">{formatOversValue(overs)}</span>
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
        <span className="live-score-bar__bowler-name">
          {formatPlayerShort(name)}
        </span>
        <span className="live-score-bar__bowler-figures">
          {wickets}-{runs}
        </span>
        <span className="live-score-bar__bowler-overs">{overs}</span>
      </div>
      <div className="live-score-bar__over-row">
        <span className="live-score-bar__over-label">THIS OVER</span>
        <div className="live-score-bar__balls" aria-label="Current over">
          {overBalls.map((ball) =>
            ball.variant === "pending" ? null : (
              <span
                key={ball.id}
                data-variant={ball.variant}
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
    </div>
  );
}

function ScoreBarFrame({
  leftTeam,
  rightTeam,
  eventHighlight,
  dimmed = false,
  children,
}: {
  leftTeam: TeamInfo;
  rightTeam: TeamInfo;
  eventHighlight?: EventHighlight;
  dimmed?: boolean;
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
      <div className="live-score-bar-frame">
        <TeamLogo team={leftTeam} side="left" />
        <div
          className={cn(
            "live-score-bar",
            dimmed && "live-score-bar--event-dimmed"
          )}
          role="status"
          aria-live="polite"
        >
          {children}
        </div>
        <TeamLogo team={rightTeam} side="right" />
      </div>
    </div>
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
        <CenterPanel
          score="—"
          overs="—"
          footer={view.kind === "empty" ? view.message : "NO LIVE MATCH"}
          solo
        />
      </div>
    );
  }

  const battingAbbrev = teamAbbrev(view.battingTeam.name);
  const bowlingAbbrev = teamAbbrev(view.bowlingTeam.name);

  if (view.kind === "waiting") {
    return (
      <ScoreBarFrame
        leftTeam={view.battingTeam}
        rightTeam={view.bowlingTeam}
      >
        <div className="live-score-bar__panel live-score-bar__panel--bat">
          <span className="live-score-bar__placeholder">—</span>
        </div>
        <CenterPanel
          battingAbbrev={battingAbbrev}
          bowlingAbbrev={bowlingAbbrev}
          score="—"
          overs="—"
          footer={view.ticker}
        />
        <div className="live-score-bar__panel live-score-bar__panel--bowl">
          <span className="live-score-bar__placeholder">—</span>
        </div>
      </ScoreBarFrame>
    );
  }

  if (view.kind === "inningsBreak") {
    return (
      <ScoreBarFrame
        leftTeam={view.battingTeam}
        rightTeam={view.bowlingTeam}
      >
        <div className="live-score-bar__panel live-score-bar__panel--bat">
          <span className="live-score-bar__placeholder">INNINGS BREAK</span>
        </div>
        <CenterPanel
          battingAbbrev={battingAbbrev}
          bowlingAbbrev={bowlingAbbrev}
          score={`${view.innings1Runs}-${view.innings1Wickets}`}
          overs={view.innings1Overs}
          footer={view.ticker}
        />
        <div className="live-score-bar__panel live-score-bar__panel--bowl">
          <span className="live-score-bar__placeholder">—</span>
        </div>
      </ScoreBarFrame>
    );
  }

  if (view.kind === "complete") {
    return (
      <ScoreBarFrame
        leftTeam={view.matchState.team1}
        rightTeam={view.matchState.team2}
      >
        <div className="live-score-bar__panel live-score-bar__panel--bat">
          <span className="live-score-bar__placeholder">
            {view.innings1Runs}-{view.innings1Wickets}
          </span>
        </div>
        <CenterPanel
          battingAbbrev={teamAbbrev(view.matchState.team1.name)}
          bowlingAbbrev={teamAbbrev(view.matchState.team2.name)}
          score={`${view.innings2Runs}-${view.innings2Wickets}`}
          overs="FT"
          footer={view.ticker}
        />
        <div className="live-score-bar__panel live-score-bar__panel--bowl">
          <span className="live-score-bar__placeholder">
            {view.innings2Runs}-{view.innings2Wickets}
          </span>
        </div>
      </ScoreBarFrame>
    );
  }

  return (
    <ScoreBarFrame
      leftTeam={view.battingTeam}
      rightTeam={view.bowlingTeam}
      eventHighlight={eventHighlight}
      dimmed={Boolean(eventHighlight?.isActive)}
    >
      <BattersPanel batters={view.batters} />
      <CenterPanel
        battingAbbrev={battingAbbrev}
        bowlingAbbrev={bowlingAbbrev}
        score={`${view.currentRuns}-${view.currentWickets}`}
        overs={view.currentOvers}
        footer={
          <RotatingContext
            items={buildContextItems(
              view.chaseInfo,
              view.currentRunRate,
              view.matchState.team1.name,
              view.matchState.team2.name
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
    </ScoreBarFrame>
  );
}
