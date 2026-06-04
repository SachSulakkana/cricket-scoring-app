"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CricketMatchHeader,
  CricketPage,
  CricketScoreDisplay,
} from "@/components/cricket-shell";
import { useCricket } from "@/lib/cricket-context";
import { cn } from "@/lib/utils";
import BallEntry from "./BallEntry";
import Scoresheet from "./Scoresheet";
import BatsmanSelector from "./BatsmanSelector";
import BowlerSelector from "./BowlerSelector";

interface ScoringBoardProps {
  onMatchEnd: () => void;
  onViewScorecard: () => void;
  onInnings1AutoEnd: () => void;
  lockActionsUntilUndo?: boolean;
  onUnlockAfterUndo?: () => void;
  /** Optional content above the score header (e.g. flow stepper). */
  banner?: ReactNode;
}

export default function ScoringBoard({
  onMatchEnd,
  onViewScorecard,
  onInnings1AutoEnd,
  lockActionsUntilUndo = false,
  onUnlockAfterUndo,
  banner,
}: ScoringBoardProps) {
  const { matchState, setOpeningBatsmen, setOpeningBowler } = useCricket();
  const currentInnings =
    matchState.currentInnings === 1 ? matchState.innings1 : matchState.innings2;

  const [step, setStep] = useState<"batsmen" | "bowler" | "scoring">("batsmen");
  const [hasAutoEnded, setHasAutoEnded] = useState(false);

  if (!matchState.matchStarted || !currentInnings) return null;

  const getBattingTeam = () =>
    matchState.currentInnings === 1 ? matchState.team1 : matchState.team2;

  const getBowlingTeam = () =>
    matchState.currentInnings === 1 ? matchState.team2 : matchState.team1;

  const battingTeam = getBattingTeam();
  const bowlingTeam = getBowlingTeam();

  const getInningsRuns = (innings: typeof matchState.innings1) => {
    if (!innings) return 0;
    return innings.balls.reduce((total, ball) => {
      return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    }, 0);
  };

  const getLegalBalls = (innings: typeof matchState.innings1) => {
    if (!innings) return 0;
    return innings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
  };

  const getOversTextFromBalls = (balls: number) => {
    const ballsPerOver = matchState.config?.ballsPerOver || 6;
    return `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
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
  }, [matchState.currentInnings]);

  useEffect(() => {
    if (!currentInnings || !matchState.config || lockActionsUntilUndo) return;

    const legalBalls = currentInnings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
    const wickets = currentInnings.balls.filter((ball) => ball.dismissal !== "none").length;
    const maxWickets = Math.max(getBattingTeam().players.length - 1, 0);
    const maxLegalBalls = matchState.config.totalOvers * matchState.config.ballsPerOver;
    const innings1Runs = getInningsRuns(matchState.innings1);
    const innings2Runs = getInningsRuns(matchState.innings2);

    const isOversFinished = legalBalls >= maxLegalBalls;
    const isAllOut = wickets >= maxWickets;
    const isTargetReached = matchState.currentInnings === 2 && innings2Runs > innings1Runs;

    const isInningsEnd = isOversFinished || isAllOut || isTargetReached;

    if (isInningsEnd) {
      if (!hasAutoEnded) {
        setHasAutoEnded(true);
        if (matchState.currentInnings === 1) {
          onInnings1AutoEnd();
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
    matchState.config,
    matchState.currentInnings,
    hasAutoEnded,
    lockActionsUntilUndo,
    onInnings1AutoEnd,
    onMatchEnd,
  ]);

  // Show batsmen selection
  if (step === "batsmen" && !currentInnings.strikerPlayerId) {
    return (
      <CricketPage>
        <div className="space-y-6">
          <CricketMatchHeader
            overs={matchState.config?.totalOvers ?? "—"}
            innings={matchState.currentInnings}
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

  // Show bowler selection
  if (step === "bowler" && !currentInnings.currentBowlerPlayerId) {
    return (
      <CricketPage>
        <div className="space-y-6">
          <CricketMatchHeader
            overs={matchState.config?.totalOvers ?? "—"}
            innings={matchState.currentInnings}
            teamName={battingTeam.name}
          />
          <BowlerSelector
            players={bowlingTeam.players}
            onSubmit={handleBowlerSubmit}
            isOpening={true}
          />
        </div>
      </CricketPage>
    );
  }

  // Show scoring board
  return (
    <CricketPage wide className="cricket-scoring-page">
      <div className="space-y-6">
        {banner}
        <div className="cricket-score-sticky">
        <CricketMatchHeader
          overs={matchState.config?.totalOvers ?? "—"}
          innings={matchState.currentInnings}
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
              matchState.currentInnings === 1 && "cricket-team-panel--batting"
            )}
          >
            <p className="cricket-panel-label text-[oklch(0.65_0.08_300)] mb-1">
              {matchState.team1.name}
            </p>
            {matchState.innings1 && (
              <CricketScoreDisplay size="lg">
                  {(() => {
                    let runs = 0;
                    matchState.innings1.balls.forEach((b) => {
                      runs += b.runs + (b.extra !== "none" ? b.extraRuns : 0);
                    });
                    return `${runs}/${matchState.innings1.balls.filter((b) => b.dismissal !== "none").length}`;
                  })()}
              </CricketScoreDisplay>
            )}
          </div>

          <div
            className={cn(
              "cricket-team-panel",
              matchState.currentInnings === 2 && "cricket-team-panel--batting"
            )}
          >
            <p className="cricket-panel-label text-[oklch(0.72_0.1_75)] mb-1">
              {matchState.team2.name}
            </p>
            {matchState.innings2 && (
              <CricketScoreDisplay size="lg">
                  {(() => {
                    let runs = 0;
                    matchState.innings2.balls.forEach((b) => {
                      runs += b.runs + (b.extra !== "none" ? b.extraRuns : 0);
                    });
                    return `${runs}/${matchState.innings2.balls.filter((b) => b.dismissal !== "none").length}`;
                  })()}
              </CricketScoreDisplay>
            )}
          </div>
        </div>

        {matchState.currentInnings === 2 && matchState.innings1 && matchState.config && (
          <div className="cricket-chase-banner">
              {(() => {
                const target = getInningsRuns(matchState.innings1) + 1;
                const runsNeeded = Math.max(target - getInningsRuns(matchState.innings2), 0);
                const totalLegalBalls =
                  matchState.config!.totalOvers * matchState.config!.ballsPerOver;
                const ballsRemaining = Math.max(
                  totalLegalBalls - getLegalBalls(matchState.innings2),
                  0
                );

                return (
                  <>
                    {matchState.team2.name} needs {runsNeeded} runs in{" "}
                    {getOversTextFromBalls(ballsRemaining)} overs
                  </>
                );
              })()}
          </div>
        )}
        </div>

        {/* Main Content */}
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

      </div>
    </CricketPage>
  );
}
