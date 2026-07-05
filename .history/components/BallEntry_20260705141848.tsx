"use client";

import { useState, useMemo } from "react";
import { useCricket } from "@/lib/cricket-context";
import {
  countsAsBowlerWicket,
  countsAsWicket,
  DismissalType,
  ExtraType,
} from "@/lib/cricket-types";
import DismissalModal from "./DismissalModal";
import CricketLoader from "@/components/CricketLoader";
import ReplacementBatsmanModal from "./ReplacementBatsmanModal";
import BowlerSelectorModal from "./BowlerSelectorModal";

interface BallEntryProps {
  onOverComplete?: () => void;
  lockActionsUntilUndo?: boolean;
  onUnlockAfterUndo?: () => void;
}

export default function BallEntry({
  onOverComplete,
  lockActionsUntilUndo = false,
  onUnlockAfterUndo,
}: BallEntryProps) {
  const {
    matchState,
    getActiveScoringContext,
    addBall,
    setNextBowler,
    setNextBatsman,
    swapStrike,
    undoLastBall,
  } = useCricket();
  const scoring = getActiveScoringContext();
  const currentInnings = scoring?.currentInnings ?? null;

  const [showDismissalModal, setShowDismissalModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [dismissedPlayerInfo, setDismissedPlayerInfo] = useState<{
    playerId: string;
    name: string;
    isStriker: boolean;
  } | null>(null);
  const [showBowlerSelector, setShowBowlerSelector] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType | null>(null);
  const [overthrowBatRuns, setOverthrowBatRuns] = useState<number | null>(null);

  if (!currentInnings || !scoring) return null;

  const battingTeam = scoring.battingTeam;
  const bowlingTeam = scoring.bowlingTeam;
  const isSuperOver = scoring.isSuperOver;
  const ballsPerOver = scoring.config.ballsPerOver;

  const strikerInfo = battingTeam.players.find(
    (p) => p.id === currentInnings.strikerPlayerId
  );
  const nonStrikerInfo = battingTeam.players.find(
    (p) => p.id === currentInnings.nonStrikerPlayerId
  );
  const bowlerInfo = bowlingTeam.players.find(
    (p) => p.id === currentInnings.currentBowlerPlayerId
  );

  const getBatsmanRuns = (batsmanName?: string) => {
    if (!batsmanName) return 0;
    return currentInnings.balls.reduce((total, ball) => {
      if (ball.batsmanName !== batsmanName) return total;

      // For no-ball, only additional runs count to batsman (exclude penalty +1).
      const noBallRuns =
        ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
      const overthrowRuns =
        ball.extra === "overthrow" ? ball.extraRuns : 0;
      return total + ball.runs + noBallRuns + overthrowRuns;
    }, 0);
  };

  const getBowlerStats = (bowlerName?: string) => {
    if (!bowlerName) return { runsConceded: 0, wickets: 0 };

    return currentInnings.balls.reduce(
      (stats, ball) => {
        if (ball.bowlerName !== bowlerName) return stats;

        const concededFromExtra =
          ball.extra === "wide" || ball.extra === "no-ball" ? ball.extraRuns : 0;
        const isBowlerWicket = countsAsBowlerWicket(ball.dismissal);

        const overthrowConceded =
          ball.extra === "overthrow" ? ball.extraRuns : 0;

        return {
          runsConceded:
            stats.runsConceded + ball.runs + concededFromExtra + overthrowConceded,
          wickets: stats.wickets + (isBowlerWicket ? 1 : 0),
        };
      },
      { runsConceded: 0, wickets: 0 }
    );
  };

  const strikerRuns = getBatsmanRuns(strikerInfo?.name);
  const nonStrikerRuns = getBatsmanRuns(nonStrikerInfo?.name);
  const bowlerStats = getBowlerStats(bowlerInfo?.name);

  // Get available batsmen for replacement (excluding current batsmen)
  const availableBatsmen = useMemo(() => {
    const currentBatsmenIds = [
      currentInnings.strikerPlayerId,
      currentInnings.nonStrikerPlayerId,
    ];

    const dismissedPlayerNames = new Set(
      currentInnings.balls
        .filter((ball) => countsAsWicket(ball.dismissal) && ball.dismissedPlayer)
        .map((ball) => ball.dismissedPlayer as string)
    );

    return battingTeam.players.filter(
      (p) =>
        !currentBatsmenIds.includes(p.id) && !dismissedPlayerNames.has(p.name)
    );
  }, [battingTeam, currentInnings]);

  const currentBallNumber = useMemo(() => {
    return currentInnings.balls.length + 1;
  }, [currentInnings.balls.length]);

  const currentLegalBallCount = useMemo(() => {
    return currentInnings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
  }, [currentInnings.balls]);

  const currentOver = useMemo(() => {
    return Math.floor(currentLegalBallCount / ballsPerOver);
  }, [currentLegalBallCount, ballsPerOver]);

  const ballsInCurrentOver = useMemo(() => {
    return (currentLegalBallCount % ballsPerOver) + 1;
  }, [currentLegalBallCount, ballsPerOver]);

  const overJustFinished = useMemo(() => {
    return (
      currentLegalBallCount > 0 &&
      currentLegalBallCount % ballsPerOver === 0
    );
  }, [currentLegalBallCount, ballsPerOver]);

  const isInningsComplete = useMemo(() => {
    const legalBalls = currentInnings.balls.filter(
      (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
    ).length;
    const wickets = currentInnings.balls.filter((ball) => countsAsWicket(ball.dismissal)).length;
    const maxWickets = scoring.maxWickets;
    const maxLegalBalls = scoring.config.totalOvers * scoring.config.ballsPerOver;

    const inningsRuns = currentInnings.balls.reduce((total, ball) => {
      return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
    }, 0);
    const firstInningsRuns =
      scoring.currentInningsNumber === 2 && scoring.innings1
        ? scoring.innings1.balls.reduce((total, ball) => {
            return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
          }, 0)
        : 0;
    const isTargetReached =
      scoring.currentInningsNumber === 2 && inningsRuns > firstInningsRuns;

    return legalBalls >= maxLegalBalls || wickets >= maxWickets || isTargetReached;
  }, [currentInnings.balls, scoring]);

  const scoringLocked = lockActionsUntilUndo || isInningsComplete;

  const recordBall = (runs: number, extra: string, extraRuns: number = 0) => {
    if (scoringLocked) return;
    if (!strikerInfo || !bowlerInfo) return;

    const newBall = {
      id: `${currentInnings.teamId}-${currentBallNumber}`,
      runs,
      extra: extra as ExtraType,
      extraRuns,
      dismissal: "none" as DismissalType,
      dismissedPlayer: undefined,
      bowlerName: bowlerInfo.name,
      batsmanName: strikerInfo.name,
      ballNumber: currentBallNumber,
      overNumber: currentOver,
    };

    addBall(newBall);

    // Auto-change striker/non-striker based on delivery outcome.
    // For extras, rotate strike using extra runs scored on that ball.
    const strikeRotationRuns =
      extra === "none"
        ? runs
        : extra === "overthrow"
          ? runs + extraRuns
          : extraRuns;
    if (strikeRotationRuns % 2 === 1) {
      // Odd runs: change strike
      swapStrike();
    }
    // Even runs (0, 2, 4, 6) keep same strike

    // Only legal balls advance over progression.
    const isLegalBall = extra !== "wide" && extra !== "no-ball";
    const nextLegalBallCount = isLegalBall
      ? currentLegalBallCount + 1
      : currentLegalBallCount;
    const overJustCompleted =
      isLegalBall && nextLegalBallCount % ballsPerOver === 0;

    if (overJustCompleted && !isSuperOver) {
      // Over just completed, auto-change striker for next over
      swapStrike();
      
      // Show bowler selector (mandatory)
      setShowBowlerSelector(true);
    } else if (overJustCompleted && isSuperOver) {
      swapStrike();
    }
  };

  const handleWicket = () => {
    if (scoringLocked) return;
    if (!strikerInfo) return;
    setDismissedPlayerInfo({
      playerId: strikerInfo.id,
      name: strikerInfo.name,
      isStriker: true,
    });
    setShowDismissalModal(true);
  };

  const handleDismissalConfirm = (
    dismissalType: DismissalType,
    dismissedPlayerId: string,
    fielderId?: string
  ) => {
    if (!strikerInfo || !bowlerInfo) return;

    const isStrikerDismissed = strikerInfo.id === dismissedPlayerId;
    const dismissedPlayer = battingTeam.players.find(
      (p) => p.id === dismissedPlayerId
    );
    const fielder = fielderId
      ? bowlingTeam.players.find((p) => p.id === fielderId)
      : undefined;

    const newBall = {
      id: `${currentInnings.teamId}-${currentBallNumber}`,
      runs: 0,
      extra: "none" as const,
      extraRuns: 0,
      dismissal: dismissalType,
      dismissedPlayer: dismissedPlayer?.name,
      fielderName: fielder?.name,
      bowlerName: bowlerInfo.name,
      batsmanName: strikerInfo.name,
      ballNumber: currentBallNumber,
      overNumber: currentOver,
    };

    addBall(newBall);
    setShowDismissalModal(false);
    setDismissedPlayerInfo({
      playerId: dismissedPlayerId,
      name: dismissedPlayer?.name || "",
      isStriker: isStrikerDismissed,
    });
    setShowReplacementModal(true);
  };

  const handleReplacementConfirm = (playerId: string) => {
    if (!dismissedPlayerInfo) return;
    setNextBatsman(playerId, dismissedPlayerInfo.isStriker);
    setShowReplacementModal(false);
    setDismissedPlayerInfo(null);

    if (overJustFinished && !isSuperOver) {
      swapStrike();
      setShowBowlerSelector(true);
    }
  };

  const handleNextBowler = (bowlerId: string) => {
    setNextBowler(bowlerId);
    setShowBowlerSelector(false);
  };

  const handleExtraTypeClick = (extraType: ExtraType) => {
    if (scoringLocked) return;
    setOverthrowBatRuns(null);
    setPendingExtraType(extraType);
  };

  const handleOverthrowBatRunsSelect = (batRuns: number) => {
    if (scoringLocked) return;
    setOverthrowBatRuns(batRuns);
  };

  const handleOverthrowConfirm = (overthrowRuns: number) => {
    if (scoringLocked) return;
    if (overthrowBatRuns === null) return;

    recordBall(overthrowBatRuns, "overthrow", overthrowRuns);
    setPendingExtraType(null);
    setOverthrowBatRuns(null);
  };

  const handleExtraRunsSelect = (selectedRuns: number) => {
    if (scoringLocked) return;
    if (!pendingExtraType) return;

    // Wide/No-ball include 1 penalty run plus selected additional runs.
    const totalExtraRuns =
      pendingExtraType === "wide" || pendingExtraType === "no-ball"
        ? selectedRuns + 1
        : selectedRuns;

    recordBall(0, pendingExtraType, totalExtraRuns);
    setPendingExtraType(null);
  };

  const extraRunOptions = useMemo(() => {
    if (pendingExtraType === "bye" || pendingExtraType === "leg-bye") {
      return [1, 2, 3, 4, 5, 6];
    }
    if (pendingExtraType === "overthrow") {
      return [1, 2, 3, 4, 5, 6];
    }
    return [0, 1, 2, 3, 4, 5, 6];
  }, [pendingExtraType]);

  if (!strikerInfo || !bowlerInfo) {
    return (
      <div className="cricket-broadcast-card p-8 flex items-center justify-center min-h-[12rem]">
        <CricketLoader size="md" label="Setting up the crease…" />
      </div>
    );
  }

  return (
    <>
      <div className="cricket-broadcast-card overflow-hidden">
        <div className="cricket-score-strip !border-b-0">
          <p className="cricket-display text-sm font-semibold text-[var(--cricket-cream)]">
            {isSuperOver
              ? `Ball ${Math.min(currentLegalBallCount + 1, ballsPerOver)} of ${ballsPerOver}`
              : `Over ${currentOver + 1}.${ballsInCurrentOver}`}
          </p>
          <span className="cricket-eyebrow mb-0">Ball {currentBallNumber}</span>
        </div>
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="cricket-striker-panel">
              <p className="cricket-panel-label text-[var(--cricket-score)]">
                Striker
              </p>
              <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
                {strikerInfo.name}{" "}
                <span className="text-[var(--cricket-gold)]">({strikerRuns})</span>
              </p>
            </div>
            <div className="cricket-non-striker-panel">
              <p className="cricket-panel-label text-[oklch(0.65_0.08_300)]">
                Non-striker
              </p>
              <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
                {nonStrikerInfo
                  ? `${nonStrikerInfo.name} (${nonStrikerRuns})`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="cricket-bowler-panel">
            <p className="cricket-panel-label text-[var(--cricket-gold)]">Bowler</p>
            <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
              {bowlerInfo.name}{" "}
              <span className="text-[oklch(0.7_0.08_75)]">
                ({bowlerStats.runsConceded}-{bowlerStats.wickets})
              </span>
            </p>
          </div>

          <div>
            <p className="cricket-eyebrow mb-2.5">Runs & extras</p>
            <div className="cricket-run-grid mb-2">
              {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => recordBall(runs, "none")}
                  disabled={scoringLocked}
                  className="cricket-run-btn btn-12--compact"
                >
                  <span className="btn-12__label">{runs}</span>
                </button>
              ))}
            </div>
            <div className="cricket-run-grid cricket-run-grid--extras">
              <button
                type="button"
                onClick={() => handleExtraTypeClick("wide")}
                disabled={scoringLocked}
                className="cricket-run-btn btn-12--compact !text-xs"
              >
                <span className="btn-12__label">Wide</span>
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("no-ball")}
                disabled={scoringLocked}
                className="cricket-run-btn btn-12--compact !text-xs"
              >
                <span className="btn-12__label">No ball</span>
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("bye")}
                disabled={scoringLocked}
                className="cricket-run-btn btn-12--compact !text-xs"
              >
                <span className="btn-12__label">Bye</span>
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("leg-bye")}
                disabled={scoringLocked}
                className="cricket-run-btn btn-12--compact !text-xs"
              >
                <span className="btn-12__label">Leg bye</span>
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("overthrow")}
                disabled={scoringLocked}
                className="cricket-run-btn btn-12--compact !text-xs"
              >
                <span className="btn-12__label">Overthrow</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWicket}
            disabled={scoringLocked}
            className="btn-12 btn-12--destructive btn-12--lg btn-12--full cricket-display tracking-wider disabled:opacity-50"
          >
            <span className="btn-12__label">Wicket</span>
          </button>

          {currentInnings.balls.length > 0 && (
            <button
              type="button"
              onClick={() => {
                undoLastBall();
                if (lockActionsUntilUndo) {
                  onUnlockAfterUndo?.();
                }
              }}
              className="btn-12 btn-12--outline btn-12--md btn-12--full"
            >
              <span className="btn-12__label">Undo last ball</span>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDismissalModal && (
        <DismissalModal
          batsmen={[strikerInfo, nonStrikerInfo!].filter(Boolean)}
          fielders={bowlingTeam.players}
          onSubmit={handleDismissalConfirm}
          onCancel={() => setShowDismissalModal(false)}
        />
      )}

      {showReplacementModal && dismissedPlayerInfo && (
        <ReplacementBatsmanModal
          availableBatsmen={availableBatsmen}
          dismissedPlayerName={dismissedPlayerInfo.name}
          isStriker={dismissedPlayerInfo.isStriker}
          onSubmit={handleReplacementConfirm}
        />
      )}

      {showBowlerSelector && !isSuperOver && (
        <BowlerSelectorModal
          players={bowlingTeam.players}
          disabledPlayerId={currentInnings.currentBowlerPlayerId}
          onSubmit={handleNextBowler}
        />
      )}

      {pendingExtraType && (
        <div className="cricket-modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="cricket-modal w-full max-w-md p-5 space-y-4">
            <p className="cricket-display text-center text-lg font-semibold text-[var(--cricket-cream)]">
              {pendingExtraType === "overthrow"
                ? overthrowBatRuns === null
                  ? "Overthrow — runs off the bat?"
                  : `Overthrow — additional runs?${overthrowBatRuns > 0 ? ` (${overthrowBatRuns} off bat)` : ""}`
                : `${pendingExtraType.toUpperCase()} — additional runs?`}
            </p>
            <div className="cricket-run-grid">
              {(pendingExtraType === "overthrow" && overthrowBatRuns === null
                ? [0, 1, 2, 3, 4, 5, 6]
                : extraRunOptions
              ).map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => {
                    if (pendingExtraType === "overthrow") {
                      if (overthrowBatRuns === null) {
                        handleOverthrowBatRunsSelect(runs);
                      } else {
                        handleOverthrowConfirm(runs);
                      }
                    } else {
                      handleExtraRunsSelect(runs);
                    }
                  }}
                  className="cricket-run-btn btn-12--compact"
                >
                  <span className="btn-12__label">{runs}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-12 btn-12--outline btn-12--md w-full"
              onClick={() => {
                if (pendingExtraType === "overthrow" && overthrowBatRuns !== null) {
                  setOverthrowBatRuns(null);
                  return;
                }
                setPendingExtraType(null);
                setOverthrowBatRuns(null);
              }}
            >
              <span className="btn-12__label">
                {pendingExtraType === "overthrow" && overthrowBatRuns !== null
                  ? "Back"
                  : "Cancel"}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

