import "server-only";

import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type { DataClearAction } from "./data-clear-types";
import type { Player, Team } from "./cricket-types";
import type { TournamentStageConfig } from "./tournament-stage-options";
import { getAdminFirestore } from "./firebase-admin";

/** Tournament document stored in Firestore (normalized on the client). */
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
  /** Preset format id from tournament-format-presets. */
  formatPresetId?: string;
  /** Active stage (0-based). */
  currentStageIndex?: number;
  /** teamId -> group letter (A, B, …) for group stages. */
  groupAssignments?: Record<string, string>;
  championTeamId?: string;
  /** Cached per-stage completion flags. */
  stageComplete?: boolean[];
}

const COLLECTIONS = {
  players: "players",
  teams: "teams",
  tournaments: "tournaments",
  meta: "meta",
  liveMatchDraft: "live_match_draft",
  savedMatches: "saved_matches",
} as const;

function getDb(): Firestore {
  return getAdminFirestore();
}

function userCol(uid: string, name: string) {
  return getDb().collection("users").doc(uid).collection(name);
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
  const players = Array.isArray(row.players) ? (row.players as Player[]) : [];
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
    players: team.players,
  };
}

const FIXTURES_SUBCOLLECTION = "fixtures";
const BATCH_WRITE_LIMIT = 400;

function tournamentFixturesRef(uid: string, tournamentId: string) {
  return userCol(uid, COLLECTIONS.tournaments)
    .doc(tournamentId)
    .collection(FIXTURES_SUBCOLLECTION);
}

async function loadTournamentFixtures(uid: string, tournamentId: string): Promise<unknown[]> {
  const snapshot = await tournamentFixturesRef(uid, tournamentId).get();
  if (snapshot.empty) return [];
  return snapshot.docs
    .map((doc) => doc.data() as { order?: number; fixture?: unknown })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => row.fixture)
    .filter((fixture): fixture is unknown => fixture != null);
}

async function saveTournamentFixtures(
  uid: string,
  tournamentId: string,
  fixtures: unknown[]
): Promise<void> {
  if (fixtures.length === 0) return;

  const ref = tournamentFixturesRef(uid, tournamentId);
  const existing = await ref.get();
  const nextIds = new Set(
    fixtures
      .map((fx) => (fx as { id?: string }).id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  type FixtureWriteOp =
    | { type: "delete"; docRef: DocumentReference }
    | {
        type: "set";
        docRef: DocumentReference;
        data: { order: number; fixture: unknown };
      };

  const ops: FixtureWriteOp[] = [];

  for (const doc of existing.docs) {
    if (!nextIds.has(doc.id)) {
      ops.push({ type: "delete", docRef: doc.ref });
    }
  }

  fixtures.forEach((fixture, order) => {
    const id = (fixture as { id?: string }).id;
    if (!id) return;
    ops.push({
      type: "set",
      docRef: ref.doc(id),
      data: { order, fixture },
    });
  });

  for (let i = 0; i < ops.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const op of ops.slice(i, i + BATCH_WRITE_LIMIT)) {
      if (op.type === "delete") batch.delete(op.docRef);
      else batch.set(op.docRef, op.data);
    }
    await batch.commit();
  }
}

async function deleteTournamentFixtures(uid: string, tournamentId: string): Promise<void> {
  const snapshot = await tournamentFixturesRef(uid, tournamentId).get();
  if (snapshot.empty) return;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

async function hydrateTournamentDoc(uid: string, row: Record<string, unknown>): Promise<DbTournament> {
  const id = row.id as string;
  const usesFixtureSubcollection = row.fixtures_external === true;
  const inlineFixtures = Array.isArray(row.fixtures_json) ? row.fixtures_json : [];
  const fixtures = usesFixtureSubcollection
    ? await loadTournamentFixtures(uid, id)
    : inlineFixtures;

  const formatPresetId =
    typeof row.format_preset_id === "string" && row.format_preset_id.length > 0
      ? row.format_preset_id
      : undefined;

  const currentStageIndex =
    typeof row.current_stage_index === "number" && row.current_stage_index >= 0
      ? row.current_stage_index
      : undefined;

  const groupAssignments: Record<string, string> | undefined =
    row.group_assignments_json &&
    typeof row.group_assignments_json === "object" &&
    !Array.isArray(row.group_assignments_json)
      ? (Object.fromEntries(
          Object.entries(row.group_assignments_json as Record<string, unknown>).filter(
            ([k, v]) => typeof k === "string" && typeof v === "string"
          )
        ) as Record<string, string>)
      : undefined;

  const championTeamId =
    typeof row.champion_team_id === "string" && row.champion_team_id.length > 0
      ? row.champion_team_id
      : undefined;

  const stageComplete = Array.isArray(row.stage_complete_json)
    ? row.stage_complete_json.map(Boolean)
    : undefined;

  return {
    id,
    name: row.name as string,
    totalOvers: Number(row.total_overs),
    ballsPerOver: Number(row.balls_per_over),
    teamCount: Number(row.team_count),
    stageCount: Number(row.stage_count),
    stages: Array.isArray(row.stages_json)
      ? (row.stages_json as TournamentStageConfig[])
      : [],
    selectedTeamIds: Array.isArray(row.selected_team_ids_json)
      ? (row.selected_team_ids_json as string[])
      : [],
    fixtures,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    isTemplate: Boolean(row.is_template),
    templateId: (row.template_id as string) || undefined,
    formatPresetId,
    currentStageIndex,
    groupAssignments,
    championTeamId,
    stageComplete,
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
    stages_json: tournament.stages,
    selected_team_ids_json: tournament.selectedTeamIds,
    fixtures_external: true,
    created_at: tournament.createdAt,
    is_template: tournament.isTemplate ?? false,
    template_id: tournament.templateId ?? null,
    format_preset_id: tournament.formatPresetId ?? null,
    current_stage_index: tournament.currentStageIndex ?? null,
    group_assignments_json: tournament.groupAssignments ?? null,
    champion_team_id: tournament.championTeamId ?? null,
    stage_complete_json: tournament.stageComplete ?? null,
  };
}

async function listCollection<T>(uid: string, name: string): Promise<T[]> {
  const snapshot = await userCol(uid, name).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

export async function listPlayers(uid: string): Promise<Player[]> {
  const rows = await listCollection<Record<string, unknown>>(uid, COLLECTIONS.players);
  return rows.map((row) => rowToPlayer(row)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlayer(uid: string, id: string): Promise<Player | undefined> {
  const doc = await userCol(uid, COLLECTIONS.players).doc(id).get();
  return doc.exists ? rowToPlayer(doc.data() as Record<string, unknown>) : undefined;
}

export async function savePlayer(uid: string, player: Player): Promise<void> {
  await userCol(uid, COLLECTIONS.players).doc(player.id).set(playerToRow(player));
}

export async function bulkImportPlayers(uid: string, players: Player[]): Promise<number> {
  if (players.length === 0) return 0;
  for (let i = 0; i < players.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const player of players.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.set(
        userCol(uid, COLLECTIONS.players).doc(player.id),
        playerToRow(player)
      );
    }
    await batch.commit();
  }
  return players.length;
}

export async function deletePlayer(uid: string, playerId: string): Promise<void> {
  const db = getDb();
  const teams = await listTeams(uid);
  const affected = teams.filter((team) =>
    team.players.some((p) => p.id === playerId)
  );

  type PlayerDeleteOp =
    | { type: "delete"; ref: DocumentReference }
    | { type: "set"; ref: DocumentReference; data: ReturnType<typeof teamToRow> };

  const ops: PlayerDeleteOp[] = [
    {
      type: "delete",
      ref: userCol(uid, COLLECTIONS.players).doc(playerId),
    },
    ...affected.map((team) => ({
      type: "set" as const,
      ref: userCol(uid, COLLECTIONS.teams).doc(team.id),
      data: teamToRow({
        ...team,
        players: team.players.filter((p) => p.id !== playerId),
      }),
    })),
  ];

  for (let i = 0; i < ops.length; i += BATCH_WRITE_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_WRITE_LIMIT)) {
      if (op.type === "delete") batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
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

export async function listTeams(uid: string): Promise<Team[]> {
  const rows = await listCollection<Record<string, unknown>>(uid, COLLECTIONS.teams);
  return rows.map((row) => rowToTeam(row)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeam(uid: string, id: string): Promise<Team | undefined> {
  const doc = await userCol(uid, COLLECTIONS.teams).doc(id).get();
  return doc.exists ? rowToTeam(doc.data() as Record<string, unknown>) : undefined;
}

export async function saveTeam(uid: string, team: Team): Promise<void> {
  await userCol(uid, COLLECTIONS.teams).doc(team.id).set(teamToRow(team));
}

export async function bulkImportTeams(uid: string, teams: Team[]): Promise<number> {
  if (teams.length === 0) return 0;
  for (let i = 0; i < teams.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const team of teams.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.set(
        userCol(uid, COLLECTIONS.teams).doc(team.id),
        teamToRow(team)
      );
    }
    await batch.commit();
  }
  return teams.length;
}

export async function deleteTeam(uid: string, teamId: string): Promise<void> {
  await userCol(uid, COLLECTIONS.teams).doc(teamId).delete();
}

export async function listTournaments(uid: string): Promise<DbTournament[]> {
  const rows = await listCollection<Record<string, unknown>>(uid, COLLECTIONS.tournaments);
  const tournaments = await Promise.all(rows.map((row) => hydrateTournamentDoc(uid, row)));
  return tournaments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTournament(uid: string, id: string): Promise<DbTournament | undefined> {
  const doc = await userCol(uid, COLLECTIONS.tournaments).doc(id).get();
  if (!doc.exists) return undefined;
  return hydrateTournamentDoc(uid, doc.data() as Record<string, unknown>);
}

export async function saveTournament(uid: string, tournament: DbTournament): Promise<void> {
  const fixtures = tournament.fixtures ?? [];
  await saveTournamentFixtures(uid, tournament.id, fixtures);
  await userCol(uid, COLLECTIONS.tournaments)
    .doc(tournament.id)
    .set(tournamentToRow(tournament));
}

export async function deleteTournament(uid: string, tournamentId: string): Promise<void> {
  await deleteTournamentFixtures(uid, tournamentId);
  await userCol(uid, COLLECTIONS.tournaments).doc(tournamentId).delete();
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
  data: {
    players: Player[];
    teams: Team[];
    tournaments: DbTournament[];
  }
): Promise<void> {
  await Promise.all([
    bulkImportPlayers(uid, data.players ?? []),
    bulkImportTeams(uid, data.teams ?? []),
    Promise.all((data.tournaments ?? []).map((t) => saveTournament(uid, t))),
  ]);
  await userCol(uid, COLLECTIONS.meta).doc("legacy_migrated").set({
    value: "1",
  });
}

export async function isLegacyMigrated(uid: string): Promise<boolean> {
  const doc = await userCol(uid, COLLECTIONS.meta).doc("legacy_migrated").get();
  return doc.data()?.value === "1";
}

export interface LiveMatchDraft {
  matchState: unknown;
  meta: unknown;
  updatedAt: string;
}

export async function getLiveMatchDraft(uid: string): Promise<LiveMatchDraft | null> {
  const doc = await userCol(uid, COLLECTIONS.liveMatchDraft).doc("current").get();
  if (!doc.exists) return null;
  const data = doc.data() as
    | { matchState?: unknown; meta?: unknown; updatedAt?: string }
    | undefined;
  if (!data?.matchState || !data.updatedAt) return null;
  return {
    matchState: data.matchState,
    meta: data.meta ?? null,
    updatedAt: data.updatedAt,
  };
}

export async function saveLiveMatchDraft(
  uid: string,
  matchState: unknown,
  meta: unknown,
  updatedAt: string
) {
  await userCol(uid, COLLECTIONS.liveMatchDraft).doc("current").set({
    matchState,
    meta: meta ?? null,
    updatedAt,
  });
}

export async function clearLiveMatchDraft(uid: string): Promise<void> {
  await userCol(uid, COLLECTIONS.liveMatchDraft).doc("current").delete();
}

export async function saveQuickMatch(
  uid: string,
  id: string,
  label: string,
  stateJson: string,
  createdAt: string
) {
  await userCol(uid, COLLECTIONS.savedMatches).doc(id).set({
    id,
    kind: "quick",
    label,
    state_json: stateJson,
    created_at: createdAt,
  });
}

export interface DbQuickMatchListItem {
  id: string;
  label: string;
  createdAt: string;
}

export interface DbQuickMatchDetail {
  id: string;
  label: string;
  createdAt: string;
  stateJson: string;
}

export async function getQuickMatchById(
  uid: string,
  id: string
): Promise<DbQuickMatchDetail | null> {
  const snap = await userCol(uid, COLLECTIONS.savedMatches).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data || data.kind !== "quick") return null;
  return {
    id: data.id as string,
    label: (data.label as string) || "Quick match",
    createdAt: data.created_at as string,
    stateJson: data.state_json as string,
  };
}

export async function deleteQuickMatch(uid: string, id: string): Promise<boolean> {
  const ref = userCol(uid, COLLECTIONS.savedMatches).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.kind !== "quick") return false;
  await ref.delete();
  return true;
}

export async function listQuickMatches(uid: string, limit = 50): Promise<DbQuickMatchListItem[]> {
  const rows = await listCollection<{
    id: string;
    kind?: string;
    label?: string;
    created_at: string;
  }>(uid, COLLECTIONS.savedMatches);

  return rows
    .filter((row) => row.kind === "quick")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      label: row.label || "Quick match",
      createdAt: row.created_at,
    }));
}

/** Saved quick matches only (match history page). */
export async function clearMatchHistory(uid: string): Promise<number> {
  const rows = await listCollection<{ id: string; kind?: string }>(
    uid,
    COLLECTIONS.savedMatches
  );
  const quick = rows.filter((row) => row.kind === "quick");
  const deletions = quick.map((row) =>
    userCol(uid, COLLECTIONS.savedMatches).doc(row.id).delete()
  );
  await Promise.all(deletions);
  return quick.length;
}

/** Drafts, saved matches, and all tournaments — players and teams kept. */
export async function clearAllMatchData(uid: string): Promise<void> {
  await Promise.all([
    clearCollection(uid, COLLECTIONS.savedMatches),
    clearCollection(uid, COLLECTIONS.liveMatchDraft),
    clearCollection(uid, COLLECTIONS.tournaments),
  ]);
}

/** All teams (players remain in the players collection). */
export async function clearAllTeams(uid: string): Promise<number> {
  return clearCollection(uid, COLLECTIONS.teams);
}

/** All players and player assignments on teams. */
export async function clearAllPlayers(uid: string): Promise<number> {
  const removed = await clearCollection(uid, COLLECTIONS.players);
  const teams = await listTeams(uid);
  await Promise.all(
    teams.map((team) =>
      saveTeam(uid, {
        ...team,
        players: [],
      })
    )
  );
  return removed;
}

/** Full wipe: players, teams, tournaments, matches, drafts. */
export async function clearAllData(uid: string): Promise<void> {
  await Promise.all([
    clearCollection(uid, COLLECTIONS.savedMatches),
    clearCollection(uid, COLLECTIONS.liveMatchDraft),
    clearCollection(uid, COLLECTIONS.players),
    clearCollection(uid, COLLECTIONS.teams),
    clearCollection(uid, COLLECTIONS.tournaments),
  ]);
}

async function clearTournamentsCollection(uid: string): Promise<number> {
  const snapshot = await userCol(uid, COLLECTIONS.tournaments).get();
  await Promise.all(snapshot.docs.map((doc) => deleteTournamentFixtures(uid, doc.id)));

  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return snapshot.size;
}

async function clearCollection(uid: string, name: string): Promise<number> {
  if (name === COLLECTIONS.tournaments) {
    return clearTournamentsCollection(uid);
  }

  const snapshot = await userCol(uid, name).get();
  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return snapshot.size;
}

// ---------------------------------------------------------------------------
// User profile + live-share keys (used by lib/api-auth.ts and lib/live-share.ts)
// ---------------------------------------------------------------------------

const LIVE_SHARE_KEYS_COLLECTION = "live_share_keys";

function userDocRef(uid: string) {
  return getDb().collection("users").doc(uid);
}

/** Ensures users/{uid} exists so the collection is visible in Firestore console. */
export async function upsertUserProfile(uid: string, email: string | null): Promise<void> {
  const ref = userDocRef(uid);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    await ref.set({ uid, email, createdAt: now, updatedAt: now });
    return;
  }
  await ref.set({ email, updatedAt: now }, { merge: true });
}

export async function getUserLiveShareKey(uid: string): Promise<string | null> {
  const snap = await userDocRef(uid).get();
  const key = snap.data()?.liveShareKey;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

export async function setUserLiveShareKey(uid: string, key: string): Promise<void> {
  await userDocRef(uid).set(
    { liveShareKey: key, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function getUidForLiveShareKey(key: string): Promise<string | null> {
  const snap = await getDb().collection(LIVE_SHARE_KEYS_COLLECTION).doc(key).get();
  const uid = snap.data()?.uid;
  return typeof uid === "string" && uid ? uid : null;
}

export async function setLiveShareKeyMapping(key: string, uid: string): Promise<void> {
  await getDb()
    .collection(LIVE_SHARE_KEYS_COLLECTION)
    .doc(key)
    .set({ uid, createdAt: new Date().toISOString() });
}

export async function deleteLiveShareKeyMapping(key: string): Promise<void> {
  await getDb().collection(LIVE_SHARE_KEYS_COLLECTION).doc(key).delete();
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
