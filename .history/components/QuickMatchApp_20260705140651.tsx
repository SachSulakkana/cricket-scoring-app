"use client";

import { useEffect, useState } from "react";
import type { LiveMatchMeta } from "@/lib/store/match-slice";
import { Button } from "@/components/ui/button";
import { useCricket } from "@/lib/cricket-context";
import { useOfferLiveMatchRestore } from "@/hooks/use-offer-live-match-restore";
import {
  deriveQuickMatchPage,
  shouldShowInningsBreak,
  type QuickMatchPage,
} from "@/lib/match-session-restore";
import TeamSetup from "@/components/TeamSetup";
import MatchTossSetup from "@/components/MatchTossSetup";
import ScoringBoard from "@/components/ScoringBoard";
import MatchSummary from "@/components/MatchSummary";
import FullScorecard from "@/components/FullScorecard";
import TieMatchDialog from "@/components/TieMatchDialog";
import SuperOverSetupDialog from "@/components/SuperOverSetupDialog";
import OngoingQuickMatchDialog from "@/components/OngoingQuickMatchDialog";
import { countRecordedBalls } from "@/lib/quick-match-session";
import type { MatchState } from "@/lib/cricket-types";

interface QuickMatchAppProps {
  onBackToHome: () => void;
}

const QUICK_MATCH_META: LiveMatchMeta = { kind: "quick" };

function applyQuickMatchRestore(
  matchState: Parameters<typeof deriveQuickMatchPage>[0],
  setPage: (page: ReturnType<typeof deriveQuickMatchPage>) => void,
  setInnings1AutoEnded: (value: boolean) => void,
  setRequireUndoAfterInningsBreak: (value: boolean) => void
) {
  const nextPage = deriveQuickMatchPage(matchState);
  setPage(nextPage);
  const inningsBreak = shouldShowInningsBreak(matchState);
  setInnings1AutoEnded(inningsBreak);
  setRequireUndoAfterInningsBreak(inningsBreak);
}

export default function QuickMatchApp({ onBackToHome }: QuickMatchAppProps) {
  const {
    matchState,
    startMatch,
    switchInnings,
    resetMatch,
    finalizeLiveMatch,
    setLiveSession,
    restoreLiveDraft,
    acceptMatchDraw,
    initSuperOver,
    switchSuperOverInnings,
    completeSuperOver,
    setTeam1,
    setTeam2,
    setMatchConfig,
  } = useCricket();
  const [page, setPage] = useState<QuickMatchPage>("setup");
  const [showTieDialog, setShowTieDialog] = useState(false);
  const [showSuperOverSetup, setShowSuperOverSetup] = useState(false);
  const [tieIsSuperOver, setTieIsSuperOver] = useState(false);
  const [ongoingPrompt, setOngoingPrompt] = useState<MatchState | null>(null);

  useEffect(() => {
    setLiveSession(QUICK_MATCH_META);
  }, [setLiveSession]);

  useOfferLiveMatchRestore(
    QUICK_MATCH_META,
    (restored) => {
      applyQuickMatchRestore(
        restored,
        setPage,
        setInnings1AutoEnded,
        setRequireUndoAfterInningsBreak
      );
    },
    {
      prompt: true,
      onOfferRestore: (state) => setOngoingPrompt(state),
    }
  );
  const [innings1AutoEnded, setInnings1AutoEnded] = useState(false);
  const [requireUndoAfterInningsBreak, setRequireUndoAfterInningsBreak] =
    useState(false);

  const handleSetupNext = () => {
    if (
      matchState.team1.players.length > 0 &&
      matchState.team2.players.length > 0 &&
      matchState.config
    ) {
      setPage("toss");
    }
  };

  const handleTossContinue = ({
    battingTeam,
    bowlingTeam,
  }: {
    battingTeam: typeof matchState.team1;
    bowlingTeam: typeof matchState.team2;
  }) => {
    setTeam1(battingTeam);
    setTeam2(bowlingTeam);
    startMatch();
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("scoring");
  };

  const handleBackFromToss = () => {
    setPage("setup");
  };

  const handleRainAbandon = () => {
    finalizeLiveMatch();
    setPage("summary");
  };

  const handleScoringEnd = () => {
    if (matchState.superOver?.active) {
      completeSuperOver();
    }
    finalizeLiveMatch();
    setPage("summary");
  };

  const handleMatchTied = () => {
    setTieIsSuperOver(Boolean(matchState.superOver?.active));
    setShowTieDialog(true);
  };

  const handleAcceptDraw = () => {
    setShowTieDialog(false);
    if (tieIsSuperOver) {
      completeSuperOver();
    }
    acceptMatchDraw();
    finalizeLiveMatch();
    setPage("summary");
  };

  const handleStartSuperOverPrompt = () => {
    setShowTieDialog(false);
    setShowSuperOverSetup(true);
  };

  const handleSuperOverSetupConfirm = ({
    firstBattingTeamId,
    ballsPerOver,
  }: {
    firstBattingTeamId: string;
    ballsPerOver: number;
  }) => {
    setShowSuperOverSetup(false);
    initSuperOver(firstBattingTeamId, ballsPerOver);
    setPage("scoring");
  };

  const handleSuperOverInnings1End = () => {
    switchSuperOverInnings();
    setPage("scoring");
  };

  const handleUseSameTeams = () => {
    const savedTeam1 = matchState.team1;
    const savedTeam2 = matchState.team2;
    const savedConfig = matchState.config;
    resetMatch();
    setLiveSession(QUICK_MATCH_META);
    setTeam1(savedTeam1);
    setTeam2(savedTeam2);
    if (savedConfig) setMatchConfig(savedConfig);
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("toss");
  };

  const handleCreateNewTeams = () => {
    resetMatch();
    setLiveSession(QUICK_MATCH_META);
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("setup");
  };

  const handleViewScorecard = () => {
    setPage("scorecard");
  };

  const handleInnings1AutoEnd = () => {
    setInnings1AutoEnded(true);
    setRequireUndoAfterInningsBreak(true);
    setPage("scorecard");
  };

  const handleStartSecondInnings = () => {
    switchInnings();
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("scoring");
  };

  const handleUnlockAfterUndo = () => {
    setRequireUndoAfterInningsBreak(false);
  };

  const handleBackFromScorecard = () => {
    setPage("scoring");
  };

  const handleBackHome = () => {
    resetMatch();
    setLiveSession(null);
    onBackToHome();
  };

  const handleContinueOngoing = () => {
    if (!ongoingPrompt) return;
    restoreLiveDraft(ongoingPrompt, QUICK_MATCH_META);
    applyQuickMatchRestore(
      ongoingPrompt,
      setPage,
      setInnings1AutoEnded,
      setRequireUndoAfterInningsBreak
    );
    setOngoingPrompt(null);
  };

  const handleStartNewMatch = () => {
    resetMatch();
    setLiveSession(QUICK_MATCH_META);
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("setup");
    setOngoingPrompt(null);
  };

  const ongoingBallCount = ongoingPrompt ? countRecordedBalls(ongoingPrompt) : 0;
  const ongoingTeam1Name =
    ongoingPrompt?.team1.name ?? matchState.team1.name ?? "";
  const ongoingTeam2Name =
    ongoingPrompt?.team2.name ?? matchState.team2.name ?? "";

  return (
    <>
      {page === "setup" && (
        <div className="relative">
          <Button
            variant="ghost"
            onClick={handleBackHome}
            aria-label="Go home"
            title="Go home"
            className="absolute top-4 left-4 z-10 btn-12 btn-12--icon btn-12-exempt !h-11 !w-11 !min-h-11 !min-w-11 !p-0 inline-flex items-center justify-center text-xl"
          >
            <span aria-hidden>←</span>
          </Button>
          <TeamSetup onNext={handleSetupNext} />
        </div>
      )}
      {page === "toss" && (
        <div className="cricket-page min-h-screen">
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
            <Button
              variant="ghost"
              onClick={handleBackFromToss}
              aria-label="Back to setup"
              title="Back to setup"
              className="mb-4 btn-12 btn-12--icon btn-12-exempt !h-11 !w-11 !min-h-11 !min-w-11 !p-0 inline-flex items-center justify-center text-xl"
            >
              <span aria-hidden>←</span>
            </Button>
            <MatchTossSetup
              teamA={matchState.team1}
              teamB={matchState.team2}
              variant="quick"
              eyebrow="Quick match setup"
              onContinue={handleTossContinue}
            />
          </div>
        </div>
      )}
      {page === "scoring" && (
        <ScoringBoard
          onMatchEnd={handleScoringEnd}
          onMatchTied={handleMatchTied}
          onViewScorecard={handleViewScorecard}
          onInnings1AutoEnd={handleInnings1AutoEnd}
          onSuperOverInnings1End={handleSuperOverInnings1End}
          onEndDueToRain={handleRainAbandon}
          lockActionsUntilUndo={requireUndoAfterInningsBreak}
          onUnlockAfterUndo={handleUnlockAfterUndo}
        />
      )}
      {page === "summary" && (
        <div className="relative">
          <Button
            variant="ghost"
            onClick={handleBackHome}
            aria-label="Go home"
            title="Go home"
            className="absolute top-4 left-4 z-10 btn-12 btn-12--icon btn-12-exempt !h-11 !w-11 !min-h-11 !min-w-11 !p-0 inline-flex items-center justify-center text-xl"
          >
            <span aria-hidden>←</span>
          </Button>
          <MatchSummary
            onUseSameTeams={handleUseSameTeams}
            onCreateNewTeams={handleCreateNewTeams}
          />
        </div>
      )}
      {page === "scorecard" && (
        <FullScorecard
          onBack={handleBackFromScorecard}
          showStartSecondInnings={innings1AutoEnded}
          onStartSecondInnings={handleStartSecondInnings}
        />
      )}

      <OngoingQuickMatchDialog
        open={ongoingPrompt != null}
        onOpenChange={(open) => {
          if (!open && ongoingPrompt) handleStartNewMatch();
        }}
        team1Name={ongoingTeam1Name}
        team2Name={ongoingTeam2Name}
        ballCount={ongoingBallCount}
        onContinue={handleContinueOngoing}
        onStartNew={handleStartNewMatch}
      />
      <TieMatchDialog
        open={showTieDialog}
        onOpenChange={setShowTieDialog}
        superOverContext={tieIsSuperOver}
        onContinueAsDraw={handleAcceptDraw}
        onStartSuperOver={handleStartSuperOverPrompt}
      />
      <SuperOverSetupDialog
        open={showSuperOverSetup}
        onOpenChange={setShowSuperOverSetup}
        team1={{ id: matchState.team1.id, name: matchState.team1.name }}
        team2={{ id: matchState.team2.id, name: matchState.team2.name }}
        onConfirm={handleSuperOverSetupConfirm}
      />
    </>
  );
}
