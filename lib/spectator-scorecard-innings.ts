import type { BallData, InningsData, MatchState, Team } from "@/lib/cricket-types";
import {
  calculateBowling,
  calculateExtras,
  calculateInningsTotal,
} from "@/lib/scorecard-stats";

export function formatDismissalShort(ball: BallData): string {
  if (ball.dismissal === "bowled") return `b ${ball.bowlerName}`;
  if (ball.dismissal === "lbw") return `lbw b ${ball.bowlerName}`;
  if (ball.dismissal === "caught")
    return `c ${ball.fielderName || "?"} b ${ball.bowlerName}`;
  if (ball.dismissal === "stumped")
    return `st ${ball.fielderName || "?"} b ${ball.bowlerName}`;
  if (ball.dismissal === "run-out")
    return `run out (${ball.fielderName || "?"})`;
  if (ball.dismissal === "retired-hurt") return "retired hurt";
  return ball.dismissal;
}

function getLegalBallCount(balls: BallData[]) {
  return balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
}

export function calculateOvers(balls: BallData[], ballsPerOver: number) {
  const legalBalls = getLegalBallCount(balls);
  return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
}

export function calculateRunRate(
  balls: BallData[],
  runs: number,
  ballsPerOver: number
) {
  const legalBalls = getLegalBallCount(balls);
  if (legalBalls === 0) return "0.00";
  return (runs / (legalBalls / ballsPerOver)).toFixed(2);
}

export function buildBattingRows(innings: InningsData, battingTeam: Team) {
  return battingTeam.players.map((player) => {
    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;
    let dismissal = "not out";

    innings.balls.forEach((ball) => {
      if (ball.batsmanName !== player.name) return;

      const noBallBatRuns =
        ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
      const overthrowRuns = ball.extra === "overthrow" ? ball.extraRuns : 0;
      const batterRuns = ball.runs + noBallBatRuns + overthrowRuns;
      runs += batterRuns;

      if (ball.extra !== "wide" && ball.extra !== "no-ball") balls++;
      if (batterRuns === 4) fours++;
      if (batterRuns === 6) sixes++;
    });

    const dismissalBall = innings.balls.find(
      (ball) =>
        ball.dismissal !== "none" && ball.dismissedPlayer === player.name
    );
    if (dismissalBall) {
      if (dismissalBall.dismissal === "bowled")
        dismissal = `Bowled by ${dismissalBall.bowlerName}`;
      else if (dismissalBall.dismissal === "lbw")
        dismissal = `LBW by ${dismissalBall.bowlerName}`;
      else if (dismissalBall.dismissal === "caught")
        dismissal = `Caught by ${dismissalBall.fielderName || "Unknown"}, bowled by ${dismissalBall.bowlerName}`;
      else if (dismissalBall.dismissal === "stumped")
        dismissal = `Stumped by ${dismissalBall.fielderName || "Unknown"}, bowled by ${dismissalBall.bowlerName}`;
      else if (dismissalBall.dismissal === "retired-hurt")
        dismissal = "Retired hurt";
      else dismissal = `Run out by ${dismissalBall.fielderName || "Unknown"}`;
    }

    const strikeRate = balls > 0 ? ((runs * 100) / balls).toFixed(2) : "0.00";

    return {
      playerId: player.id,
      name: player.name,
      runs,
      balls,
      fours,
      sixes,
      strikeRate,
      dismissal,
    };
  });
}

export function getBattingOrder(
  innings: InningsData,
  battingTeam: Team
): string[] {
  const order: string[] = [];
  const seen = new Set<string>();

  const addById = (playerId?: string) => {
    if (!playerId || seen.has(playerId)) return;
    if (!battingTeam.players.some((player) => player.id === playerId)) return;
    seen.add(playerId);
    order.push(playerId);
  };

  const addByName = (name?: string) => {
    if (!name) return;
    const player = battingTeam.players.find((p) => p.name === name);
    if (player) addById(player.id);
  };

  if (innings.balls.length === 0) {
    addById(innings.strikerPlayerId);
    addById(innings.nonStrikerPlayerId);
    return order;
  }

  for (const ball of innings.balls) {
    addByName(ball.batsmanName);
    if (ball.dismissal !== "none") {
      addByName(ball.dismissedPlayer);
    }
  }

  addById(innings.strikerPlayerId);
  addById(innings.nonStrikerPlayerId);

  return order;
}

export function getBattingDisplay(innings: InningsData, battingTeam: Team) {
  const allRows = buildBattingRows(innings, battingTeam);
  const rowById = new Map(allRows.map((row) => [row.playerId, row]));
  const atCrease = new Set([
    innings.strikerPlayerId,
    innings.nonStrikerPlayerId,
  ]);

  const battingOrder = getBattingOrder(innings, battingTeam);
  const displayed = battingOrder
    .map((playerId) => rowById.get(playerId))
    .filter((row): row is (typeof allRows)[number] => !!row);

  const battedIds = new Set(battingOrder);
  const yetToBat = battingTeam.players
    .filter((player) => !battedIds.has(player.id))
    .map((player) => player.name);

  return { displayed, yetToBat, atCrease };
}

export interface InningsViewContext {
  inningsNumber: 1 | 2;
  innings: InningsData;
  battingTeam: Team;
  bowlingTeam: Team;
  ballsPerOver: number;
}

export function resolveCurrentInningsContext(
  matchState: MatchState
): InningsViewContext | null {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  if (matchState.currentInnings === 2 && matchState.innings2) {
    return {
      inningsNumber: 2,
      innings: matchState.innings2,
      battingTeam: matchState.team2,
      bowlingTeam: matchState.team1,
      ballsPerOver,
    };
  }
  if (matchState.innings1) {
    return {
      inningsNumber: 1,
      innings: matchState.innings1,
      battingTeam: matchState.team1,
      bowlingTeam: matchState.team2,
      ballsPerOver,
    };
  }
  return null;
}

/** Always 1st innings (live during innings 1; completed card once innings 2 starts). */
export function resolveFirstInningsContext(
  matchState: MatchState
): InningsViewContext | null {
  if (!matchState.innings1) return null;
  return {
    inningsNumber: 1,
    innings: matchState.innings1,
    battingTeam: matchState.team1,
    bowlingTeam: matchState.team2,
    ballsPerOver: matchState.config?.ballsPerOver ?? 6,
  };
}

export function getInningsHeader(
  ctx: InningsViewContext
): { label: string; score: string } {
  const totals = calculateInningsTotal(ctx.innings);
  const extras = calculateExtras(ctx.innings);
  const overs = calculateOvers(ctx.innings.balls, ctx.ballsPerOver);
  const runRate = calculateRunRate(
    ctx.innings.balls,
    totals.runs,
    ctx.ballsPerOver
  );
  const inningsLabel = `${ctx.battingTeam.name} ${ctx.inningsNumber === 1 ? "1st" : "2nd"} Innings`;
  return {
    label: inningsLabel,
    score: `${totals.runs}-${totals.wickets} (${overs} Ov · RR ${runRate})`,
  };
}

export function getBowlingRows(ctx: InningsViewContext) {
  return calculateBowling(ctx.innings, ctx.bowlingTeam, ctx.ballsPerOver);
}
