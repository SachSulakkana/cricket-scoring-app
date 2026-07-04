import type { InningsData } from "./cricket-types";
import {
  countsAsBowlerWicket,
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
  return innings.balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
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

export function formatBallChip(ball: InningsData["balls"][number]): string {
  if (countsAsWicket(ball.dismissal)) return "W";
  if (ball.extra === "wide") return `${ball.extraRuns}Wd`;
  if (ball.extra === "no-ball") return `${ball.extraRuns}Nb`;
  if (ball.extra === "bye") return `${ball.extraRuns}B`;
  if (ball.extra === "leg-bye") return `${ball.extraRuns}Lb`;
  if (ball.extra === "overthrow") return `${ball.runs + ball.extraRuns}`;
  return `${ball.runs}`;
}
