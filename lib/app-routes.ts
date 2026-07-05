export const routes = {
  home: "/",
  live: "/live",
  liveWatch: "/live/watch",
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
  playTournamentPreset: (preset: string) =>
    `/tournament/play/${encodeURIComponent(preset)}`,
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

/** Full URL for the read-only spectator view (pass origin on server if needed). */
export function getSpectatorLiveUrl(origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${routes.liveWatch}`;
}
