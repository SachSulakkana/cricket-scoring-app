export const LANDING_TILE_IMAGES = {
  tournament: "/landing/tournament.svg",
  player: "/landing/player.svg",
  team: "/landing/team.svg",
  calendar: "/landing/calendar.svg",
  quickMatch: "/landing/quick-match.svg",
  comingSoon: "/landing/coming-soon.svg",
  settings: "/landing/settings.svg",
} as const;

export type LandingTileImageKey = keyof typeof LANDING_TILE_IMAGES;
