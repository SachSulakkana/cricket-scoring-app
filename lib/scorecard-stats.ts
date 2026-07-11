import type { BallData, InningsData, MatchConfig, Team } from "./cricket-types";
import {
  countsAsBowlerWicket,
  countsAsWicket,
} from "./cricket-types";
import { formatWideNoBallChip } from "./spectator-live-stats";

export interface BattingRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  dismissal: string;
}

export interface BowlingRow {
  name: string;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
  economy: string;
}

export function calculateInningsTotal(innings: InningsData | null) {
  if (!innings) return { runs: 0, wickets: 0 };
  const runs = innings.balls.reduce(
    (total, ball) => total + ball.runs + (ball.extra !== "none" ? ball.extraRuns : 0),
    0
  );
  const wickets = innings.balls.filter((ball) => countsAsWicket(ball.dismissal)).length;
  return { runs, wickets };
}

export function calculateOvers(balls: BallData[], ballsPerOver: number) {
  const legalBalls = balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
  return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
}

export function calculateBatting(innings: InningsData | null, battingTeam: Team) {
  if (!innings) return [] as BattingRow[];

  const rows = battingTeam.players.map((player) => {
    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;
    let dismissal = "not out";

    innings.balls.forEach((ball) => {
      if (ball.batsmanName !== player.name) return;
      const noBallBatRuns =
        ball.extra === "no-ball" ? Math.max(ball.extraRuns - 1, 0) : 0;
      const overthrowRuns =
        ball.extra === "overthrow" ? ball.extraRuns : 0;
      const batterRuns = ball.runs + noBallBatRuns + overthrowRuns;
      runs += batterRuns;
      if (ball.extra !== "wide" && ball.extra !== "no-ball") balls++;
      if (batterRuns === 4) fours++;
      if (batterRuns === 6) sixes++;
    });

    const strikeRate = balls > 0 ? ((runs * 100) / balls).toFixed(2) : "0.00";

    const dismissalBall = innings.balls.find(
      (ball) => ball.dismissal !== "none" && ball.dismissedPlayer === player.name
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

    return {
      name: player.name,
      runs,
      balls,
      fours,
      sixes,
      strikeRate,
      dismissal,
    };
  });

  return rows.filter(
    (row) => row.runs > 0 || row.balls > 0 || row.dismissal !== "not out"
  );
}

export function calculateBowling(
  innings: InningsData | null,
  bowlingTeam: Team,
  ballsPerOver: number
) {
  if (!innings) return [] as BowlingRow[];

  const rows = bowlingTeam.players.map((player) => {
    let balls = 0;
    let runs = 0;
    let wickets = 0;
    let noBalls = 0;
    let wides = 0;
    const byOver: Record<number, number> = {};

    innings.balls.forEach((ball) => {
      if (ball.bowlerName !== player.name) return;
      const legalBall = ball.extra !== "wide" && ball.extra !== "no-ball";
      if (legalBall) {
        balls++;
        byOver[ball.overNumber] = (byOver[ball.overNumber] || 0) + ball.runs;
      } else {
        byOver[ball.overNumber] = (byOver[ball.overNumber] || 0) + ball.extraRuns;
      }
      const concededFromExtra =
        ball.extra === "wide" || ball.extra === "no-ball" ? ball.extraRuns : 0;
      const overthrowConceded =
        ball.extra === "overthrow" ? ball.extraRuns : 0;
      runs += ball.runs + concededFromExtra + overthrowConceded;
      if (ball.extra === "no-ball") noBalls += ball.extraRuns;
      if (ball.extra === "wide") wides += ball.extraRuns;
      if (countsAsBowlerWicket(ball.dismissal)) wickets++;
    });

    const maidens = Object.values(byOver).filter((overRuns) => overRuns === 0).length;
    const economy = balls > 0 ? (runs / (balls / ballsPerOver)).toFixed(2) : "0.00";

    return { name: player.name, balls, maidens, runs, wickets, noBalls, wides, economy };
  });

  return rows.filter((row) => row.balls > 0 || row.runs > 0 || row.wickets > 0);
}

export function calculateExtras(innings: InningsData | null) {
  if (!innings) return { wide: 0, noBall: 0, bye: 0, legBye: 0, total: 0 };

  const extras = innings.balls.reduce(
    (acc, ball) => {
      if (ball.extra === "wide") acc.wide += ball.extraRuns;
      if (ball.extra === "no-ball") acc.noBall += ball.extraRuns;
      if (ball.extra === "bye") acc.bye += ball.extraRuns;
      if (ball.extra === "leg-bye") acc.legBye += ball.extraRuns;
      return acc;
    },
    { wide: 0, noBall: 0, bye: 0, legBye: 0 }
  );

  return {
    ...extras,
    total: extras.wide + extras.noBall + extras.bye + extras.legBye,
  };
}

export function getBowlerBallByBall(innings: InningsData, bowlerName: string) {
  return innings.balls
    .filter((ball) => ball.bowlerName === bowlerName)
    .map((ball) => {
      if (countsAsWicket(ball.dismissal)) {
        if (ball.dismissal === "run-out") {
          return ball.runs > 0 ? `${ball.runs}W` : "W";
        }
        return "W";
      }
      if (ball.dismissal === "retired-hurt") return "RH";
      if (ball.extra === "wide") return formatWideNoBallChip(ball.extraRuns, "Wd");
      if (ball.extra === "no-ball") return formatWideNoBallChip(ball.extraRuns, "Nb");
      if (ball.extra === "bye") return `${ball.extraRuns}B`;
      if (ball.extra === "leg-bye") return `${ball.extraRuns}Lb`;
      if (ball.extra === "overthrow") return `${ball.runs + ball.extraRuns}OT`;
      return `${ball.runs}`;
    });
}

export function resolveBattingBowlingTeams(
  innings: InningsData,
  team1: Team,
  team2: Team
): { battingTeam: Team; bowlingTeam: Team } {
  if (innings.teamId === team1.id) {
    return { battingTeam: team1, bowlingTeam: team2 };
  }
  if (innings.teamId === team2.id) {
    return { battingTeam: team2, bowlingTeam: team1 };
  }
  const battingTeam =
    team1.players.some((p) => p.name === innings.balls[0]?.batsmanName)
      ? team1
      : team2;
  const bowlingTeam = battingTeam.id === team1.id ? team2 : team1;
  return { battingTeam, bowlingTeam };
}

export type { MatchConfig };

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

export function getLegalBallCount(balls: BallData[]) {
  return balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
}
