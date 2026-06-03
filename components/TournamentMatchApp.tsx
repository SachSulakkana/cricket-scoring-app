"use client";

import { useEffect, useMemo, useState } from "react";
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
import { MatchState, Team } from "@/lib/cricket-types";
import {
  TournamentFixture,
  TournamentFixtureResult,
  TournamentMatchSnapshot,
} from "@/lib/roster-storage";
import { useCricket } from "@/lib/cricket-context";
import { useOfferLiveMatchRestore } from "@/hooks/use-offer-live-match-restore";
import TournamentFlowSteps from "@/components/TournamentFlowSteps";
import type { LiveMatchMeta } from "@/lib/store/match-slice";

interface TournamentMatchAppProps {
  fixture: TournamentFixture;
  teamA: Team;
  teamB: Team;
  overs: number;
  ballsPerOver: number;
  tournamentId: string;
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
      return sum + ball.runs + noBallBatRuns;
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
      if (ball.dismissal !== "none" && ball.dismissal !== "run-out") {
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
    wickets: batting.balls.filter((ball) => ball.dismissal !== "none").length,
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

  const scorecard: TournamentMatchSnapshot = {
    team1: matchState.team1,
    team2: matchState.team2,
    config: matchState.config ?? matchConfig,
    innings1: matchState.innings1,
    innings2: matchState.innings2,
  };

  return {
    runsA,
    wicketsA,
    runsB,
    wicketsB,
    winnerTeamId: runsA === runsB ? undefined : runsA > runsB ? teamA.id : teamB.id,
    bestBatting,
    bestBowling,
    scorecard,
  };
}

export default function TournamentMatchApp({
  fixture,
  teamA,
  teamB,
  overs,
  ballsPerOver,
  tournamentId,
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

  useOfferLiveMatchRestore(liveSessionMeta, () => setPage("scoring"));
  const [page, setPage] = useState<
    "toss" | "boot-start" | "lineup" | "scoring" | "scorecard" | "finished"
  >("toss");
  const [lineupStep, setLineupStep] = useState<"batsmen" | "bowler" | "confirm">(
    "batsmen"
  );
  const [tossWinnerId, setTossWinnerId] = useState<string | null>(null);
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl" | null>(null);
  const [battingFirstTeam, setBattingFirstTeam] = useState<Team | null>(null);
  const [bowlingFirstTeam, setBowlingFirstTeam] = useState<Team | null>(null);
  const [innings1AutoEnded, setInnings1AutoEnded] = useState(false);
  const [requireUndoAfterInningsBreak, setRequireUndoAfterInningsBreak] =
    useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    resetMatch();
    setPage("toss");
    setLineupStep("batsmen");
    setTossWinnerId(null);
    setTossDecision(null);
    setBattingFirstTeam(null);
    setBowlingFirstTeam(null);
    setInnings1AutoEnded(false);
    setRequireUndoAfterInningsBreak(false);
    setSubmitted(false);
    return () => {
      resetMatch();
    };
  }, [fixture.id, resetMatch]);

  useEffect(() => {
    if (page !== "boot-start") return;
    if (!battingFirstTeam || !bowlingFirstTeam) return;
    if (matchState.matchStarted) return;
    if (!matchState.config) return;
    if (
      matchState.team1.id !== battingFirstTeam.id ||
      matchState.team2.id !== bowlingFirstTeam.id
    ) {
      return;
    }
    startMatch();
    setPage("lineup");
    setLineupStep("batsmen");
  }, [battingFirstTeam, bowlingFirstTeam, matchState, page, startMatch]);

  const handleTossContinue = () => {
    if (!tossWinnerId || !tossDecision) return;
    const winner = tossWinnerId === teamA.id ? teamA : teamB;
    const loser = tossWinnerId === teamA.id ? teamB : teamA;
    const batting = tossDecision === "bat" ? winner : loser;
    const bowling = tossDecision === "bat" ? loser : winner;

    setBattingFirstTeam(batting);
    setBowlingFirstTeam(bowling);
    setTeam1(batting);
    setTeam2(bowling);
    setMatchConfig({ totalOvers: overs, ballsPerOver });
    setPage("boot-start");
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

  const handleMatchEnd = () => {
    setPage("finished");
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
        <CricketBroadcastCard accent className="p-5 space-y-4">
          <div>
            <CricketEyebrow className="mb-1">Tournament match setup</CricketEyebrow>
            <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
              Toss and opening setup
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[oklch(0.65_0.03_255)]">Toss won by</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[teamA, teamB].map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`rounded-md border p-3 text-left transition ${
                    tossWinnerId === team.id
                      ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
                      : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_145/0.5)]"
                  }`}
                  onClick={() => setTossWinnerId(team.id)}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[oklch(0.65_0.03_255)]">Decision</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-md border p-3 text-left transition ${
                  tossDecision === "bat"
                    ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
                    : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_145/0.5)]"
                }`}
                onClick={() => setTossDecision("bat")}
              >
                Bat first
              </button>
              <button
                type="button"
                className={`rounded-md border p-3 text-left transition ${
                  tossDecision === "bowl"
                    ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
                    : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_145/0.5)]"
                }`}
                onClick={() => setTossDecision("bowl")}
              >
                Bowl first
              </button>
            </div>
          </div>

          <CricketAddButton
            type="button"
            variant="tournament"
            size="inline"
            onClick={handleTossContinue}
            disabled={!tossWinnerId || !tossDecision}
          >
            Continue
          </CricketAddButton>
        </CricketBroadcastCard>
      </CricketPage>
    );
  }

  if (page === "boot-start") return null;

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
              className="cricket-btn-setup !w-auto !min-h-[2.5rem] px-4"
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
      <ScoringBoard
        banner={<TournamentFlowSteps current="Score" className="mb-1" />}
        onMatchEnd={handleMatchEnd}
        onViewScorecard={() => setPage("scorecard")}
        onInnings1AutoEnd={handleInnings1AutoEnd}
        lockActionsUntilUndo={requireUndoAfterInningsBreak}
        onUnlockAfterUndo={handleUnlockAfterUndo}
      />
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
            value={
              resultPreview.winnerTeamId
                ? resultPreview.winnerTeamId === teamA.id
                  ? `${teamA.name} won`
                  : `${teamB.name} won`
                : "Match tied"
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
            className="cricket-btn-setup !w-auto !min-h-[2.5rem] px-4"
            onClick={onBack}
          >
            Cancel
          </button>
        </div>
      </CricketBroadcastCard>
    </CricketPage>
  );
}

