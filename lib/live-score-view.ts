import type { InningsData, MatchState, Player, Team } from "./cricket-types";
import { countsAsWicket } from "./cricket-types";
import { getMatchResult, isMatchComplete } from "./match-result";
import {
  formatBallChip,
  formatBroadcastBallChip,
  formatOversFromLegalBalls,
  getBallsInCurrentOver,
  getBatsmanBalls,
  getBatsmanRuns,
  getBowlerOversBowled,
  getBowlerStats,
  getCurrentOverProgress,
  getCurrentRunRate,
  getInningsRuns,
  getInningsWickets,
  getLegalBalls,
} from "./spectator-live-stats";

export function teamAbbrev(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);
  }
  return cleaned.slice(0, 3).toUpperCase();
}

/** Last word of a team name (e.g. "Qrio Falcons" → "Falcons"). */
export function teamLastName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.at(-1) ?? cleaned;
}

function getBattingTeam(matchState: MatchState): Team {
  return matchState.currentInnings === 1 ? matchState.team1 : matchState.team2;
}

function getBowlingTeam(matchState: MatchState): Team {
  return matchState.currentInnings === 1 ? matchState.team2 : matchState.team1;
}

export type LiveBatterRow = {
  name: string;
  runs: number;
  balls: number;
  isStriker: boolean;
};

export type LiveBallCircle = {
  id: string;
  label: string;
  broadcastLabel: string;
  variant: "dot" | "four" | "six" | "wicket" | "extra" | "runs" | "pending";
};

export type LiveChaseInfo = {
  target: number;
  runsNeeded: number;
  ballsRemaining: number;
  oversRemaining: string;
  currentRunRate: string;
  requiredRunRate: string;
  requiredLine: string;
};

function getBallCircleVariant(
  ball: InningsData["balls"][number]
): LiveBallCircle["variant"] {
  if (countsAsWicket(ball.dismissal) && ball.dismissal !== "retired-hurt") {
    return "wicket";
  }

  if (
    ball.extra === "wide" ||
    ball.extra === "no-ball" ||
    ball.extra === "bye" ||
    ball.extra === "leg-bye"
  ) {
    return "extra";
  }

  const scored =
    ball.extra === "overthrow" ? ball.runs + ball.extraRuns : ball.runs;
  if (scored === 0) return "dot";
  if (scored === 4) return "four";
  if (scored === 6) return "six";
  return "runs";
}

function buildOverBallCircles(
  innings: InningsData,
  ballsPerOver: number
): LiveBallCircle[] {
  const deliveries = getBallsInCurrentOver(innings, ballsPerOver);
  const circles: LiveBallCircle[] = deliveries.map((ball) => ({
    id: ball.id,
    label: formatBallChip(ball),
    broadcastLabel: formatBroadcastBallChip(ball),
    variant: getBallCircleVariant(ball),
  }));

  const { ballsInOver } = getCurrentOverProgress(innings, ballsPerOver);
  const legalBalls = getLegalBalls(innings);
  const overInProgress =
    legalBalls === 0 || legalBalls % ballsPerOver !== 0;

  if (overInProgress && ballsInOver < ballsPerOver) {
    circles.push({
      id: "pending",
      label: "",
      broadcastLabel: "",
      variant: "pending",
    });
  }

  return circles;
}

export type LiveScoreView =
  | { kind: "none" }
  | { kind: "empty"; message: string }
  | {
      kind: "waiting";
      matchState: MatchState;
      battingTeam: Team;
      bowlingTeam: Team;
      ticker: string;
    }
  | {
      kind: "inningsBreak";
      matchState: MatchState;
      battingTeam: Team;
      bowlingTeam: Team;
      innings1Runs: number;
      innings1Wickets: number;
      innings1Overs: string;
      ticker: string;
    }
  | {
      kind: "complete";
      matchState: MatchState;
      battingTeam: Team;
      bowlingTeam: Team;
      innings1Runs: number;
      innings1Wickets: number;
      innings2Runs: number;
      innings2Wickets: number;
      ticker: string;
    }
  | {
      kind: "live";
      matchState: MatchState;
      battingTeam: Team;
      bowlingTeam: Team;
      currentInnings: InningsData;
      ballsPerOver: number;
      batters: LiveBatterRow[];
      bowlerName: string;
      bowlerRuns: number;
      bowlerWickets: number;
      bowlerOvers: string;
      currentRuns: number;
      currentWickets: number;
      currentOvers: string;
      overBalls: LiveBallCircle[];
      chaseInfo: LiveChaseInfo | null;
      currentRunRate: string;
      ticker: string;
    };

function buildChaseInfo(matchState: MatchState): LiveChaseInfo | null {
  if (
    matchState.currentInnings !== 2 ||
    !matchState.innings1 ||
    !matchState.config ||
    isMatchComplete(matchState)
  ) {
    return null;
  }

  const ballsPerOver = matchState.config.ballsPerOver;
  const innings2 = matchState.innings2;
  if (!innings2) return null;

  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings2Runs = getInningsRuns(innings2);
  const target = innings1Runs + 1;
  const runsNeeded = Math.max(target - innings2Runs, 0);
  const totalLegalBalls = matchState.config.totalOvers * ballsPerOver;
  const ballsRemaining = Math.max(
    totalLegalBalls - getLegalBalls(innings2),
    0
  );
  const requiredRunRate =
    ballsRemaining > 0
      ? ((runsNeeded / ballsRemaining) * ballsPerOver).toFixed(2)
      : "0.00";
  const oversRemaining = formatOversFromLegalBalls(
    ballsRemaining,
    ballsPerOver
  );

  return {
    target,
    runsNeeded,
    ballsRemaining,
    oversRemaining,
    currentRunRate: getCurrentRunRate(innings2, ballsPerOver),
    requiredRunRate,
    requiredLine: `Required ${runsNeeded} runs in ${ballsRemaining} balls`,
  };
}

function buildChaseTicker(matchState: MatchState): string | null {
  if (
    matchState.currentInnings !== 2 ||
    !matchState.innings1 ||
    !matchState.config ||
    isMatchComplete(matchState)
  ) {
    return null;
  }

  const ballsPerOver = matchState.config.ballsPerOver;
  const innings1Runs = getInningsRuns(matchState.innings1);
  const innings2Runs = getInningsRuns(matchState.innings2);
  const target = innings1Runs + 1;
  const runsNeeded = Math.max(target - innings2Runs, 0);
  const totalLegalBalls = matchState.config.totalOvers * ballsPerOver;
  const ballsRemaining = Math.max(
    totalLegalBalls - getLegalBalls(matchState.innings2),
    0
  );
  const oversRemaining = formatOversFromLegalBalls(
    ballsRemaining,
    ballsPerOver
  );

  return `${matchState.team2.name} need ${runsNeeded} from ${oversRemaining} overs`;
}


function buildBatterRows(
  striker: Player | undefined,
  nonStriker: Player | undefined,
  innings: InningsData
): LiveBatterRow[] {
  const rows: LiveBatterRow[] = [];

  if (striker) {
    rows.push({
      name: striker.name,
      runs: getBatsmanRuns(innings, striker.name),
      balls: getBatsmanBalls(innings, striker.name),
      isStriker: true,
    });
  }

  if (nonStriker) {
    rows.push({
      name: nonStriker.name,
      runs: getBatsmanRuns(innings, nonStriker.name),
      balls: getBatsmanBalls(innings, nonStriker.name),
      isStriker: false,
    });
  }

  return rows;
}

export function deriveLiveScoreView(matchState: MatchState | null): LiveScoreView {
  if (!matchState?.matchStarted) {
    return { kind: "none" };
  }

  if (isMatchComplete(matchState)) {
    const result = getMatchResult(matchState);
    return {
      kind: "complete",
      matchState,
      battingTeam: getBattingTeam(matchState),
      bowlingTeam: getBowlingTeam(matchState),
      innings1Runs: getInningsRuns(matchState.innings1),
      innings1Wickets: getInningsWickets(matchState.innings1),
      innings2Runs: getInningsRuns(matchState.innings2),
      innings2Wickets: getInningsWickets(matchState.innings2),
      ticker: result.text.toUpperCase(),
    };
  }

  const currentInnings =
    matchState.currentInnings === 1
      ? matchState.innings1
      : matchState.innings2;

  if (!currentInnings) {
    return {
      kind: "waiting",
      matchState,
      battingTeam: getBattingTeam(matchState),
      bowlingTeam: getBowlingTeam(matchState),
      ticker: "MATCH STARTING SOON",
    };
  }

  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const battingTeam = getBattingTeam(matchState);
  const bowlingTeam = getBowlingTeam(matchState);

  const striker = battingTeam.players.find(
    (player) => player.id === currentInnings.strikerPlayerId
  );
  const nonStriker = battingTeam.players.find(
    (player) => player.id === currentInnings.nonStrikerPlayerId
  );
  const bowler = bowlingTeam.players.find(
    (player) => player.id === currentInnings.currentBowlerPlayerId
  );

  const lineupReady = Boolean(striker && bowler);
  if (!lineupReady) {
    const innings1Complete = Boolean(matchState.innings1?.balls.length);
    if (innings1Complete && matchState.currentInnings === 2) {
      const innings1Runs = getInningsRuns(matchState.innings1);
      const target = innings1Runs + 1;
      return {
        kind: "inningsBreak",
        matchState,
        battingTeam,
        bowlingTeam,
        innings1Runs,
        innings1Wickets: getInningsWickets(matchState.innings1),
        innings1Overs: formatOversFromLegalBalls(
          getLegalBalls(matchState.innings1),
          ballsPerOver
        ),
        ticker: `${matchState.team2.name.toUpperCase()} NEED ${target} TO WIN`,
      };
    }

    return {
      kind: "waiting",
      matchState,
      battingTeam,
      bowlingTeam,
      ticker: "LINEUP SETUP IN PROGRESS",
    };
  }

  const bowlerStats = getBowlerStats(currentInnings, bowler?.name);
  const chaseText = buildChaseTicker(matchState);
  const chaseInfo = buildChaseInfo(matchState);

  return {
    kind: "live",
    matchState,
    battingTeam,
    bowlingTeam,
    currentInnings,
    ballsPerOver,
    batters: buildBatterRows(striker, nonStriker, currentInnings),
    bowlerName: bowler?.name ?? "—",
    bowlerRuns: bowlerStats.runsConceded,
    bowlerWickets: bowlerStats.wickets,
    bowlerOvers: getBowlerOversBowled(
      currentInnings,
      bowler?.name,
      ballsPerOver
    ),
    currentRuns: getInningsRuns(currentInnings),
    currentWickets: getInningsWickets(currentInnings),
    currentOvers: formatOversFromLegalBalls(
      getLegalBalls(currentInnings),
      ballsPerOver
    ),
    overBalls: buildOverBallCircles(currentInnings, ballsPerOver),
    chaseInfo,
    currentRunRate: getCurrentRunRate(currentInnings, ballsPerOver),
    ticker:
      chaseText?.toUpperCase() ??
      `INNINGS ${matchState.currentInnings} · ${battingTeam.name.toUpperCase()} BATTING`,
  };
}
