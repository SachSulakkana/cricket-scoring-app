export type DismissalType =
  | "bowled"
  | "lbw"
  | "caught"
  | "stumped"
  | "run-out"
  | "retired-hurt"
  | "none";

export function countsAsWicket(dismissal: DismissalType): boolean {
  return dismissal !== "none" && dismissal !== "retired-hurt";
}

export function countsAsBowlerWicket(dismissal: DismissalType): boolean {
  return countsAsWicket(dismissal) && dismissal !== "run-out";
}

/** Retired hurt is not a delivery — excluded from overs, balls faced, and bowler balls. */
export function countsAsDelivery(ball: {
  dismissal: DismissalType;
}): boolean {
  return ball.dismissal !== "retired-hurt";
}

export function countsAsLegalBall(ball: {
  extra: ExtraType;
  dismissal: DismissalType;
}): boolean {
  return (
    countsAsDelivery(ball) &&
    ball.extra !== "wide" &&
    ball.extra !== "no-ball"
  );
}

export type ExtraType = "wide" | "no-ball" | "bye" | "leg-bye" | "overthrow" | "none";

export type TournamentPreset = "T20" | "ODI" | "T10";

export interface BallData {
  id: string;
  runs: number;
  extra: ExtraType;
  extraRuns: number;
  dismissal: DismissalType;
  dismissedPlayer?: string;
  fielderName?: string;
  bowlerName: string;
  batsmanName: string;
  ballNumber: number;
  overNumber: number;
}

export type PlayerGender = "male" | "female" | "other";

export type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicket-keeper";

export type BattingStyle = "right-hand" | "left-hand";

export type BowlingStyle =
  | "none"
  | "right-arm-fast"
  | "right-arm-medium"
  | "right-arm-off-spin"
  | "right-arm-leg-spin"
  | "left-arm-fast"
  | "left-arm-medium"
  | "left-arm-orthodox"
  | "left-arm-chinaman";

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  gender: PlayerGender;
  age?: number;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerName?: string;
  logoUrl?: string;
  players: Player[];
}

export interface MatchConfig {
  totalOvers: number;
  ballsPerOver: number;
}

export interface InningsData {
  teamId: string;
  teamName: string;
  balls: BallData[];
  currentBatsmanIndex: number;
  currentBowlerIndex: number;
  strikerPlayerId: string;
  nonStrikerPlayerId: string;
  currentBowlerPlayerId: string;
  lastBowlerPlayerId?: string;
  /** Bowlers who have delivered in the current (incomplete) over — blocked from the next over. */
  currentOverBowlerPlayerIds?: string[];
}

export interface MatchState {
  team1: Team;
  team2: Team;
  config: MatchConfig | null;
  innings1: InningsData | null;
  innings2: InningsData | null;
  currentInnings: 1 | 2;
  matchStarted: boolean;
  superOver: SuperOverState | null;
}

export interface SuperOverState {
  ballsPerOver: number;
  /** Team that bats first in the super over (team2 from the main match). */
  firstBattingTeamId: string;
  innings1: InningsData | null;
  innings2: InningsData | null;
  currentInnings: 1 | 2;
  active: boolean;
  completed: boolean;
  /** Main match ended as a tie without a super over. */
  settledAsDraw: boolean;
}
