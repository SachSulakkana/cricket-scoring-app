"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import BatsmanSelector from "@/components/BatsmanSelector";
import BowlerSelector from "@/components/BowlerSelector";
import FullScorecard from "@/components/FullScorecard";
import ScoringBoard from "@/components/ScoringBoard";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { MatchState, Team, countsAsBowlerWicket, countsAsWicket } from "@/lib/cricket-types";
import {
  TournamentFixture,
  TournamentFixtureResult,
  TournamentMatchSnapshot,
} from "@/lib/roster-storage";
import { useCricket } from "@/lib/cricket-context";
import { useOfferLiveMatchRestore } from "@/hooks/use-offer-live-match-restore";
import TournamentFlowSteps from "@/components/TournamentFlowSteps";
import ExportPdfButton from "@/components/ExportPdfButton";
import { appToast } from "@/lib/app-toast";
import { exportTournamentMatchPdf } from "@/lib/pdf-export";
import TieMatchDialog from "@/components/TieMatchDialog";
import SuperOverSetupDialog from "@/components/SuperOverSetupDialog";
import MatchTossSetup from "@/components/MatchTossSetup";
import { getMatchResult } from "@/lib/match-result";
import { getSuperOverWinnerTeamId } from "@/lib/super-over";
import { buildPersistedMatchSnapshot } from "@/lib/match-snapshot";
import {
  draftHasLiveMatch,
  loadPersistedLiveDraft,
  deriveBattingBowlingTeams,
  deriveTournamentMatchPage,
  shouldShowInningsBreak,
} from "@/lib/match-session-restore";
import { liveMetaMatches, type LiveMatchMeta } from "@/lib/store/match-slice";
import { getStore } from "@/lib/store/store";

function applyTournamentMatchRestore(
  restored: MatchState,
  teamA: Team,
  teamB: Team,
  setPage: (page: TournamentMatchPage) => void,
  setBattingFirstTeam: (team: Team) => void,
  setBowlingFirstTeam: (team: Team) => void,
  setLineupStep: (step: "batsmen" | "bowler" | "confirm") => void,
  setInnings1AutoEnded: (value: boolean) => void,
  setRequireUndoAfterInningsBreak: (value: boolean) => void
) {
  const { battingFirstTeam, bowlingFirstTeam } = deriveBattingBowlingTeams(
    restored,
    teamA,
    teamB
  );
  setBattingFirstTeam(battingFirstTeam);
  setBowlingFirstTeam(bowlingFirstTeam);
  const nextPage = deriveTournamentMatchPage(restored);
  setPage(nextPage);
  if (nextPage === "lineup") {
    const innings = restored.innings1;
    if (innings?.strikerPlayerId && innings.nonStrikerPlayerId) {
      setLineupStep(
        innings.currentBowlerPlayerId ? "confirm" : "bowler"
      );
    } else {
      setLineupStep("batsmen");
    }
  }
  const inningsBreak = shouldShowInningsBreak(restored);
  setInnings1AutoEnded(inningsBreak);
  setRequireUndoAfterInningsBreak(inningsBreak);
}

type TournamentMatchPage =
  | "toss"
  | "lineup"
  | "scoring"
  | "scorecard"
  | "finished";

interface TournamentMatchAppProps {
  fixture: TournamentFixture;
  teamA: Team;
  teamB: Team;
  overs: number;
  ballsPerOver: number;
  tournamentId: string;
  tournamentName?: string;
  onBack: () => void;
  onComplete: (result: TournamentFixtureResult) => void;
}

function getInningsRuns(innings: MatchState["innings1"]): number {
  if (!innings) return 0;
  return innings.balls.reduce((total, ball) => {
    return total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0);
  }, 0);
}

function getTopBatting(
  innings: MatchState["innings1"],
  battingTeam: Team
): { playerName: string; runs: number } | undefined {
  if (!innings) return undefined;
  let bestPlayer = battingTeam.players[0]?.name ?? battingTeam.name;
  let bestRuns = -1;

  battingTeam.players.forEach((player) => {
    const playerRuns = innings.balls.reduce((sum, ball) => {
      if (ball.batsmanName !== player.name) return sum;
      const noBallBatRuns =
        ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
      const overthrowRuns =
        ball.extra === "overthrow" ? ball.extraRuns : 0;
      return sum + ball.runs + noBallBatRuns + overthrowRuns;
    }, 0);

    if (playerRuns > bestRuns) {
      bestRuns = playerRuns;
      bestPlayer = player.name;
    }
  });

  if (bestRuns < 0) return undefined;
  return { playerName: bestPlayer, runs: bestRuns };
}

function getTopBowling(
  innings: MatchState["innings1"],
  bowlingTeam: Team
): { playerName: string; wickets: number } | undefined {
  if (!innings) return undefined;
  let bestPlayer = bowlingTeam.players[0]?.name ?? bowlingTeam.name;
  let bestWickets = -1;

  bowlingTeam.players.forEach((player) => {
    const wickets = innings.balls.reduce((sum, ball) => {
      if (ball.bowlerName !== player.name) return sum;
      if (countsAsBowlerWicket(ball.dismissal)) {
        return sum + 1;
      }
      return sum;
    }, 0);

    if (wickets > bestWickets) {
      bestWickets = wickets;
      bestPlayer = player.name;
    }
  });

  if (bestWickets < 0) return undefined;
  return { playerName: bestPlayer, wickets: bestWickets };
}

function getBattingInningsForTeam(
  matchState: MatchState,
  team: Team
): MatchState["innings1"] {
  if (matchState.innings1?.teamId === team.id) return matchState.innings1;
  if (matchState.innings2?.teamId === team.id) return matchState.innings2;
  return null;
}

function getBowlingInningsForTeam(
  matchState: MatchState,
  team: Team
): MatchState["innings1"] {
  if (matchState.innings1?.teamId === team.id) {
    return matchState.innings2;
  }
  if (matchState.innings2?.teamId === team.id) {
    return matchState.innings1;
  }
  return null;
}

function getTeamInningsTotals(
  matchState: MatchState,
  team: Team
): { runs: number; wickets: number } {
  const batting = getBattingInningsForTeam(matchState, team);
  if (!batting) return { runs: 0, wickets: 0 };
  return {
    runs: getInningsRuns(batting),
    wickets: batting.balls.filter((ball) => countsAsWicket(ball.dismissal)).length,
  };
}

function extractFixtureResult(
  matchState: MatchState,
  teamA: Team,
  teamB: Team,
  matchConfig: { totalOvers: number; ballsPerOver: number }
): TournamentFixtureResult {
  const totalsA = getTeamInningsTotals(matchState, teamA);
  const totalsB = getTeamInningsTotals(matchState, teamB);
  const runsA = totalsA.runs;
  const runsB = totalsB.runs;
  const wicketsA = totalsA.wickets;
  const wicketsB = totalsB.wickets;

  const bestBatA = getTopBatting(getBattingInningsForTeam(matchState, teamA), teamA);
  const bestBatB = getTopBatting(getBattingInningsForTeam(matchState, teamB), teamB);
  const bestBatting =
    !bestBatA && !bestBatB
      ? undefined
      : !bestBatB || (bestBatA && bestBatA.runs >= bestBatB.runs)
        ? {
            playerName: bestBatA?.playerName ?? teamA.name,
            teamId: teamA.id,
            runs: bestBatA?.runs ?? 0,
          }
        : {
            playerName: bestBatB.playerName,
            teamId: teamB.id,
            runs: bestBatB.runs,
          };

  const bestBowlA = getTopBowling(getBowlingInningsForTeam(matchState, teamA), teamA);
  const bestBowlB = getTopBowling(getBowlingInningsForTeam(matchState, teamB), teamB);
  const bestBowling =
    !bestBowlA && !bestBowlB
      ? undefined
      : !bestBowlB || (bestBowlA && bestBowlA.wickets >= bestBowlB.wickets)
        ? {
            playerName: bestBowlA?.playerName ?? teamA.name,
            teamId: teamA.id,
            wickets: bestBowlA?.wickets ?? 0,
          }
        : {
            playerName: bestBowlB.playerName,
            teamId: teamB.id,
            wickets: bestBowlB.wickets,
          };

  const scorecard = buildPersistedMatchSnapshot(matchState, matchConfig);

  const superOverWinner = getSuperOverWinnerTeamId(matchState);

  return {
    runsA,
    wicketsA,
    runsB,
    wicketsB,
    winnerTeamId:
      superOverWinner ??
      (runsA === runsB ? undefined : runsA > runsB ? teamA.id : teamB.id),
    bestBatting,
    bestBowling,
    scorecard,
  };
}

function createRainAbandonedResult(
  matchState: MatchState,
  teamA: Team,
  teamB: Team,
  matchConfig: { totalOvers: number; ballsPerOver: number }
): TournamentFixtureResult {
  const totalsA = getTeamInningsTotals(matchState, teamA);
  const totalsB = getTeamInningsTotals(matchState, teamB);

  const scorecard = buildPersistedMatchSnapshot(matchState, matchConfig);

  return {
    runsA: totalsA.runs,
    wicketsA: totalsA.wickets,
    runsB: totalsB.runs,
    wicketsB: totalsB.wickets,
    scorecard,
    abandoned: true,
    abandonedReason: "rain",
  };
}

export default function TournamentMatchApp({
  fixture,
  teamA,
  teamB,
  overs,
  ballsPerOver,
  tournamentId,
  tournamentName,
  onBack,
  onComplete,
}: TournamentMatchAppProps) {
  const {
    matchState,
    setTeam1,
    setTeam2,
    setMatchConfig,
    startMatch,
    setOpeningBatsmen,
    setOpeningBowler,
    switchInnings,
    resetMatch,
    finalizeLiveMatch,
    setLiveSession,
    acceptMatchDraw,
    initSuperOver,
    switchSuperOverInnings,
    completeSuperOver,
  } = useCricket();

  const liveSessionMeta = useMemo(
    (): LiveMatchMeta => ({
      kind: "tournament",
      tournamentId,
      fixtureId: fixture.id,
      label: `${teamA.name} vs ${teamB.name}`,
    }),
    [tournamentId, fixture.id, teamA.name, teamB.name]
  );

  useOfferLiveMatchRestore(liveSessionMeta, (restored) => {
    applyTournamentMatchRestore(
      restored,
      teamA,
      teamB,
      setPage,
      setBattingFirstTeam,
      setBowlingFirstTeam,
      setLineupStep,
      setInnings1AutoEnded,
      setRequireUndoAfterInningsBreak
    );
  });
  const [page, setPage] = useState<TournamentMatchPage>("toss");
  const [lineupStep, setLineupStep] = useState<"batsmen" | "bowler" | "confirm">(
    "batsmen"
  );
  const [battingFirstTeam, setBattingFirstTeam] = useState<Team | null>(null);
  const [bowlingFirstTeam, setBowlingFirstTeam] = useState<Team | null>(null);
  const [innings1AutoEnded, setInnings1AutoEnded] = useState(false);
  const [requireUndoAfterInningsBreak, setRequireUndoAfterInningsBreak] =
    useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showTieDialog, setShowTieDialog] = useState(false);
  const [showSuperOverSetup, setShowSuperOverSetup] = useState(false);
  const [tieIsSuperOver, setTieIsSuperOver] = useState(false);
  const initializedFixtureRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    setLiveSession(liveSessionMeta);
  }, [liveSessionMeta, setLiveSession]);

  useEffect(() => {
    if (initializedFixtureRef.current === fixture.id) return;
    initializedFixtureRef.current = fixture.id;

    const draft = loadPersistedLiveDraft();
    const { matchState: storedState, meta: storedMeta } =
      getStore().getState().match;
    const hasLiveSession =
      (storedState.matchStarted &&
        liveMetaMatches(storedMeta, liveSessionMeta)) ||
      draftHasLiveMatch(draft, liveSessionMeta);
    if (hasLiveSession) return;

    resetMatch();
    setPage("toss");
    setLineupStep("batsmen");
    setBattingFirstTeam(null);
    setBowlingFirstTeam(null);
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setSubmitted(false);
  }, [fixture.id, liveSessionMeta, resetMatch]);

  const handleTossContinue = ({
    battingTeam,
    bowlingTeam,
  }: {
    battingTeam: Team;
    bowlingTeam: Team;
  }) => {
    setBattingFirstTeam(battingTeam);
    setBowlingFirstTeam(bowlingTeam);
    setLiveSession(liveSessionMeta);
    setTeam1(battingTeam);
    setTeam2(bowlingTeam);
    setMatchConfig({ totalOvers: overs, ballsPerOver });
    const stored = getStore().getState().match.matchState;
    if (!stored.matchStarted) {
      startMatch();
    }
    setPage("lineup");
    setLineupStep("batsmen");
  };

  const strikerName = useMemo(() => {
    if (!battingFirstTeam || !matchState.innings1?.strikerPlayerId) return "—";
    return (
      battingFirstTeam.players.find(
        (p) => p.id === matchState.innings1?.strikerPlayerId
      )?.name ?? "—"
    );
  }, [battingFirstTeam, matchState.innings1?.strikerPlayerId]);

  const nonStrikerName = useMemo(() => {
    if (!battingFirstTeam || !matchState.innings1?.nonStrikerPlayerId) return "—";
    return (
      battingFirstTeam.players.find(
        (p) => p.id === matchState.innings1?.nonStrikerPlayerId
      )?.name ?? "—"
    );
  }, [battingFirstTeam, matchState.innings1?.nonStrikerPlayerId]);

  const bowlerName = useMemo(() => {
    if (!bowlingFirstTeam || !matchState.innings1?.currentBowlerPlayerId) return "—";
    return (
      bowlingFirstTeam.players.find(
        (p) => p.id === matchState.innings1?.currentBowlerPlayerId
      )?.name ?? "—"
    );
  }, [bowlingFirstTeam, matchState.innings1?.currentBowlerPlayerId]);

  const handleRainAbandon = () => {
    if (submitted) return;
    setSubmitted(true);
    finalizeLiveMatch();
    onComplete(
      createRainAbandonedResult(matchState, teamA, teamB, {
        totalOvers: overs,
        ballsPerOver,
      })
    );
  };

  const handleMatchEnd = () => {
    if (matchState.superOver?.active) {
      completeSuperOver();
    }
    finalizeLiveMatch();
    setPage("finished");
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
    setPage("finished");
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

  const handleExportPdf = () => {
    setExportingPdf(true);
    void exportTournamentMatchPdf({
      tournamentName: tournamentName ?? `${teamA.name} vs ${teamB.name}`,
      teamA,
      teamB,
      result: resultPreview,
      config: { totalOvers: overs, ballsPerOver },
    })
      .then(() => appToast.success("Match scorecard PDF downloaded"))
      .catch((err) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not export PDF"
        )
      )
      .finally(() => setExportingPdf(false));
  };

  const submitResult = () => {
    if (submitted) return;
    setSubmitted(true);
    onComplete(
      extractFixtureResult(matchState, teamA, teamB, {
        totalOvers: overs,
        ballsPerOver,
      })
    );
  };

  const resultPreview = useMemo(
    () =>
      extractFixtureResult(matchState, teamA, teamB, {
        totalOvers: overs,
        ballsPerOver,
      }),
    [matchState, teamA, teamB, overs, ballsPerOver]
  );

  if (page === "toss") {
    return (
      <CricketPage>
        <CricketPageHeader
          onBack={onBack}
          title={`${teamA.name} vs ${teamB.name}`}
          backLabel="Back to fixtures"
        />
        <MatchTossSetup
          teamA={teamA}
          teamB={teamB}
          variant="tournament"
          eyebrow="Tournament match setup"
          onContinue={handleTossContinue}
        />
      </CricketPage>
    );
  }

  if (page === "lineup") {
    if (!battingFirstTeam || !bowlingFirstTeam) return null;

    if (lineupStep === "batsmen") {
      return (
        <CricketPage>
          <CricketPageHeader
            onBack={onBack}
            title={`${battingFirstTeam.name} batting`}
            backLabel="Back to fixtures"
          />
          <BatsmanSelector
            players={battingFirstTeam.players}
            onSubmit={(strikerId, nonStrikerId) => {
              setOpeningBatsmen(strikerId, nonStrikerId);
              setLineupStep("bowler");
            }}
          />
        </CricketPage>
      );
    }

    if (lineupStep === "bowler") {
      return (
        <CricketPage>
          <CricketPageHeader
            onBack={onBack}
            title={`${bowlingFirstTeam.name} bowling`}
            backLabel="Back to fixtures"
          />
          <BowlerSelector
            players={bowlingFirstTeam.players}
            onSubmit={(bowlerId) => {
              setOpeningBowler(bowlerId);
              setLineupStep("confirm");
            }}
            isOpening
          />
        </CricketPage>
      );
    }

    return (
      <CricketPage>
        <CricketPageHeader
          onBack={onBack}
          title="Confirm match setup"
          backLabel="Back to fixtures"
        />
        <CricketBroadcastCard accent className="p-5 space-y-4">
          <div>
            <CricketEyebrow className="mb-1">Ready to start</CricketEyebrow>
            <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
              Confirm opening players
            </h2>
          </div>
          <div>
            <CricketDetailRow label="Batting first" value={battingFirstTeam.name} />
            <CricketDetailRow label="Bowling first" value={bowlingFirstTeam.name} />
            <CricketDetailRow label="Striker" value={strikerName} />
            <CricketDetailRow label="Non-striker" value={nonStrikerName} />
            <CricketDetailRow label="Opening bowler" value={bowlerName} />
          </div>
          <div className="flex flex-wrap gap-2">
            <CricketAddButton
              type="button"
              variant="tournament"
              size="inline"
              onClick={() => setPage("scoring")}
            >
              Start Match
            </CricketAddButton>
            <button
              type="button"
              className="btn-12 btn-12--outline btn-12--md !w-auto !min-h-[2.5rem] px-4"
              onClick={() => setLineupStep("batsmen")}
            >
              Edit selections
            </button>
          </div>
        </CricketBroadcastCard>
      </CricketPage>
    );
  }

  if (page === "scoring") {
    return (
      <>
        <ScoringBoard
          banner={<TournamentFlowSteps current="Score" className="mb-1" />}
          onMatchEnd={handleMatchEnd}
          onMatchTied={handleMatchTied}
          onViewScorecard={() => setPage("scorecard")}
          onInnings1AutoEnd={handleInnings1AutoEnd}
          onSuperOverInnings1End={handleSuperOverInnings1End}
          lockActionsUntilUndo={requireUndoAfterInningsBreak}
          onUnlockAfterUndo={handleUnlockAfterUndo}
          onEndDueToRain={handleRainAbandon}
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
          team1={{ id: teamA.id, name: teamA.name }}
          team2={{ id: teamB.id, name: teamB.name }}
          onConfirm={handleSuperOverSetupConfirm}
        />
      </>
    );
  }

  if (page === "scorecard") {
    return (
      <FullScorecard
        onBack={() => setPage("scoring")}
        showStartSecondInnings={innings1AutoEnded}
        onStartSecondInnings={handleStartSecondInnings}
      />
    );
  }

  return (
    <CricketPage>
      <CricketPageHeader
        onBack={onBack}
        title={`${teamA.name} vs ${teamB.name}`}
        backLabel="Back to fixtures"
      />
      <CricketBroadcastCard accent className="p-5 space-y-4">
        <div>
          <CricketEyebrow className="mb-1">Match complete</CricketEyebrow>
          <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
            Save result to tournament?
          </h2>
        </div>
        <div>
          <CricketDetailRow
            label={teamA.name}
            value={`${resultPreview.runsA}/${resultPreview.wicketsA}`}
          />
          <CricketDetailRow
            label={teamB.name}
            value={`${resultPreview.runsB}/${resultPreview.wicketsB}`}
          />
          <CricketDetailRow
            label="Result"
            value={getMatchResult(matchState).text}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportPdfButton
            onClick={handleExportPdf}
            loading={exportingPdf}
            label="Export PDF"
            variant="tournament"
            className="!w-auto px-4"
          />
          <CricketAddButton
            type="button"
            variant="tournament"
            size="inline"
            onClick={submitResult}
            disabled={submitted}
          >
            {submitted ? "Saving..." : "Save to Tournament"}
          </CricketAddButton>
          <button
            type="button"
            className="btn-12 btn-12--outline btn-12--md !w-auto !min-h-[2.5rem] px-4"
            onClick={onBack}
          >
            Cancel
          </button>
        </div>
      </CricketBroadcastCard>
    </CricketPage>
  );
}

