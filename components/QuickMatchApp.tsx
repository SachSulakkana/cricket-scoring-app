"use client";

import { useState } from "react";
import type { LiveMatchMeta } from "@/lib/store/match-slice";
import { Button } from "@/components/ui/button";
import { useCricket } from "@/lib/cricket-context";
import { useOfferLiveMatchRestore } from "@/hooks/use-offer-live-match-restore";
import TeamSetup from "@/components/TeamSetup";
import ScoringBoard from "@/components/ScoringBoard";
import MatchSummary from "@/components/MatchSummary";
import FullScorecard from "@/components/FullScorecard";

interface QuickMatchAppProps {
  onBackToHome: () => void;
}

const QUICK_MATCH_META: LiveMatchMeta = { kind: "quick" };

export default function QuickMatchApp({ onBackToHome }: QuickMatchAppProps) {
  const { matchState, startMatch, switchInnings, resetMatch } = useCricket();
  const [page, setPage] = useState<"setup" | "scoring" | "summary" | "scorecard">(
    "setup"
  );

  useOfferLiveMatchRestore(QUICK_MATCH_META, () => setPage("scoring"));
  const [innings1AutoEnded, setInnings1AutoEnded] = useState(false);
  const [requireUndoAfterInningsBreak, setRequireUndoAfterInningsBreak] =
    useState(false);

  const handleSetupNext = () => {
    if (
      matchState.team1.players.length > 0 &&
      matchState.team2.players.length > 0 &&
      matchState.config
    ) {
      startMatch();
      setInnings1AutoEnded(false);
      setRequireUndoAfterInningsBreak(false);
      setPage("scoring");
    }
  };

  const handleScoringEnd = () => {
    setPage("summary");
  };

  const handleUseSameTeams = () => {
    startMatch();
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setPage("scoring");
  };

  const handleCreateNewTeams = () => {
    resetMatch();
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
    onBackToHome();
  };

  return (
    <>
      {page === "setup" && (
        <div className="relative">
          <Button
            variant="ghost"
            onClick={handleBackHome}
            aria-label="Go home"
            title="Go home"
            className="absolute top-4 left-4 z-10 cricket-btn-back !h-11 !w-11 !min-h-11 !min-w-11 !p-0 inline-flex items-center justify-center text-xl"
          >
            <span aria-hidden>←</span>
          </Button>
          <TeamSetup onNext={handleSetupNext} />
        </div>
      )}
      {page === "scoring" && (
        <ScoringBoard
          onMatchEnd={handleScoringEnd}
          onViewScorecard={handleViewScorecard}
          onInnings1AutoEnd={handleInnings1AutoEnd}
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
            className="absolute top-4 left-4 z-10 cricket-btn-back !h-11 !w-11 !min-h-11 !min-w-11 !p-0 inline-flex items-center justify-center text-xl"
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
    </>
  );
}
