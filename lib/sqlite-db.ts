import "server-only";

import type { DataClearAction } from "./data-clear-types";
import type { Player, Team } from "./cricket-types";
import { getDbClient, type DbClient } from "./sqlite-connection";
import type {
  DbTournament,
  LiveMatchDraft,
  DbQuickMatchListItem,
  DbQuickMatchDetail,
} from "./firestore-db";

export type { DbTournament, LiveMatchDraft, DbQuickMatchListItem, DbQuickMatchDetail };

function nowIso(): string {
  return new Date().toISOString();
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

function playerParams(uid: string, player: Player): unknown[] {
  return [
    uid,
    player.id,
    player.name,
    player.role ?? null,
    player.gender ?? null,
    player.age ?? null,
    player.battingStyle ?? null,
    player.bowlingStyle ?? null,
    player.imageUrl ?? null,
  ];
}

const UPSERT_PLAYER_SQL = `
  INSERT INTO players (uid, id, name, role, gender, age, batting_style, bowling_style, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(uid, id) DO UPDATE SET
    name = excluded.name, role = excluded.role, gender = excluded.gender,
    age = excluded.age, batting_style = excluded.batting_style,
    bowling_style = excluded.bowling_style, image_url = excluded.image_url`;

function rowToTeam(row: Record<string, unknown>): Team {
  let players: Player[] = [];
  try {
    players = JSON.parse((row.players_json as string) || "[]");
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

function teamParams(uid: string, team: Team): unknown[] {
  return [
    uid,
    team.id,
    team.name,
    team.ownerName ?? null,
    team.logoUrl ?? null,
    JSON.stringify(team.players ?? []),
  ];
}

const UPSERT_TEAM_SQL = `
  INSERT INTO teams (uid, id, name, owner_name, logo_url, players_json)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(uid, id) DO UPDATE SET
    name = excluded.name, owner_name = excluded.owner_name,
    logo_url = excluded.logo_url, players_json = excluded.players_json`;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function hydrateTournamentRow(
  db: DbClient,
  uid: string,
  row: Record<string, unknown>
): Promise<DbTournament> {
  const fixtureRows = await db.all<{ fixture_json: string }>(
    `SELECT fixture_json FROM tournament_fixtures WHERE uid = ? AND tournament_id = ? ORDER BY order_num ASC`,
    [uid, row.id as string]
  );
  const fixtures = fixtureRows
    .map((r) => {
      try {
        return JSON.parse(r.fixture_json);
      } catch {
        return null;
      }
    })
    .filter((f) => f != null);

  return {
    id: row.id as string,
    name: row.name as string,
    totalOvers: Number(row.total_overs),
    ballsPerOver: Number(row.balls_per_over),
    teamCount: Number(row.team_count),
    stageCount: Number(row.stage_count),
    stages: parseJson(row.stages_json, []),
    selectedTeamIds: parseJson(row.selected_team_ids_json, []),
    fixtures,
    createdAt: String(row.created_at ?? nowIso()),
    isTemplate: Boolean(row.is_template),
    templateId: (row.template_id as string) || undefined,
    formatPresetId: (row.format_preset_id as string) || undefined,
    currentStageIndex:
      typeof row.current_stage_index === "number" && row.current_stage_index >= 0
        ? row.current_stage_index
        : undefined,
    groupAssignments: parseJson<Record<string, string> | undefined>(
      row.group_assignments_json,
      undefined
    ),
    championTeamId: (row.champion_team_id as string) || undefined,
    stageComplete: parseJson<boolean[] | undefined>(row.stage_complete_json, undefined),
  };
}

function tournamentParams(uid: string, tournament: DbTournament): unknown[] {
  return [
    uid,
    tournament.id,
    tournament.name,
    tournament.totalOvers,
    tournament.ballsPerOver,
    tournament.teamCount,
    tournament.stageCount,
    JSON.stringify(tournament.stages ?? []),
    JSON.stringify(tournament.selectedTeamIds ?? []),
    tournament.createdAt,
    tournament.isTemplate ? 1 : 0,
    tournament.templateId ?? null,
    tournament.formatPresetId ?? null,
    tournament.currentStageIndex ?? null,
    tournament.groupAssignments ? JSON.stringify(tournament.groupAssignments) : null,
    tournament.championTeamId ?? null,
    tournament.stageComplete ? JSON.stringify(tournament.stageComplete) : null,
  ];
}

const UPSERT_TOURNAMENT_SQL = `
  INSERT INTO tournaments (
    uid, id, name, total_overs, balls_per_over, team_count, stage_count,
    stages_json, selected_team_ids_json, created_at, is_template, template_id,
    format_preset_id, current_stage_index, group_assignments_json,
    champion_team_id, stage_complete_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(uid, id) DO UPDATE SET
    name = excluded.name, total_overs = excluded.total_overs,
    balls_per_over = excluded.balls_per_over, team_count = excluded.team_count,
    stage_count = excluded.stage_count, stages_json = excluded.stages_json,
    selected_team_ids_json = excluded.selected_team_ids_json,
    created_at = excluded.created_at, is_template = excluded.is_template,
    template_id = excluded.template_id, format_preset_id = excluded.format_preset_id,
    current_stage_index = excluded.current_stage_index,
    group_assignments_json = excluded.group_assignments_json,
    champion_team_id = excluded.champion_team_id,
    stage_complete_json = excluded.stage_complete_json`;

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export async function listPlayers(uid: string): Promise<Player[]> {
  const db = getDbClient();
  const rows = await db.all(`SELECT * FROM players WHERE uid = ? ORDER BY name COLLATE NOCASE`, [
    uid,
  ]);
  return rows.map(rowToPlayer);
}

export async function getPlayer(uid: string, id: string): Promise<Player | undefined> {
  const db = getDbClient();
  const row = await db.get(`SELECT * FROM players WHERE uid = ? AND id = ?`, [uid, id]);
  return row ? rowToPlayer(row) : undefined;
}

export async function savePlayer(uid: string, player: Player): Promise<void> {
  const db = getDbClient();
  await db.run(UPSERT_PLAYER_SQL, playerParams(uid, player));
}

export async function bulkImportPlayers(uid: string, players: Player[]): Promise<number> {
  if (players.length === 0) return 0;
  const db = getDbClient();
  await db.batch(
    players.map((player) => ({ sql: UPSERT_PLAYER_SQL, params: playerParams(uid, player) }))
  );
  return players.length;
}

export async function deletePlayer(uid: string, playerId: string): Promise<void> {
  const db = getDbClient();
  const teams = await listTeams(uid);
  const affected = teams.filter((team) => team.players.some((p) => p.id === playerId));

  const ops = [
    { sql: `DELETE FROM players WHERE uid = ? AND id = ?`, params: [uid, playerId] },
    ...affected.map((team) => {
      const updated = { ...team, players: team.players.filter((p) => p.id !== playerId) };
      return {
        sql: `UPDATE teams SET players_json = ? WHERE uid = ? AND id = ?`,
        params: [JSON.stringify(updated.players), uid, team.id],
      };
    }),
  ];
  await db.batch(ops);
}

export async function syncPlayerInTeams(uid: string, player: Player): Promise<void> {
  const teams = await listTeams(uid);
  const updates = teams
    .filter((team) => team.players.some((p) => p.id === player.id))
    .map((team) =>
      saveTeam(uid, {
        ...team,
        players: team.players.map((p) => (p.id === player.id ? player : p)),
      })
    );
  await Promise.all(updates);
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export async function listTeams(uid: string): Promise<Team[]> {
  const db = getDbClient();
  const rows = await db.all(`SELECT * FROM teams WHERE uid = ? ORDER BY name COLLATE NOCASE`, [
    uid,
  ]);
  return rows.map(rowToTeam);
}

export async function getTeam(uid: string, id: string): Promise<Team | undefined> {
  const db = getDbClient();
  const row = await db.get(`SELECT * FROM teams WHERE uid = ? AND id = ?`, [uid, id]);
  return row ? rowToTeam(row) : undefined;
}

export async function saveTeam(uid: string, team: Team): Promise<void> {
  const db = getDbClient();
  await db.run(UPSERT_TEAM_SQL, teamParams(uid, team));
}

export async function bulkImportTeams(uid: string, teams: Team[]): Promise<number> {
  if (teams.length === 0) return 0;
  const db = getDbClient();
  await db.batch(teams.map((team) => ({ sql: UPSERT_TEAM_SQL, params: teamParams(uid, team) })));
  return teams.length;
}

export async function deleteTeam(uid: string, teamId: string): Promise<void> {
  const db = getDbClient();
  await db.run(`DELETE FROM teams WHERE uid = ? AND id = ?`, [uid, teamId]);
}

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

export async function listTournaments(uid: string): Promise<DbTournament[]> {
  const db = getDbClient();
  const rows = await db.all(`SELECT * FROM tournaments WHERE uid = ? ORDER BY created_at DESC`, [
    uid,
  ]);
  const tournaments = await Promise.all(rows.map((row) => hydrateTournamentRow(db, uid, row)));
  return tournaments;
}

export async function getTournament(uid: string, id: string): Promise<DbTournament | undefined> {
  const db = getDbClient();
  const row = await db.get(`SELECT * FROM tournaments WHERE uid = ? AND id = ?`, [uid, id]);
  return row ? hydrateTournamentRow(db, uid, row) : undefined;
}

async function replaceTournamentFixtures(
  db: DbClient,
  uid: string,
  tournamentId: string,
  fixtures: unknown[]
): Promise<void> {
  const ops = [
    {
      sql: `DELETE FROM tournament_fixtures WHERE uid = ? AND tournament_id = ?`,
      params: [uid, tournamentId],
    },
  ];
  fixtures.forEach((fixture, order) => {
    const id = (fixture as { id?: string })?.id;
    if (!id) return;
    ops.push({
      sql: `INSERT INTO tournament_fixtures (uid, tournament_id, fixture_id, order_num, fixture_json)
            VALUES (?, ?, ?, ?, ?)`,
      params: [uid, tournamentId, id, order, JSON.stringify(fixture)] as unknown as string[],
    });
  });
  await db.batch(ops);
}

export async function saveTournament(uid: string, tournament: DbTournament): Promise<void> {
  const db = getDbClient();
  await replaceTournamentFixtures(db, uid, tournament.id, tournament.fixtures ?? []);
  await db.run(UPSERT_TOURNAMENT_SQL, tournamentParams(uid, tournament));
}

export async function deleteTournament(uid: string, tournamentId: string): Promise<void> {
  const db = getDbClient();
  await db.batch([
    {
      sql: `DELETE FROM tournament_fixtures WHERE uid = ? AND tournament_id = ?`,
      params: [uid, tournamentId],
    },
    { sql: `DELETE FROM tournaments WHERE uid = ? AND id = ?`, params: [uid, tournamentId] },
  ]);
}

export async function loadAll(uid: string): Promise<{
  players: Player[];
  teams: Team[];
  tournaments: DbTournament[];
}> {
  const [players, teams, tournaments] = await Promise.all([
    listPlayers(uid),
    listTeams(uid),
    listTournaments(uid),
  ]);
  return { players, teams, tournaments };
}

export async function migrateFromLegacy(
  uid: string,
  data: { players: Player[]; teams: Team[]; tournaments: DbTournament[] }
): Promise<void> {
  await Promise.all([
    bulkImportPlayers(uid, data.players ?? []),
    bulkImportTeams(uid, data.teams ?? []),
    Promise.all((data.tournaments ?? []).map((t) => saveTournament(uid, t))),
  ]);
  const db = getDbClient();
  await db.run(
    `INSERT INTO meta (uid, key, value) VALUES (?, 'legacy_migrated', '1')
     ON CONFLICT(uid, key) DO UPDATE SET value = '1'`,
    [uid]
  );
}

export async function isLegacyMigrated(uid: string): Promise<boolean> {
  const db = getDbClient();
  const row = await db.get<{ value?: string }>(
    `SELECT value FROM meta WHERE uid = ? AND key = 'legacy_migrated'`,
    [uid]
  );
  return row?.value === "1";
}

// ---------------------------------------------------------------------------
// Live match draft
// ---------------------------------------------------------------------------

export async function getLiveMatchDraft(uid: string): Promise<LiveMatchDraft | null> {
  const db = getDbClient();
  const row = await db.get<{
    match_state_json: string;
    meta_json: string | null;
    updated_at: string;
  }>(`SELECT * FROM live_match_draft WHERE uid = ?`, [uid]);
  if (!row) return null;
  let matchState: unknown;
  try {
    matchState = JSON.parse(row.match_state_json);
  } catch {
    return null;
  }
  if (!matchState || !row.updated_at) return null;
  let meta: unknown = null;
  if (row.meta_json) {
    try {
      meta = JSON.parse(row.meta_json);
    } catch {
      meta = null;
    }
  }
  return { matchState, meta, updatedAt: row.updated_at };
}

export async function saveLiveMatchDraft(
  uid: string,
  matchState: unknown,
  meta: unknown,
  updatedAt: string
): Promise<void> {
  const db = getDbClient();
  await db.run(
    `INSERT INTO live_match_draft (uid, match_state_json, meta_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET
       match_state_json = excluded.match_state_json,
       meta_json = excluded.meta_json,
       updated_at = excluded.updated_at`,
    [uid, JSON.stringify(matchState), meta != null ? JSON.stringify(meta) : null, updatedAt]
  );
}

export async function clearLiveMatchDraft(uid: string): Promise<void> {
  const db = getDbClient();
  await db.run(`DELETE FROM live_match_draft WHERE uid = ?`, [uid]);
}

// ---------------------------------------------------------------------------
// Quick / saved matches
// ---------------------------------------------------------------------------

export async function saveQuickMatch(
  uid: string,
  id: string,
  label: string,
  stateJson: string,
  createdAt: string
): Promise<void> {
  const db = getDbClient();
  await db.run(
    `INSERT INTO saved_matches (uid, id, kind, label, state_json, created_at)
     VALUES (?, ?, 'quick', ?, ?, ?)
     ON CONFLICT(uid, id) DO UPDATE SET
       label = excluded.label, state_json = excluded.state_json, created_at = excluded.created_at`,
    [uid, id, label, stateJson, createdAt]
  );
}

export async function getQuickMatchById(
  uid: string,
  id: string
): Promise<DbQuickMatchDetail | null> {
  const db = getDbClient();
  const row = await db.get<{
    id: string;
    label: string | null;
    created_at: string;
    state_json: string;
  }>(`SELECT * FROM saved_matches WHERE uid = ? AND id = ? AND kind = 'quick'`, [uid, id]);
  if (!row) return null;
  return {
    id: row.id,
    label: row.label || "Quick match",
    createdAt: row.created_at,
    stateJson: row.state_json,
  };
}

export async function deleteQuickMatch(uid: string, id: string): Promise<boolean> {
  const db = getDbClient();
  const result = await db.run(
    `DELETE FROM saved_matches WHERE uid = ? AND id = ? AND kind = 'quick'`,
    [uid, id]
  );
  return result.changes > 0;
}

export async function listQuickMatches(
  uid: string,
  limit = 50
): Promise<DbQuickMatchListItem[]> {
  const db = getDbClient();
  const rows = await db.all<{ id: string; label: string | null; created_at: string }>(
    `SELECT id, label, created_at FROM saved_matches
     WHERE uid = ? AND kind = 'quick' ORDER BY created_at DESC LIMIT ?`,
    [uid, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    label: row.label || "Quick match",
    createdAt: row.created_at,
  }));
}

export async function clearMatchHistory(uid: string): Promise<number> {
  const db = getDbClient();
  const result = await db.run(`DELETE FROM saved_matches WHERE uid = ? AND kind = 'quick'`, [uid]);
  return result.changes;
}

export async function clearAllMatchData(uid: string): Promise<void> {
  const db = getDbClient();
  await db.batch([
    { sql: `DELETE FROM saved_matches WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM live_match_draft WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM tournament_fixtures WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM tournaments WHERE uid = ?`, params: [uid] },
  ]);
}

export async function clearAllTeams(uid: string): Promise<number> {
  const db = getDbClient();
  const result = await db.run(`DELETE FROM teams WHERE uid = ?`, [uid]);
  return result.changes;
}

export async function clearAllPlayers(uid: string): Promise<number> {
  const db = getDbClient();
  const result = await db.run(`DELETE FROM players WHERE uid = ?`, [uid]);
  await db.run(`UPDATE teams SET players_json = '[]' WHERE uid = ?`, [uid]);
  return result.changes;
}

export async function clearAllData(uid: string): Promise<void> {
  const db = getDbClient();
  await db.batch([
    { sql: `DELETE FROM saved_matches WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM live_match_draft WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM players WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM teams WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM tournament_fixtures WHERE uid = ?`, params: [uid] },
    { sql: `DELETE FROM tournaments WHERE uid = ?`, params: [uid] },
  ]);
}

export async function runDataClear(uid: string, action: DataClearAction): Promise<void> {
  switch (action) {
    case "match-history":
      await clearMatchHistory(uid);
      break;
    case "match-data":
      await clearAllMatchData(uid);
      break;
    case "teams":
      await clearAllTeams(uid);
      break;
    case "players":
      await clearAllPlayers(uid);
      break;
    case "all":
      await clearAllData(uid);
      break;
    default:
      throw new Error(`Unknown clear action: ${String(action)}`);
  }
}

// ---------------------------------------------------------------------------
// User profile + live-share keys (used by lib/api-auth.ts and lib/live-share.ts)
// ---------------------------------------------------------------------------

export async function upsertUserProfile(uid: string, email: string | null): Promise<void> {
  const db = getDbClient();
  const now = nowIso();
  await db.run(
    `INSERT INTO users (uid, email, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET email = excluded.email, updated_at = excluded.updated_at`,
    [uid, email, now, now]
  );
}

export async function getUserLiveShareKey(uid: string): Promise<string | null> {
  const db = getDbClient();
  const row = await db.get<{ live_share_key: string | null }>(
    `SELECT live_share_key FROM users WHERE uid = ?`,
    [uid]
  );
  return row?.live_share_key?.trim() || null;
}

export async function setUserLiveShareKey(uid: string, key: string): Promise<void> {
  const db = getDbClient();
  const now = nowIso();
  await db.run(
    `INSERT INTO users (uid, live_share_key, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET live_share_key = excluded.live_share_key, updated_at = excluded.updated_at`,
    [uid, key, now, now]
  );
}

export async function getUidForLiveShareKey(key: string): Promise<string | null> {
  const db = getDbClient();
  const row = await db.get<{ uid: string }>(`SELECT uid FROM live_share_keys WHERE key = ?`, [key]);
  return row?.uid ?? null;
}

export async function setLiveShareKeyMapping(key: string, uid: string): Promise<void> {
  const db = getDbClient();
  await db.run(
    `INSERT INTO live_share_keys (key, uid, created_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET uid = excluded.uid`,
    [key, uid, nowIso()]
  );
}

export async function deleteLiveShareKeyMapping(key: string): Promise<void> {
  const db = getDbClient();
  await db.run(`DELETE FROM live_share_keys WHERE key = ?`, [key]);
}
