import { z } from "zod";

const playerRoleSchema = z.enum([
  "batsman",
  "bowler",
  "all-rounder",
  "wicket-keeper",
]);

const playerGenderSchema = z.enum(["male", "female", "other"]);
const battingStyleSchema = z.enum(["right-hand", "left-hand"]);
const bowlingStyleSchema = z.enum([
  "none",
  "right-arm-fast",
  "right-arm-medium",
  "right-arm-off-spin",
  "right-arm-leg-spin",
  "left-arm-fast",
  "left-arm-medium",
  "left-arm-orthodox",
  "left-arm-chinaman",
]);

const tournamentStageStyleSchema = z.enum([
  "round-robin",
  "league",
  "knockout",
  "group-stage",
  "playoffs",
]);

export const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  role: playerRoleSchema,
  gender: playerGenderSchema,
  age: z.number().int().min(1).max(100).optional(),
  battingStyle: battingStyleSchema,
  bowlingStyle: bowlingStyleSchema,
  imageUrl: z.string().max(500_000).optional(),
});

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  ownerName: z.string().max(120).optional(),
  logoUrl: z.string().max(500_000).optional(),
  players: z.array(playerSchema).max(30),
});

export const tournamentStageSchema = z.object({
  style: tournamentStageStyleSchema,
  groupCount: z.number().int().optional(),
});

export const tournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  totalOvers: z.number().int().min(1).max(100),
  ballsPerOver: z.number().int().min(1).max(12),
  teamCount: z.number().int().min(2).max(64),
  stageCount: z.number().int().min(0).max(10),
  stages: z.array(tournamentStageSchema),
  selectedTeamIds: z.array(z.string()),
  fixtures: z.array(z.unknown()).max(500),
  createdAt: z.string(),
  isTemplate: z.boolean().optional(),
  templateId: z.string().optional(),
  formatPresetId: z.string().optional(),
  currentStageIndex: z.number().int().optional(),
  groupAssignments: z.record(z.string()).optional(),
  championTeamId: z.string().optional(),
  stageComplete: z.array(z.boolean()).optional(),
});

export const playersImportSchema = z.object({
  players: z.array(playerSchema).max(500),
});

export const teamsImportSchema = z.object({
  teams: z.array(teamSchema).max(100),
});

export const rosterMigrateSchema = z.object({
  players: z.array(playerSchema).max(500).default([]),
  teams: z.array(teamSchema).max(100).default([]),
  tournaments: z.array(tournamentSchema).max(50).default([]),
});

export const dataClearSchema = z.object({
  action: z.enum([
    "match-history",
    "match-data",
    "teams",
    "players",
    "all",
  ]),
});

export const liveMatchMetaSchema = z
  .object({
    kind: z.enum(["quick", "tournament"]),
    tournamentId: z.string().optional(),
    fixtureId: z.string().optional(),
    label: z.string().optional(),
  })
  .nullable();

export const liveDraftPutSchema = z.object({
  matchState: z.record(z.unknown()),
  meta: liveMatchMetaSchema,
  updatedAt: z.string().min(1),
});

export const quickMatchPostSchema = z.object({
  matchState: z.record(z.unknown()),
  label: z.string().max(200).optional(),
});
