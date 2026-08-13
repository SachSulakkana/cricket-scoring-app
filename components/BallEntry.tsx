"use client";

import { useState, useMemo, useRef, type PointerEvent } from "react";
import { GripVertical, Pencil } from "lucide-react";
import { useCricket } from "@/lib/cricket-context";
import { cn } from "@/lib/utils";
import {
  countsAsBowlerWicket,
  countsAsDelivery,
  countsAsLegalBall,
  countsAsWicket,
  DismissalType,
  ExtraType,
  strikeRotationRuns,
} from "@/lib/cricket-types";
import { getDismissalReplacementEnd, getBatsmanBalls, getBatsmanRuns } from "@/lib/spectator-live-stats";
import DismissalModal from "./DismissalModal";
import CricketLoader from "@/components/CricketLoader";
import ReplacementBatsmanModal from "./ReplacementBatsmanModal";
import BowlerSelectorModal, {
  type BowlerSelectorMode,
} from "./BowlerSelectorModal";

interface BallEntryProps {
  onOverComplete?: () => void;
  lockActionsUntilUndo?: boolean;
  onUnlockAfterUndo?: () => void;
}

type CreaseEnd = "striker" | "non-striker";

function pointInRect(rect: DOMRect | undefined, x: number, y: number) {
  if (!rect) return false;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export default function BallEntry({
  onOverComplete,
  lockActionsUntilUndo = false,
  onUnlockAfterUndo,
}: BallEntryProps) {
  const {
    getActiveScoringContext,
    addBall,
    setNextBowler,
    changeCurrentBowler,
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
  const [changeBowlerMode, setChangeBowlerMode] = useState<
    Extract<BowlerSelectorMode, "change-pre-over" | "change-mid-over"> | null
  >(null);
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType | null>(null);
  const [overthrowBatRuns, setOverthrowBatRuns] = useState<number | null>(null);
  const [pendingRunOutDismissal, setPendingRunOutDismissal] = useState<{
    dismissalType: DismissalType;
    dismissedPlayerId: string;
    fielderId?: string;
  } | null>(null);
  const [draggingBatsmanEnd, setDraggingBatsmanEnd] = useState<CreaseEnd | null>(
    null
  );
  const [batsmanDropTarget, setBatsmanDropTarget] = useState<CreaseEnd | null>(
    null
  );
  const draggingBatsmanEndRef = useRef<CreaseEnd | null>(null);
  const batsmanDropTargetRef = useRef<CreaseEnd | null>(null);
  const strikerPanelRef = useRef<HTMLDivElement>(null);
  const nonStrikerPanelRef = useRef<HTMLDivElement>(null);

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

  const strikerRuns = getBatsmanRuns(currentInnings, strikerInfo?.name);
  const nonStrikerRuns = getBatsmanRuns(currentInnings, nonStrikerInfo?.name);
  const strikerBalls = getBatsmanBalls(currentInnings, strikerInfo?.name);
  const nonStrikerBalls = getBatsmanBalls(currentInnings, nonStrikerInfo?.name);
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
    return currentInnings.balls.filter((ball) => countsAsLegalBall(ball))
      .length;
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
    const legalBalls = currentInnings.balls.filter((ball) =>
      countsAsLegalBall(ball)
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
  const canSwapBatsmen = Boolean(nonStrikerInfo) && !scoringLocked;

  const hitBatsmanEnd = (x: number, y: number): CreaseEnd | null => {
    if (pointInRect(strikerPanelRef.current?.getBoundingClientRect(), x, y)) {
      return "striker";
    }
    if (
      pointInRect(nonStrikerPanelRef.current?.getBoundingClientRect(), x, y)
    ) {
      return "non-striker";
    }
    return null;
  };

  const clearBatsmanDrag = () => {
    draggingBatsmanEndRef.current = null;
    batsmanDropTargetRef.current = null;
    setDraggingBatsmanEnd(null);
    setBatsmanDropTarget(null);
  };

  const handleBatsmanPointerDown = (
    end: CreaseEnd,
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (!canSwapBatsmen) return;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingBatsmanEndRef.current = end;
    batsmanDropTargetRef.current = null;
    setDraggingBatsmanEnd(end);
    setBatsmanDropTarget(null);
  };

  const handleBatsmanPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingBatsmanEndRef.current) return;
    const hit = hitBatsmanEnd(event.clientX, event.clientY);
    const target =
      hit && hit !== draggingBatsmanEndRef.current ? hit : null;
    if (batsmanDropTargetRef.current !== target) {
      batsmanDropTargetRef.current = target;
      setBatsmanDropTarget(target);
    }
  };

  const handleBatsmanPointerUp = () => {
    const from = draggingBatsmanEndRef.current;
    const to = batsmanDropTargetRef.current;
    if (from && to && from !== to) {
      swapStrike();
    }
    clearBatsmanDrag();
  };

  const batsmanDragHandlers = (end: CreaseEnd) =>
    canSwapBatsmen
      ? {
          onPointerDown: (event: PointerEvent<HTMLDivElement>) =>
            handleBatsmanPointerDown(end, event),
          onPointerMove: handleBatsmanPointerMove,
          onPointerUp: handleBatsmanPointerUp,
          onPointerCancel: clearBatsmanDrag,
        }
      : {};

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
    if (strikeRotationRuns(newBall) % 2 === 1) {
      swapStrike();
    }
    // Even runs (0, 2, 4, 6) keep same strike

    // Only legal balls advance over progression.
    const isLegalBall = countsAsLegalBall({
      extra: extra as ExtraType,
      dismissal: "none",
    });
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
    if (dismissalType === "run-out") {
      setShowDismissalModal(false);
      setPendingRunOutDismissal({
        dismissalType,
        dismissedPlayerId,
        fielderId,
      });
      return;
    }

    recordDismissalBall(dismissalType, dismissedPlayerId, fielderId, 0);
  };

  const recordDismissalBall = (
    dismissalType: DismissalType,
    dismissedPlayerId: string,
    fielderId: string | undefined,
    completedRuns: number
  ) => {
    if (!strikerInfo || !bowlerInfo) return;

    const dismissedPlayer = battingTeam.players.find(
      (p) => p.id === dismissedPlayerId
    );
    const fielder = fielderId
      ? bowlingTeam.players.find((p) => p.id === fielderId)
      : undefined;
    const wasStrikerAtStart = strikerInfo.id === dismissedPlayerId;
    const dismissedAtStrikerEnd = getDismissalReplacementEnd(
      wasStrikerAtStart,
      completedRuns
    );

    const newBall = {
      id: `${currentInnings.teamId}-${currentBallNumber}`,
      runs: completedRuns,
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

    if (completedRuns % 2 === 1) {
      swapStrike();
    }

    setShowDismissalModal(false);
    setPendingRunOutDismissal(null);
    setDismissedPlayerInfo({
      playerId: dismissedPlayerId,
      name: dismissedPlayer?.name || "",
      isStriker: dismissedAtStrikerEnd,
    });
    setShowReplacementModal(true);
  };

  const handleRunOutRunsConfirm = (completedRuns: number) => {
    if (!pendingRunOutDismissal) return;

    recordDismissalBall(
      pendingRunOutDismissal.dismissalType,
      pendingRunOutDismissal.dismissedPlayerId,
      pendingRunOutDismissal.fielderId,
      completedRuns
    );
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
    setNextBowler(bowlerId, { resetOverBowlers: true });
    setShowBowlerSelector(false);
  };

  const handleChangeBowler = (bowlerId: string) => {
    if (changeBowlerMode === "change-pre-over") {
      changeCurrentBowler(bowlerId);
    } else {
      setNextBowler(bowlerId);
    }
    setChangeBowlerMode(null);
  };

  const hasDeliveryThisOver = useMemo(() => {
    if (!currentInnings) return false;
    return currentInnings.balls.some(
      (ball) =>
        ball.overNumber === currentOver && countsAsDelivery(ball)
    );
  }, [currentInnings, currentOver]);

  const endOfOverDisabledIds = useMemo(() => {
    if (!currentInnings) return [];
    const participants = currentInnings.currentOverBowlerPlayerIds ?? [];
    if (participants.length > 0) return participants;
    return currentInnings.currentBowlerPlayerId
      ? [currentInnings.currentBowlerPlayerId]
      : [];
  }, [currentInnings]);

  const changeBowlerDisabledIds = useMemo(() => {
    if (!currentInnings) return [];
    const ids = new Set<string>();
    if (currentInnings.currentBowlerPlayerId) {
      ids.add(currentInnings.currentBowlerPlayerId);
    }
    if (currentInnings.lastBowlerPlayerId) {
      ids.add(currentInnings.lastBowlerPlayerId);
    }
    if (changeBowlerMode === "change-mid-over") {
      for (const id of currentInnings.currentOverBowlerPlayerIds ?? []) {
        ids.add(id);
      }
    }
    return [...ids];
  }, [currentInnings, changeBowlerMode]);

  const canChangeBowler =
    !isSuperOver &&
    !scoringLocked &&
    !showBowlerSelector &&
    changeBowlerMode === null;

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
              : `Over ${currentOver}.${ballsInCurrentOver}`}
          </p>
          <span className="cricket-eyebrow mb-0">Ball {currentBallNumber}</span>
        </div>
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div
              ref={strikerPanelRef}
              className={cn(
                "cricket-striker-panel",
                canSwapBatsmen && "cursor-grab touch-none select-none",
                draggingBatsmanEnd === "striker" &&
                  "scale-[0.99] cursor-grabbing opacity-50",
                batsmanDropTarget === "striker" &&
                  "shadow-[0_0_0_2px_oklch(0.55_0.12_300/0.7)]"
              )}
              aria-label={
                canSwapBatsmen
                  ? "Striker. Drag onto non-striker to swap."
                  : "Striker"
              }
              {...batsmanDragHandlers("striker")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="cricket-panel-label text-[var(--cricket-score)]">
                    Striker
                  </p>
                  <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
                    {strikerInfo.name}{" "}
                    <span className="text-[var(--cricket-gold)]">
                      {strikerRuns} ({strikerBalls})
                    </span>
                  </p>
                </div>
                {canSwapBatsmen ? (
                  <GripVertical
                    className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.72_0.04_300)]"
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
            <div
              ref={nonStrikerPanelRef}
              className={cn(
                "cricket-non-striker-panel",
                canSwapBatsmen && "cursor-grab touch-none select-none",
                draggingBatsmanEnd === "non-striker" &&
                  "scale-[0.99] cursor-grabbing opacity-50",
                batsmanDropTarget === "non-striker" &&
                  "shadow-[0_0_0_2px_oklch(0.55_0.12_300/0.7)]"
              )}
              aria-label={
                canSwapBatsmen
                  ? "Non-striker. Drag onto striker to swap."
                  : "Non-striker"
              }
              {...batsmanDragHandlers("non-striker")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="cricket-panel-label text-[oklch(0.65_0.08_300)]">
                    Non-striker
                  </p>
                  <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
                    {nonStrikerInfo ? (
                      <>
                        {nonStrikerInfo.name}{" "}
                        <span className="text-[oklch(0.72_0.06_300)]">
                          {nonStrikerRuns} ({nonStrikerBalls})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                {canSwapBatsmen ? (
                  <GripVertical
                    className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.72_0.04_300)]"
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="cricket-bowler-panel flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="cricket-panel-label text-[var(--cricket-gold)]">Bowler</p>
              <p className="cricket-score text-xl text-[var(--cricket-cream)] mt-1">
                {bowlerInfo.name}{" "}
                <span className="text-[oklch(0.7_0.08_75)]">
                  ({bowlerStats.runsConceded}-{bowlerStats.wickets})
                </span>
              </p>
            </div>
            {canChangeBowler ? (
              <button
                type="button"
                aria-label="Change bowler"
                title="Change bowler"
                onClick={() =>
                  setChangeBowlerMode(
                    hasDeliveryThisOver ? "change-mid-over" : "change-pre-over"
                  )
                }
                className="btn-12-exempt mt-0.5 shrink-0 border-0 bg-transparent p-1 text-[oklch(0.72_0.04_300)] shadow-none outline-none hover:bg-transparent hover:text-[var(--cricket-cream)]"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
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
                  {runs}
                </button>
              ))}
            </div>
            <div className="cricket-run-grid cricket-run-grid--extras">
              <button
                type="button"
                onClick={() => handleExtraTypeClick("wide")}
                disabled={scoringLocked}
                className="cricket-run-btn !min-h-11 !text-xs !font-bold tracking-wide"
                style={{
                  borderColor: "oklch(0.55 0.12 85 / 0.5)",
                  background: "oklch(0.22 0.06 85 / 0.35)",
                }}
              >
                Wide
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("no-ball")}
                disabled={scoringLocked}
                className="cricket-run-btn !min-h-11 !text-xs !font-bold"
                style={{
                  borderColor: "oklch(0.55 0.2 25 / 0.5)",
                  background: "oklch(0.22 0.08 25 / 0.35)",
                }}
              >
                No ball
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("bye")}
                disabled={scoringLocked}
                className="cricket-run-btn !min-h-11 !text-xs !font-bold"
              >
                Bye
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("leg-bye")}
                disabled={scoringLocked}
                className="cricket-run-btn !min-h-11 !text-xs !font-bold"
              >
                Leg bye
              </button>
              <button
                type="button"
                onClick={() => handleExtraTypeClick("overthrow")}
                disabled={scoringLocked}
                className="cricket-run-btn !min-h-11 !text-xs !font-bold"
              >
                Overthrow
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWicket}
            disabled={scoringLocked}
            className="w-full rounded-md border border-[oklch(0.55_0.2_25)] bg-[oklch(0.35_0.12_25)] py-4 cricket-display text-lg font-bold text-[var(--cricket-cream)] tracking-wider hover:brightness-110 disabled:opacity-50"
          >
            Wicket
          </button>

          {currentInnings.balls.length > 0 && (
            <button
              type="button"
              onClick={() => {
                undoLastBall();
                setShowBowlerSelector(false);
                setShowReplacementModal(false);
                setShowDismissalModal(false);
                setDismissedPlayerInfo(null);
                setPendingRunOutDismissal(null);
                if (lockActionsUntilUndo) {
                  onUnlockAfterUndo?.();
                }
              }}
              className="w-full rounded-md border border-[oklch(0.45_0.1_75)] bg-[oklch(0.22_0.06_75)] py-3 text-sm font-bold text-[oklch(0.88_0.06_75)] hover:brightness-110"
            >
              Undo last ball
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
          mode="end-of-over"
          disabledPlayerIds={endOfOverDisabledIds}
          onSubmit={handleNextBowler}
        />
      )}

      {changeBowlerMode && !isSuperOver && (
        <BowlerSelectorModal
          players={bowlingTeam.players}
          mode={changeBowlerMode}
          disabledPlayerIds={changeBowlerDisabledIds}
          onSubmit={handleChangeBowler}
          onCancel={() => setChangeBowlerMode(null)}
        />
      )}

      {pendingRunOutDismissal && (
        <div className="cricket-modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="cricket-modal w-full max-w-md p-5 space-y-4">
            <p className="cricket-display text-center text-lg font-semibold text-[var(--cricket-cream)]">
              Run out — runs completed before dismissal?
            </p>
            <p className="text-center text-sm text-[oklch(0.72_0.04_300)]">
              Only count runs already completed, not the run being attempted.
            </p>
            <div className="cricket-run-grid">
              {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => handleRunOutRunsConfirm(runs)}
                  className="cricket-run-btn btn-12--compact"
                >
                  {runs}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-12 btn-12--outline btn-12--md w-full"
              onClick={() => setPendingRunOutDismissal(null)}
            >
              Cancel
            </button>
          </div>
        </div>
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
                  {runs}
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
              {pendingExtraType === "overthrow" && overthrowBatRuns !== null
                ? "Back"
                : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

