import "server-only";

import fs from "fs";
import path from "path";

import { ipcDbClient } from "./sqlite-ipc-client";

// NOTE: this schema is duplicated in electron/sql-bridge.cjs (the Electron
// main process owns the real SQLite file when running inside Electron — see
// lib/sqlite-ipc-client.ts). Keep both copies in sync when changing tables.
export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  live_share_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS live_share_keys (
  key TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  uid TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  gender TEXT,
  age INTEGER,
  batting_style TEXT,
  bowling_style TEXT,
  image_url TEXT,
  PRIMARY KEY (uid, id)
);

CREATE TABLE IF NOT EXISTS teams (
  uid TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  logo_url TEXT,
  players_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (uid, id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  uid TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  total_overs INTEGER NOT NULL,
  balls_per_over INTEGER NOT NULL,
  team_count INTEGER NOT NULL,
  stage_count INTEGER NOT NULL,
  stages_json TEXT NOT NULL DEFAULT '[]',
  selected_team_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  is_template INTEGER NOT NULL DEFAULT 0,
  template_id TEXT,
  format_preset_id TEXT,
  current_stage_index INTEGER,
  group_assignments_json TEXT,
  champion_team_id TEXT,
  stage_complete_json TEXT,
  PRIMARY KEY (uid, id)
);

CREATE TABLE IF NOT EXISTS tournament_fixtures (
  uid TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  fixture_id TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  fixture_json TEXT NOT NULL,
  PRIMARY KEY (uid, tournament_id, fixture_id)
);

CREATE TABLE IF NOT EXISTS live_match_draft (
  uid TEXT PRIMARY KEY,
  match_state_json TEXT NOT NULL,
  meta_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_matches (
  uid TEXT NOT NULL,
  id TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (uid, id)
);

CREATE TABLE IF NOT EXISTS meta (
  uid TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY (uid, key)
);
`;

/**
 * Minimal async SQL client interface. lib/sqlite-db.ts is written entirely
 * against this interface so it works identically whether SQLite runs
 * in-process (plain `next dev` / `next start`) or in Electron's main process
 * with calls proxied over IPC (see lib/sqlite-ipc-client.ts). This also
 * avoids ever loading the better-sqlite3 native addon inside the Next.js
 * server process when running under Electron, sidestepping Node/Electron
 * ABI mismatches entirely.
 */
export interface DbClient {
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  /** Runs statements sequentially inside a single SQLite transaction. */
  batch(ops: { sql: string; params?: unknown[] }[]): Promise<void>;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "crickscore.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __crickscoreDbClient: DbClient | undefined;
}

function createLocalClient(): DbClient {
  // Lazily required so the native addon is never dlopen'd unless this
  // in-process path is actually used (see CRICKSCORE_SQLITE_IPC below).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SQLITE_SCHEMA);

  return {
    async get(sql, params = []) {
      return db.prepare(sql).get(...params) as never;
    },
    async all(sql, params = []) {
      return db.prepare(sql).all(...params) as never;
    },
    async run(sql, params = []) {
      const result = db.prepare(sql).run(...params);
      return { changes: result.changes };
    },
    async batch(ops) {
      const tx = db.transaction((items: typeof ops) => {
        for (const op of items) db.prepare(op.sql).run(...(op.params ?? []));
      });
      tx(ops);
    },
  };
}

/**
 * When Electron forks the Next.js standalone server it sets
 * CRICKSCORE_SQLITE_IPC=1 and owns the real SQLite file itself (see
 * electron/main.cjs + electron/sql-bridge.cjs). Everywhere else (plain
 * `next dev` / `next start`), SQLite runs directly in this process.
 */
export function getDbClient(): DbClient {
  if (!global.__crickscoreDbClient) {
    global.__crickscoreDbClient =
      process.env.CRICKSCORE_SQLITE_IPC === "1" ? ipcDbClient : createLocalClient();
  }
  return global.__crickscoreDbClient;
}
