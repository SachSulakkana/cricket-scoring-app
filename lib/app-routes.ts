export const routes = {
  home: "/",
  live: "/live",
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

/** Opens the read-only spectator view in a new browser tab/window. */
export function openSpectatorView() {
  if (typeof window === "undefined") return;
  window.open(routes.live, "_blank", "noopener,noreferrer");
}
