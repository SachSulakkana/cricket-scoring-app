export const LANDING_TILE_IMAGES = {
  tournament: "/landing/tournament.png",
  player: "/landing/player.png",
  team: "/landing/team.png",
  calendar: "/landing/calendar.png",
  quickMatch: "/landing/quick-match.png",
  comingSoon: "/landing/coming-soon.svg",
  settings: "/landing/settings.png",
} as const;

export type LandingTileImageKey = keyof typeof LANDING_TILE_IMAGES;
