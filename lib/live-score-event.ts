import type { BallData } from "./cricket-types";
import { countsAsWicket } from "./cricket-types";

export type LiveScoreEventKind =
  | "four"
  | "six"
  | "wicket"
  | "wide"
  | "no-ball"
  | "bye"
  | "leg-bye";

export type LiveScoreEvent = {
  kind: LiveScoreEventKind;
  label: string;
  sublabel?: string;
};

export function getLiveScoreEventFromBall(
  ball: BallData
): LiveScoreEvent | null {
  if (countsAsWicket(ball.dismissal) && ball.dismissal !== "retired-hurt") {
    return {
      kind: "wicket",
      label: "WICKET!",
      sublabel: ball.dismissedPlayer?.toUpperCase(),
    };
  }

  if (ball.extra === "wide") {
    return {
      kind: "wide",
      label: "WIDE",
      sublabel: ball.extraRuns > 0 ? `+${ball.extraRuns}` : undefined,
    };
  }

  if (ball.extra === "no-ball") {
    return {
      kind: "no-ball",
      label: "NO BALL",
      sublabel: ball.extraRuns > 0 ? `+${ball.extraRuns}` : undefined,
    };
  }

  if (ball.extra === "bye") {
    return {
      kind: "bye",
      label: "BYE",
      sublabel: ball.extraRuns > 0 ? `+${ball.extraRuns}` : undefined,
    };
  }

  if (ball.extra === "leg-bye") {
    return {
      kind: "leg-bye",
      label: "LEG BYE",
      sublabel: ball.extraRuns > 0 ? `+${ball.extraRuns}` : undefined,
    };
  }

  const scored =
    ball.extra === "overthrow" ? ball.runs + ball.extraRuns : ball.runs;
  if (scored === 4) {
    return { kind: "four", label: "FOUR!" };
  }
  if (scored === 6) {
    return { kind: "six", label: "SIX!" };
  }

  return null;
}
