export const routes = {
  home: "/",
  live: "/live",
  liveWatch: "/live/watch",
  liveEmbed: "/live/embed",
  liveEmbedPreview: "/live/embed/preview",
  liveEmbedBatting: "/live/embed/batting",
  liveEmbedBowling: "/live/embed/bowling",
  liveEmbedPoints: "/live/embed/points",
  liveEmbedNextMatch: "/live/embed/next-match",
  liveEmbedUpcoming: "/live/embed/upcoming",
  liveEmbedBattingStats: "/live/embed/batting-stats",
  liveEmbedBowlingStats: "/live/embed/bowling-stats",
  settings: "/settings",
  quickMatch: "/quick-match",
  quickMatchHistory: "/quick-match/history",
  players: "/players",
  createPlayer: "/players/new",
  editPlayer: (id: string) => `/players/${encodeURIComponent(id)}/edit`,
  teams: "/teams",
  createTeam: "/teams/new",
  editTeam: (id: string) => `/teams/${encodeURIComponent(id)}/edit`,
  createTournament: "/tournament/create",
  playTournament: "/tournament/play",
  playTournamentNew: "/tournament/play/new",
  playTournamentNewCustom: "/tournament/play/new/custom",
  playCustomTournament: (id: string) =>
    `/tournament/play/custom/${encodeURIComponent(id)}`,
  playCustomTournamentGame: (id: string) =>
    `/tournament/play/custom/${encodeURIComponent(id)}/game`,
  playCustomTournamentMatch: (id: string, fixtureId: string) =>
    `/tournament/play/custom/${encodeURIComponent(id)}/game/${encodeURIComponent(fixtureId)}`,
} as const;

export const RETURN_TO_PARAM = "returnTo";

/** Append a safe in-app return path for back navigation. */
export function withReturnTo(route: string, returnTo: string): string {
  const safe = getSafeReturnTo(returnTo);
  if (!safe) return route;
  const [path, query = ""] = route.split("?");
  const params = new URLSearchParams(query);
  params.set(RETURN_TO_PARAM, safe);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Read and validate a return path from the query string (internal paths only). */
export function getSafeReturnTo(
  value: string | null | undefined
): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

/** Prefer returnTo when present, otherwise fall back to the default route. */
export function resolveBackRoute(
  defaultRoute: string,
  returnTo: string | null
): string {
  return returnTo ?? defaultRoute;
}

export type SpectatorUrlContext = {
  tournamentId?: string;
  fixtureId?: string;
};

function getSpectatorOrigin(origin?: string): string {
  return origin ?? (typeof window !== "undefined" ? window.location.origin : "");
}

function buildSpectatorQuery(context?: SpectatorUrlContext): string {
  const params = new URLSearchParams();
  if (context?.tournamentId) {
    params.set("tournament", context.tournamentId);
  }
  if (context?.fixtureId) {
    params.set("fixture", context.fixtureId);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function getSpectatorUrl(
  path: string,
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return `${getSpectatorOrigin(origin)}${path}${buildSpectatorQuery(context)}`;
}

/** Full URL for the read-only spectator view (pass origin on server if needed). */
export function getSpectatorLiveUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveWatch, origin, context);
}

/** Full URL for the OBS / stream overlay score bar. */
export function getSpectatorEmbedUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbed, origin, context);
}

/** Full URL for the in-app stream overlay preview (black background). */
export function getSpectatorEmbedPreviewUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedPreview, origin, context);
}

/** Full URL for the OBS batting scorecard overlay (current innings). */
export function getSpectatorEmbedBattingUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedBatting, origin, context);
}

/** Full URL for the OBS bowling scorecard overlay (current innings). */
export function getSpectatorEmbedBowlingUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedBowling, origin, context);
}

/** Full URL for the OBS tournament points table overlay. */
export function getSpectatorEmbedPointsUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedPoints, origin, context);
}

/** Full URL for the OBS next match overlay. */
export function getSpectatorEmbedNextMatchUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedNextMatch, origin, context);
}

/** Full URL for the OBS upcoming match preview overlay. */
export function getSpectatorEmbedUpcomingUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedUpcoming, origin, context);
}

/** Full URL for the OBS tournament top batting stats overlay. */
export function getSpectatorEmbedBattingStatsUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedBattingStats, origin, context);
}

/** Full URL for the OBS tournament top bowling stats overlay. */
export function getSpectatorEmbedBowlingStatsUrl(
  origin?: string,
  context?: SpectatorUrlContext
): string {
  return getSpectatorUrl(routes.liveEmbedBowlingStats, origin, context);
}
