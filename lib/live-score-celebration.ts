/** Full-screen 4 / 6 / wicket celebration GIF paths (public/). */
export const LIVE_SCORE_CELEBRATION_SRC = {
  four: "/celebrations/four.gif",
  six: "/celebrations/six.gif",
  wicket: "/celebrations/wicket.gif",
} as const;

export type LiveScoreCelebrationKind = keyof typeof LIVE_SCORE_CELEBRATION_SRC;

export const LIVE_SCORE_CELEBRATION_KINDS = Object.keys(
  LIVE_SCORE_CELEBRATION_SRC
) as LiveScoreCelebrationKind[];

/** How long the full-screen GIF celebration stays visible. */
export const LIVE_SCORE_CELEBRATION_DURATION_MS = 5000;
