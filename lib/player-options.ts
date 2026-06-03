import {
  BattingStyle,
  BowlingStyle,
  PlayerGender,
  PlayerRole,
} from "./cricket-types";

export const GENDER_OPTIONS: { value: PlayerGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const ROLE_OPTIONS: { value: PlayerRole; label: string }[] = [
  { value: "batsman", label: "Batsman" },
  { value: "bowler", label: "Bowler" },
  { value: "all-rounder", label: "All-rounder" },
  { value: "wicket-keeper", label: "Wicket Keeper" },
];

export const BATTING_STYLE_OPTIONS: { value: BattingStyle; label: string }[] = [
  { value: "right-hand", label: "Right-hand bat" },
  { value: "left-hand", label: "Left-hand bat" },
];

export const BOWLING_STYLE_OPTIONS: { value: BowlingStyle; label: string }[] = [
  { value: "none", label: "Does not bowl" },
  { value: "right-arm-fast", label: "Right-arm fast" },
  { value: "right-arm-medium", label: "Right-arm medium" },
  { value: "right-arm-off-spin", label: "Right-arm off spin" },
  { value: "right-arm-leg-spin", label: "Right-arm leg spin" },
  { value: "left-arm-fast", label: "Left-arm fast" },
  { value: "left-arm-medium", label: "Left-arm medium" },
  { value: "left-arm-orthodox", label: "Left-arm orthodox" },
  { value: "left-arm-chinaman", label: "Left-arm chinaman" },
];

export function formatPlayerRole(role: PlayerRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function formatPlayerGender(gender: PlayerGender) {
  return GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? gender;
}

export function formatBattingStyle(style: BattingStyle) {
  return BATTING_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
}

export function formatBowlingStyle(style: BowlingStyle) {
  return BOWLING_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
}
