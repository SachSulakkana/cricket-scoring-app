import type { ExtraType, InningsData } from "./cricket-types";
import {
  countsAsBowlerWicket,
  countsAsDelivery,
  countsAsLegalBall,
  countsAsWicket,
} from "./cricket-types";

export function getInningsRuns(innings: InningsData | null): number {
  if (!innings) return 0;
  return innings.balls.reduce(
    (total, ball) => total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0),
    0
  );
}

export function getInningsWickets(innings: InningsData | null): number {
  if (!innings) return 0;
  return innings.balls.filter((ball) => countsAsWicket(ball.dismissal)).length;
}

export function getLegalBalls(innings: InningsData | null): number {
  if (!innings) return 0;
  return innings.balls.filter((ball) => countsAsLegalBall(ball)).length;
}

export function formatOversFromLegalBalls(
  legalBalls: number,
  ballsPerOver: number
): string {
  return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
}

export function getBatsmanRuns(innings: InningsData, batsmanName?: string): number {
  if (!batsmanName) return 0;
  return innings.balls.reduce((total, ball) => {
    if (ball.batsmanName !== batsmanName) return total;
    const noBallRuns =
      ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
    const overthrowRuns = ball.extra === "overthrow" ? ball.extraRuns : 0;
    return total + ball.runs + noBallRuns + overthrowRuns;
  }, 0);
}

export function getBowlerStats(innings: InningsData, bowlerName?: string) {
  if (!bowlerName) return { runsConceded: 0, wickets: 0 };

  return innings.balls.reduce(
    (stats, ball) => {
      if (ball.bowlerName !== bowlerName) return stats;

      const concededFromExtra =
        ball.extra === "wide" || ball.extra === "no-ball" ? ball.extraRuns : 0;
      const overthrowConceded =
        ball.extra === "overthrow" ? ball.extraRuns : 0;

      return {
        runsConceded:
          stats.runsConceded + ball.runs + concededFromExtra + overthrowConceded,
        wickets: stats.wickets + (countsAsBowlerWicket(ball.dismissal) ? 1 : 0),
      };
    },
    { runsConceded: 0, wickets: 0 }
  );
}

export function getCurrentOverProgress(
  innings: InningsData,
  ballsPerOver: number
): { overNumber: number; ballsInOver: number } {
  const legalBalls = getLegalBalls(innings);
  const overNumber = Math.floor(legalBalls / ballsPerOver);
  const ballsInOver = legalBalls % ballsPerOver;
  return { overNumber: overNumber + 1, ballsInOver };
}

export function getDismissalReplacementEnd(
  wasStrikerAtStart: boolean,
  completedRuns: number
): boolean {
  return completedRuns % 2 === 1 ? !wasStrikerAtStart : wasStrikerAtStart;
}

export function formatWicketBallChip(
  ball: InningsData["balls"][number]
): string {
  if (ball.dismissal === "run-out") {
    return ball.runs > 0 ? `${ball.runs}W` : "W";
  }
  return "W";
}

export function formatWideNoBallChip(
  extraRuns: number,
  suffix: "Wd" | "Nb"
): string {
  const runningRuns = Math.max(extraRuns - 1, 0);
  return runningRuns > 0 ? `${runningRuns}${suffix}` : suffix;
}

/** Number shown on a ball-by-ball chip (bye/leg-bye live in extraRuns). */
export function getBallChipRuns(ball: {
  runs: number;
  extra: ExtraType;
  extraRuns: number;
}): number {
  if (ball.extra === "overthrow") return ball.runs + ball.extraRuns;
  if (ball.extra !== "none") return ball.extraRuns;
  return ball.runs;
}

export function formatBallChip(ball: InningsData["balls"][number]): string {
  if (countsAsWicket(ball.dismissal)) {
    return formatWicketBallChip(ball);
  }
  if (ball.extra === "wide") return formatWideNoBallChip(ball.extraRuns, "Wd");
  if (ball.extra === "no-ball") return formatWideNoBallChip(ball.extraRuns, "Nb");
  if (ball.extra === "bye") return `${ball.extraRuns}B`;
  if (ball.extra === "leg-bye") return `${ball.extraRuns}Lb`;
  if (ball.extra === "overthrow") return `${ball.runs + ball.extraRuns}`;
  if (ball.runs === 0) return "·";
  return `${ball.runs}`;
}

/** Compact labels for broadcast-style score bar (Nb, Wd, W, 0, etc.). */
export function formatBroadcastBallChip(
  ball: InningsData["balls"][number]
): string {
  if (countsAsWicket(ball.dismissal)) {
    return formatWicketBallChip(ball);
  }
  if (ball.extra === "wide") return formatWideNoBallChip(ball.extraRuns, "Wd");
  if (ball.extra === "no-ball") return formatWideNoBallChip(ball.extraRuns, "Nb");
  if (ball.extra === "bye") return "B";
  if (ball.extra === "leg-bye") return "Lb";
  if (ball.extra === "overthrow") return `${ball.runs + ball.extraRuns}`;
  return `${ball.runs}`;
}

export function getCurrentRunRate(
  innings: InningsData,
  ballsPerOver: number
): string {
  const legalBalls = getLegalBalls(innings);
  if (legalBalls === 0) return "0.00";
  const runs = getInningsRuns(innings);
  const rate = (runs / legalBalls) * ballsPerOver;
  return rate.toFixed(2);
}

export function getBatsmanBalls(
  innings: InningsData,
  batsmanName?: string
): number {
  if (!batsmanName) return 0;
  return innings.balls.reduce((count, ball) => {
    if (ball.batsmanName !== batsmanName) return count;
    if (ball.extra === "wide" || ball.dismissal === "retired-hurt") return count;
    return count + 1;
  }, 0);
}

export function getBowlerOversBowled(
  innings: InningsData,
  bowlerName: string | undefined,
  ballsPerOver: number
): string {
  if (!bowlerName) return "0.0";
  const legal = innings.balls.filter(
    (ball) => ball.bowlerName === bowlerName && countsAsLegalBall(ball)
  ).length;
  return formatOversFromLegalBalls(legal, ballsPerOver);
}

export function getBallsInCurrentOver(
  innings: InningsData,
  ballsPerOver: number
): InningsData["balls"] {
  const legalBalls = getLegalBalls(innings);
  if (legalBalls === 0) return [];

  // BallEntry stores overNumber as 0-based (first over = 0).
  let currentOverIndex = Math.floor(legalBalls / ballsPerOver);
  if (legalBalls % ballsPerOver === 0) {
    currentOverIndex -= 1;
  }

  const byStoredOver = innings.balls.filter(
    (ball) =>
      ball.overNumber === currentOverIndex && countsAsDelivery(ball)
  );
  if (byStoredOver.length > 0) return byStoredOver;

  // Fallback when overNumber indexing differs in older data.
  let legalSeen = 0;
  let startIndex = 0;
  const completedFullOvers =
    legalBalls % ballsPerOver === 0
      ? legalBalls / ballsPerOver - 1
      : Math.floor(legalBalls / ballsPerOver);

  for (let i = 0; i < innings.balls.length; i++) {
    const ball = innings.balls[i];
    const isLegal = countsAsLegalBall(ball);
    if (isLegal && legalSeen === completedFullOvers * ballsPerOver) {
      startIndex = i;
      break;
    }
    if (isLegal) {
      legalSeen++;
      if (legalSeen === completedFullOvers * ballsPerOver) {
        startIndex = i + 1;
        break;
      }
    }
  }

  return innings.balls
    .slice(startIndex)
    .filter((ball) => countsAsDelivery(ball));
}
