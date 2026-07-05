"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CricketMatchHeader,
  CricketPage,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import { useCricket } from "@/lib/cricket-context";
import { countsAsWicket } from "@/lib/cricket-types";
import { isInningsComplete } from "@/lib/match-result";
import {
  isRegularInningsTied,
  isSuperOverInningsTied,
} from "@/lib/super-over";
import { cn } from "@/lib/utils";
import { getSuperOverInningsForTeam } from "@/lib/super-over";
import BallEntry from "./BallEntry";
import Scoresheet from "./Scoresheet";
import BatsmanSelector from "./BatsmanSelector";
import BowlerSelector from "./BowlerSelector";
import ConfirmActionDialog from "./ConfirmActionDialog";

interface ScoringBoardProps {
  onMatchEnd: () => void;
  onMatchTied?: () => void;
  onViewScorecard: () => void;
  onInnings1AutoEnd: () => void;
  onSuperOverInnings1End?: () => void;
  lockActionsUntilUndo?: boolean;
  onUnlockAfterUndo?: () => void;
  onEndDueToRain?: () => void;
  banner?: ReactNode;
}

export default function ScoringBoard({
  onMatchEnd,
  onMatchTied,
  onViewScorecard,
  onInnings1AutoEnd,
  onSuperOverInnings1End,
  lockActionsUntilUndo = false,
  onUnlockAfterUndo,
  onEndDueToRain,
  banner,
}: ScoringBoardProps) {
  const { matchState, getActiveScoringContext, setOpeningBatsmen, setOpeningBowler } =
    useCricket();
  const scoring = getActiveScoringContext();

  const [step, setStep] = useState<"batsmen" | "bowler" | "scoring">("batsmen");
  const [hasAutoEnded, setHasAutoEnded] = useState(false);
  const [showRainConfirm, setShowRainConfirm] = useState(false);

  if (!matchState.matchStarted || !scoring) return null;

  const { currentInnings, battingTeam, bowlingTeam, isSuperOver } = scoring;

  const getInningsRuns = (innings: typeof scoring.innings1) => {
    if (!innings) return 0;
    return innings.balls.reduce((total, ball) => {
      return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    }, 0);
  };

  const getLegalBalls = (innings: typeof scoring.innings1) => {
    if (!innings) return 0;
    return innings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
  };

  const getOversTextFromBalls = (balls: number) => {
    return `${Math.floor(balls / scoring.config.ballsPerOver)}.${balls % scoring.config.ballsPerOver}`;
  };

  const handleBatsmenSubmit = (strikerId: string, nonStrikerId: string) => {
    setOpeningBatsmen(strikerId, nonStrikerId);
    setStep("bowler");
  };

  const handleBowlerSubmit = (bowlerId: string) => {
    setOpeningBowler(bowlerId);
    setStep("scoring");
  };

  useEffect(() => {
    setHasAutoEnded(false);
    setStep(
      currentInnings.strikerPlayerId && currentInnings.nonStrikerPlayerId
        ? currentInnings.currentBowlerPlayerId
          ? "scoring"
          : "bowler"
        : "batsmen"
    );
  }, [
    scoring.currentInningsNumber,
    isSuperOver,
    currentInnings.strikerPlayerId,
    currentInnings.nonStrikerPlayerId,
    currentInnings.currentBowlerPlayerId,
  ]);

  useEffect(() => {
    if (!currentInnings || lockActionsUntilUndo) return;

    const inningsComplete = isInningsComplete(
      matchState,
      currentInnings,
      scoring.maxWickets
    );

    if (inningsComplete) {
      if (!hasAutoEnded) {
        setHasAutoEnded(true);
        if (isSuperOver) {
          if (scoring.currentInningsNumber === 1) {
            onSuperOverInnings1End?.();
          } else if (isSuperOverInningsTied(matchState)) {
            onMatchTied?.();
          } else {
            onMatchEnd();
          }
        } else if (scoring.currentInningsNumber === 1) {
          onInnings1AutoEnd();
        } else if (isRegularInningsTied(matchState)) {
          onMatchTied?.();
        } else {
          onMatchEnd();
        }
      }
      return;
    }

    if (hasAutoEnded) {
      setHasAutoEnded(false);
    }
  }, [
    currentInnings,
    matchState,
    scoring.currentInningsNumber,
    scoring.maxWickets,
    hasAutoEnded,
    isSuperOver,
    lockActionsUntilUndo,
    onInnings1AutoEnd,
    onSuperOverInnings1End,
    onMatchEnd,
    onMatchTied,
  ]);

  const team1PanelInnings = isSuperOver
    ? matchState.superOver
      ? getSuperOverInningsForTeam(matchState.superOver, scoring.team1.id)
      : null
    : scoring.innings1;
  const team2PanelInnings = isSuperOver
    ? matchState.superOver
      ? getSuperOverInningsForTeam(matchState.superOver, scoring.team2.id)
      : null
    : scoring.innings2;

  const matchHeaderProps = isSuperOver
    ? { ballCount: scoring.config.ballsPerOver }
    : { overs: scoring.config.totalOvers };

  if (step === "batsmen" && !currentInnings.strikerPlayerId) {
    return (
      <CricketPage>
        <div className="space-y-6">
          {isSuperOver ? (
            <div className="rounded-md border border-[oklch(0.55_0.12_82/0.45)] bg-[oklch(0.28_0.08_75/0.2)] px-4 py-3 text-center">
              <p className="cricket-display text-sm font-bold uppercase tracking-widest text-[var(--cricket-gold)]">
                Super over · {scoring.config.ballsPerOver}{" "}
                {scoring.config.ballsPerOver === 1 ? "ball" : "balls"}
              </p>
              <p className="mt-1 text-sm text-[oklch(0.65_0.03_255)]">
                {battingTeam.name} batting
              </p>
            </div>
          ) : null}
          <CricketMatchHeader
            {...matchHeaderProps}
            innings={scoring.currentInningsNumber}
            teamName={battingTeam.name}
          />
          <BatsmanSelector
            players={battingTeam.players}
            onSubmit={handleBatsmenSubmit}
          />
        </div>
      </CricketPage>
    );
  }

  if (step === "bowler" && !currentInnings.currentBowlerPlayerId) {
    return (
      <CricketPage>
        <div className="space-y-6">
          {isSuperOver ? (
            <div className="rounded-md border border-[oklch(0.55_0.12_82/0.45)] bg-[oklch(0.28_0.08_75/0.2)] px-4 py-3 text-center">
              <p className="cricket-display text-sm font-bold uppercase tracking-widest text-[var(--cricket-gold)]">
                Super over · {scoring.config.ballsPerOver}{" "}
                {scoring.config.ballsPerOver === 1 ? "ball" : "balls"}
              </p>
            </div>
          ) : null}
          <CricketMatchHeader
            {...matchHeaderProps}
            innings={scoring.currentInningsNumber}
            teamName={battingTeam.name}
          />
          <BowlerSelector
            players={bowlingTeam.players}
            onSubmit={handleBowlerSubmit}
            isOpening={true}
            singleBowlerForInnings={isSuperOver}
          />
        </div>
      </CricketPage>
    );
  }

  return (
    <CricketPage wide className="cricket-scoring-page">
      <div className="space-y-6">
        {banner}
        {isSuperOver ? (
          <div className="rounded-md border border-[oklch(0.55_0.12_82/0.45)] bg-[oklch(0.28_0.08_75/0.2)] px-4 py-3 text-center">
            <p className="cricket-display text-sm font-bold uppercase tracking-widest text-[var(--cricket-gold)]">
              Super over · {scoring.config.ballsPerOver}{" "}
              {scoring.config.ballsPerOver === 1 ? "ball" : "balls"}
            </p>
          </div>
        ) : null}
        <div className="cricket-score-sticky">
          <CricketMatchHeader
            {...matchHeaderProps}
            innings={scoring.currentInningsNumber}
            teamName={currentInnings.teamName}
          >
            <div className="flex justify-center pt-1">
              <div className="cricket-tab-bar">
                <span className="cricket-tab cricket-tab--active">Live</span>
                <button
                  type="button"
                  onClick={onViewScorecard}
                  disabled={lockActionsUntilUndo}
                  className="cricket-tab disabled:opacity-40"
                >
                  Scorecard
                </button>
              </div>
            </div>
            {lockActionsUntilUndo && (
              <p className="text-[oklch(0.75_0.12_75)] text-sm mt-2 font-medium">
                Undo last ball to continue scoring.
              </p>
            )}
          </CricketMatchHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={cn(
                "cricket-team-panel",
                battingTeam.id === scoring.team1.id && "cricket-team-panel--batting"
              )}
            >
              <p className="cricket-panel-label text-[oklch(0.65_0.08_300)] mb-1">
                {scoring.team1.name}
                {isSuperOver ? " (SO)" : ""}
              </p>
              {team1PanelInnings && (
                <CricketScoreDisplay size="lg">
                  {(() => {
                    let runs = 0;
                    team1PanelInnings.balls.forEach((b) => {
                      runs += b.runs + (b.extra !== "none" ? b.extraRuns : 0);
                    });
                    return `${runs}/${team1PanelInnings.balls.filter((b) => countsAsWicket(b.dismissal)).length}`;
                  })()}
                </CricketScoreDisplay>
              )}
            </div>

            <div
              className={cn(
                "cricket-team-panel",
                battingTeam.id === scoring.team2.id && "cricket-team-panel--batting"
              )}
            >
              <p className="cricket-panel-label text-[oklch(0.72_0.1_75)] mb-1">
                {scoring.team2.name}
                {isSuperOver ? " (SO)" : ""}
              </p>
              {team2PanelInnings && (
                <CricketScoreDisplay size="lg">
                  {(() => {
                    let runs = 0;
                    team2PanelInnings.balls.forEach((b) => {
                      runs += b.runs + (b.extra !== "none" ? b.extraRuns : 0);
                    });
                    return `${runs}/${team2PanelInnings.balls.filter((b) => countsAsWicket(b.dismissal)).length}`;
                  })()}
                </CricketScoreDisplay>
              )}
            </div>
          </div>

          {!isSuperOver &&
            scoring.currentInningsNumber === 2 &&
            scoring.innings1 &&
            scoring.innings2 && (
              <div className="cricket-chase-banner">
                {(() => {
                  const target = getInningsRuns(scoring.innings1) + 1;
                  const runsNeeded = Math.max(
                    target - getInningsRuns(scoring.innings2),
                    0
                  );
                  const totalLegalBalls =
                    scoring.config.totalOvers * scoring.config.ballsPerOver;
                  const ballsRemaining = Math.max(
                    totalLegalBalls - getLegalBalls(scoring.innings2),
                    0
                  );

                  return (
                    <>
                      {scoring.team2.name} needs {runsNeeded} runs in{" "}
                      {getOversTextFromBalls(ballsRemaining)} overs
                    </>
                  );
                })()}
              </div>
            )}

          {isSuperOver &&
            scoring.currentInningsNumber === 2 &&
            scoring.innings1 &&
            scoring.innings2 && (
              <div className="cricket-chase-banner">
                {battingTeam.name} needs{" "}
                {Math.max(
                  getInningsRuns(scoring.innings1) + 1 -
                    getInningsRuns(scoring.innings2),
                  0
                )}{" "}
                runs in{" "}
                {Math.max(
                  scoring.config.ballsPerOver - getLegalBalls(scoring.innings2),
                  0
                )}{" "}
                {Math.max(
                  scoring.config.ballsPerOver - getLegalBalls(scoring.innings2),
                  0
                ) === 1
                  ? "ball"
                  : "balls"}
              </div>
            )}
        </div>

        <div className="cricket-scoring-layout grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 min-w-0">
            <BallEntry
              onOverComplete={() => {}}
              lockActionsUntilUndo={lockActionsUntilUndo}
              onUnlockAfterUndo={onUnlockAfterUndo}
            />
          </div>

          <div className="min-w-0">
            <Scoresheet innings={currentInnings} />
          </div>
        </div>

        {onEndDueToRain && !isSuperOver && (
          <button
            type="button"
            onClick={() => setShowRainConfirm(true)}
            disabled={lockActionsUntilUndo}
            className="w-full rounded-md border border-[oklch(0.45_0.08_240)] bg-[oklch(0.18_0.05_240/0.45)] py-3 text-sm font-bold text-[oklch(0.82_0.06_240)] hover:brightness-110 disabled:opacity-50"
          >
            End match due to rain
          </button>
        )}
      </div>

      <ConfirmActionDialog
        open={showRainConfirm}
        onOpenChange={setShowRainConfirm}
        title="End match due to rain?"
        description="The match will be marked as abandoned. No points will be added to the tournament table."
        confirmLabel="End match"
        cancelLabel="Keep playing"
        variant="destructive"
        onConfirm={() => {
          setShowRainConfirm(false);
          onEndDueToRain?.();
        }}
      />
    </CricketPage>
  );
}
