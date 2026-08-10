/**
 * Owns the real SQLite database (better-sqlite3) inside Electron's main
 * process. The forked Next.js standalone server never touches better-sqlite3
 * directly when running under Electron (see lib/sqlite-connection.ts +
 * lib/sqlite-ipc-client.ts) — it proxies every query here over the Node IPC
 * channel established by `fork()`. This keeps the native addon confined to
 * `electron/node_modules`, which we rebuild once for Electron's own ABI,
 * instead of fighting Next.js/Turbopack bundling of a native module.
 *
 * NOTE: the schema below is duplicated from lib/sqlite-connection.ts
 * (SQLITE_SCHEMA). Keep both copies in sync when changing tables.
 */
const fs = require("fs");
const path = require("path");

const SCHEMA = `
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

const CHANNEL = "crickscore-db";

let db = null;
const stmtCache = new Map();

function openDb(dbPath) {
  // eslint-disable-next-line global-require
  const Database = require("better-sqlite3");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  instance.exec(SCHEMA);
  return instance;
}

function getStmt(sql) {
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

/** Call once from main.cjs before wiring up child message handling. */
function initSqlBridge(dbPath) {
  if (!db) db = openDb(dbPath);
  return db;
}

function runOp(kind, sql, params) {
  const stmt = getStmt(sql);
  if (kind === "get") return stmt.get(...params);
  if (kind === "all") return stmt.all(...params);
  if (kind === "run") {
    const result = stmt.run(...params);
    return { changes: result.changes };
  }
  throw new Error(`Unknown SQL op kind: ${kind}`);
}

function handleDbMessage(msg) {
  const { id, kind } = msg;
  try {
    if (!db) throw new Error("SQLite bridge not initialized");
    let result;
    if (kind === "batch") {
      const ops = msg.ops || [];
      const tx = db.transaction((items) => {
        let last;
        for (const op of items) {
          last = runOp("run", op.sql, op.params || []);
        }
        return last;
      });
      result = tx(ops);
    } else {
      result = runOp(kind, msg.sql, msg.params || []);
    }
    return { channel: CHANNEL, id, result };
  } catch (err) {
    return { channel: CHANNEL, id, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Wires a forked child process's messages to the local SQLite engine. */
function attachToChild(child) {
  child.on("message", (message) => {
    if (!message || message.channel !== CHANNEL) return;
    const response = handleDbMessage(message);
    child.send(response);
  });
}

module.exports = { initSqlBridge, attachToChild };
