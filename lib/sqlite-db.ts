import "server-only";

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { DataClearAction } from "./data-clear-types";
import type { Player, Team } from "./cricket-types";
import type { TournamentStageConfig } from "./tournament-stage-options";

/** Tournament document stored in SQLite (normalized on the client). */
export interface DbTournament {
  id: string;
  name: string;
  totalOvers: number;
  ballsPerOver: number;
  teamCount: number;
  stageCount: number;
  stages: TournamentStageConfig[];
  selectedTeamIds: string[];
  fixtures: unknown[];
  createdAt: string;
  isTemplate?: boolean;
  templateId?: string;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "cricket.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER,
      batting_style TEXT NOT NULL,
      bowling_style TEXT NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_name TEXT,
      logo_url TEXT,
      players_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_overs INTEGER NOT NULL,
      balls_per_over INTEGER NOT NULL,
      team_count INTEGER NOT NULL,
      stage_count INTEGER NOT NULL,
      stages_json TEXT NOT NULL DEFAULT '[]',
      selected_team_ids_json TEXT NOT NULL DEFAULT '[]',
      fixtures_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_match_draft (
      id TEXT PRIMARY KEY DEFAULT 'current',
      state_json TEXT NOT NULL,
      meta_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_matches (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      label TEXT,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  migrateTournamentColumns(database);
}

function migrateTournamentColumns(database: Database.Database) {
  const columns = database
    .prepare("PRAGMA table_info(tournaments)")
    .all() as { name: string }[];
  const names = new Set(columns.map((c) => c.name));
  if (!names.has("is_template")) {
    database.exec(
      "ALTER TABLE tournaments ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0"
    );
  }
  if (!names.has("template_id")) {
    database.exec("ALTER TABLE tournaments ADD COLUMN template_id TEXT");
  }
}

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as Player["role"],
    gender: row.gender as Player["gender"],
    age: row.age != null ? Number(row.age) : undefined,
    battingStyle: row.batting_style as Player["battingStyle"],
    bowlingStyle: row.bowling_style as Player["bowlingStyle"],
    imageUrl: (row.image_url as string) || undefined,
  };
}

function playerToRow(player: Player) {
  return {
    id: player.id,
    name: player.name,
    role: player.role,
    gender: player.gender,
    age: player.age ?? null,
    batting_style: player.battingStyle,
    bowling_style: player.bowlingStyle,
    image_url: player.imageUrl ?? null,
  };
}

function rowToTeam(row: Record<string, unknown>): Team {
  let players: Player[] = [];
  try {
    players = JSON.parse((row.players_json as string) || "[]") as Player[];
  } catch {
    players = [];
  }
  return {
    id: row.id as string,
    name: row.name as string,
    ownerName: (row.owner_name as string) || undefined,
    logoUrl: (row.logo_url as string) || undefined,
    players,
  };
}

function teamToRow(team: Team) {
  return {
    id: team.id,
    name: team.name,
    owner_name: team.ownerName ?? null,
    logo_url: team.logoUrl ?? null,
    players_json: JSON.stringify(team.players),
  };
}

function rowToTournament(row: Record<string, unknown>): DbTournament {
  const parse = <T>(raw: string, fallback: T): T => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id as string,
    name: row.name as string,
    totalOvers: Number(row.total_overs),
    ballsPerOver: Number(row.balls_per_over),
    teamCount: Number(row.team_count),
    stageCount: Number(row.stage_count),
    stages: parse((row.stages_json as string) || "[]", []),
    selectedTeamIds: parse((row.selected_team_ids_json as string) || "[]", []),
    fixtures: parse((row.fixtures_json as string) || "[]", []),
    createdAt: row.created_at as string,
    isTemplate: Number(row.is_template ?? 0) === 1,
    templateId: (row.template_id as string) || undefined,
  };
}

function tournamentToRow(tournament: DbTournament) {
  return {
    id: tournament.id,
    name: tournament.name,
    total_overs: tournament.totalOvers,
    balls_per_over: tournament.ballsPerOver,
    team_count: tournament.teamCount,
    stage_count: tournament.stageCount,
    stages_json: JSON.stringify(tournament.stages),
    selected_team_ids_json: JSON.stringify(tournament.selectedTeamIds),
    fixtures_json: JSON.stringify(tournament.fixtures),
    created_at: tournament.createdAt,
    is_template: tournament.isTemplate ? 1 : 0,
    template_id: tournament.templateId ?? null,
  };
}

const upsertPlayerStmt = () =>
  getDb().prepare(`
    INSERT INTO players (
      id, name, role, gender, age, batting_style, bowling_style, image_url
    ) VALUES (
      @id, @name, @role, @gender, @age, @batting_style, @bowling_style, @image_url
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      gender = excluded.gender,
      age = excluded.age,
      batting_style = excluded.batting_style,
      bowling_style = excluded.bowling_style,
      image_url = excluded.image_url
  `);

const upsertTeamStmt = () =>
  getDb().prepare(`
    INSERT INTO teams (id, name, owner_name, logo_url, players_json)
    VALUES (@id, @name, @owner_name, @logo_url, @players_json)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      owner_name = excluded.owner_name,
      logo_url = excluded.logo_url,
      players_json = excluded.players_json
  `);

const upsertTournamentStmt = () =>
  getDb().prepare(`
    INSERT INTO tournaments (
      id, name, total_overs, balls_per_over, team_count, stage_count,
      stages_json, selected_team_ids_json, fixtures_json, created_at,
      is_template, template_id
    ) VALUES (
      @id, @name, @total_overs, @balls_per_over, @team_count, @stage_count,
      @stages_json, @selected_team_ids_json, @fixtures_json, @created_at,
      @is_template, @template_id
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      total_overs = excluded.total_overs,
      balls_per_over = excluded.balls_per_over,
      team_count = excluded.team_count,
      stage_count = excluded.stage_count,
      stages_json = excluded.stages_json,
      selected_team_ids_json = excluded.selected_team_ids_json,
      fixtures_json = excluded.fixtures_json,
      created_at = excluded.created_at,
      is_template = excluded.is_template,
      template_id = excluded.template_id
  `);

export function sqliteListPlayers(): Player[] {
  const rows = getDb().prepare("SELECT * FROM players ORDER BY name").all();
  return rows.map((row) => rowToPlayer(row as Record<string, unknown>));
}

export function sqliteGetPlayer(id: string): Player | undefined {
  const row = getDb().prepare("SELECT * FROM players WHERE id = ?").get(id);
  return row ? rowToPlayer(row as Record<string, unknown>) : undefined;
}

export function sqliteSavePlayer(player: Player) {
  upsertPlayerStmt().run(playerToRow(player));
}

export function sqliteBulkImportPlayers(players: Player[]): number {
  if (players.length === 0) return 0;
  const database = getDb();
  const run = database.transaction((items: Player[]) => {
    for (const player of items) {
      upsertPlayerStmt().run(playerToRow(player));
    }
  });
  run(players);
  return players.length;
}

export function sqliteDeletePlayer(playerId: string) {
  const database = getDb();
  database.prepare("DELETE FROM players WHERE id = ?").run(playerId);
  for (const team of sqliteListTeams()) {
    if (team.players.some((p) => p.id === playerId)) {
      sqliteSaveTeam({
        ...team,
        players: team.players.filter((p) => p.id !== playerId),
      });
    }
  }
}

export function sqliteSyncPlayerInTeams(player: Player) {
  for (const team of sqliteListTeams()) {
    if (team.players.some((p) => p.id === player.id)) {
      sqliteSaveTeam({
        ...team,
        players: team.players.map((p) => (p.id === player.id ? player : p)),
      });
    }
  }
}

export function sqliteListTeams(): Team[] {
  const rows = getDb().prepare("SELECT * FROM teams ORDER BY name").all();
  return rows.map((row) => rowToTeam(row as Record<string, unknown>));
}

export function sqliteGetTeam(id: string): Team | undefined {
  const row = getDb().prepare("SELECT * FROM teams WHERE id = ?").get(id);
  return row ? rowToTeam(row as Record<string, unknown>) : undefined;
}

export function sqliteSaveTeam(team: Team) {
  upsertTeamStmt().run(teamToRow(team));
}

export function sqliteBulkImportTeams(teams: Team[]): number {
  if (teams.length === 0) return 0;
  const database = getDb();
  const run = database.transaction((items: Team[]) => {
    for (const team of items) {
      upsertTeamStmt().run(teamToRow(team));
    }
  });
  run(teams);
  return teams.length;
}

export function sqliteDeleteTeam(teamId: string) {
  getDb().prepare("DELETE FROM teams WHERE id = ?").run(teamId);
}

export function sqliteListTournaments(): DbTournament[] {
  const rows = getDb()
    .prepare("SELECT * FROM tournaments ORDER BY created_at DESC")
    .all();
  return rows.map((row) => rowToTournament(row as Record<string, unknown>));
}

export function sqliteGetTournament(id: string): DbTournament | undefined {
  const row = getDb().prepare("SELECT * FROM tournaments WHERE id = ?").get(id);
  return row ? rowToTournament(row as Record<string, unknown>) : undefined;
}

export function sqliteSaveTournament(tournament: DbTournament) {
  upsertTournamentStmt().run(tournamentToRow(tournament));
}

export function sqliteDeleteTournament(tournamentId: string) {
  getDb().prepare("DELETE FROM tournaments WHERE id = ?").run(tournamentId);
}

export function sqliteLoadAll() {
  return {
    players: sqliteListPlayers(),
    teams: sqliteListTeams(),
    tournaments: sqliteListTournaments(),
  };
}

export function sqliteMigrateFromLegacy(data: {
  players: Player[];
  teams: Team[];
  tournaments: DbTournament[];
}) {
  const database = getDb();
  const migrate = database.transaction(() => {
    for (const player of data.players) {
      upsertPlayerStmt().run(playerToRow(player));
    }
    for (const team of data.teams) {
      upsertTeamStmt().run(teamToRow(team));
    }
    for (const tournament of data.tournaments) {
      upsertTournamentStmt().run(tournamentToRow(tournament));
    }
    database
      .prepare(
        `INSERT INTO meta (key, value) VALUES ('legacy_migrated', '1')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run();
  });
  migrate();
}

export function sqliteIsLegacyMigrated(): boolean {
  const row = getDb()
    .prepare("SELECT value FROM meta WHERE key = 'legacy_migrated'")
    .get() as { value: string } | undefined;
  return row?.value === "1";
}

export function sqliteDbPath(): string {
  return DB_PATH;
}

export interface SqliteLiveMatchDraft {
  matchState: unknown;
  meta: unknown;
  updatedAt: string;
}

export function sqliteGetLiveMatchDraft(): SqliteLiveMatchDraft | null {
  const row = getDb()
    .prepare("SELECT state_json, meta_json, updated_at FROM live_match_draft WHERE id = 'current'")
    .get() as
    | { state_json: string; meta_json: string; updated_at: string }
    | undefined;
  if (!row) return null;
  try {
    return {
      matchState: JSON.parse(row.state_json),
      meta: JSON.parse(row.meta_json),
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

export function sqliteSaveLiveMatchDraft(
  matchState: unknown,
  meta: unknown,
  updatedAt: string
) {
  getDb()
    .prepare(
      `INSERT INTO live_match_draft (id, state_json, meta_json, updated_at)
       VALUES ('current', @state_json, @meta_json, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         state_json = excluded.state_json,
         meta_json = excluded.meta_json,
         updated_at = excluded.updated_at`
    )
    .run({
      state_json: JSON.stringify(matchState),
      meta_json: JSON.stringify(meta ?? null),
      updated_at: updatedAt,
    });
}

export function sqliteClearLiveMatchDraft() {
  getDb().prepare("DELETE FROM live_match_draft WHERE id = 'current'").run();
}

export function sqliteSaveQuickMatch(
  id: string,
  label: string,
  stateJson: string,
  createdAt: string
) {
  getDb()
    .prepare(
      `INSERT INTO saved_matches (id, kind, label, state_json, created_at)
       VALUES (@id, 'quick', @label, @state_json, @created_at)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label,
         state_json = excluded.state_json,
         created_at = excluded.created_at`
    )
    .run({ id, label, state_json: stateJson, created_at: createdAt });
}

export interface DbQuickMatchListItem {
  id: string;
  label: string;
  createdAt: string;
}

export function sqliteListQuickMatches(limit = 50): DbQuickMatchListItem[] {
  const rows = getDb()
    .prepare(
      `SELECT id, label, created_at FROM saved_matches
       WHERE kind = 'quick'
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit) as { id: string; label: string; created_at: string }[];

  return rows.map((row) => ({
    id: row.id,
    label: row.label || "Quick match",
    createdAt: row.created_at,
  }));
}

/** Saved quick matches only (match history page). */
export function sqliteClearMatchHistory(): number {
  const result = getDb()
    .prepare("DELETE FROM saved_matches WHERE kind = 'quick'")
    .run();
  return result.changes;
}

/** Drafts, saved matches, and all tournaments — players and teams kept. */
export function sqliteClearAllMatchData(): void {
  const database = getDb();
  database.transaction(() => {
    database.prepare("DELETE FROM saved_matches").run();
    database.prepare("DELETE FROM live_match_draft").run();
    database.prepare("DELETE FROM tournaments").run();
  })();
}

/** All teams (players remain in the players table). */
export function sqliteClearAllTeams(): number {
  return getDb().prepare("DELETE FROM teams").run().changes;
}

/** All players and player assignments on teams. */
export function sqliteClearAllPlayers(): number {
  const database = getDb();
  let removed = 0;
  database.transaction(() => {
    removed = database.prepare("DELETE FROM players").run().changes;
    database.prepare("UPDATE teams SET players_json = '[]'").run();
  })();
  return removed;
}

/** Full wipe: players, teams, tournaments, matches, drafts. */
export function sqliteClearAllData(): void {
  const database = getDb();
  database.transaction(() => {
    database.prepare("DELETE FROM saved_matches").run();
    database.prepare("DELETE FROM live_match_draft").run();
    database.prepare("DELETE FROM players").run();
    database.prepare("DELETE FROM teams").run();
    database.prepare("DELETE FROM tournaments").run();
  })();
}

export function sqliteRunDataClear(action: DataClearAction): void {
  switch (action) {
    case "match-history":
      sqliteClearMatchHistory();
      break;
    case "match-data":
      sqliteClearAllMatchData();
      break;
    case "teams":
      sqliteClearAllTeams();
      break;
    case "players":
      sqliteClearAllPlayers();
      break;
    case "all":
      sqliteClearAllData();
      break;
    default:
      throw new Error(`Unknown clear action: ${String(action)}`);
  }
}
