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

function tournamentFixturesRef(tournamentId: string) {
  return getDb()
    .collection(COLLECTIONS.tournaments)
    .doc(tournamentId)
    .collection(FIXTURES_SUBCOLLECTION);
}

async function loadTournamentFixtures(tournamentId: string): Promise<unknown[]> {
  const snapshot = await tournamentFixturesRef(tournamentId).get();
  if (snapshot.empty) return [];
  return snapshot.docs
    .map((doc) => doc.data() as { order?: number; fixture?: unknown })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => row.fixture)
    .filter((fixture): fixture is unknown => fixture != null);
}

async function saveTournamentFixtures(
  tournamentId: string,
  fixtures: unknown[]
): Promise<void> {
  if (fixtures.length === 0) return;

  const ref = tournamentFixturesRef(tournamentId);
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

async function deleteTournamentFixtures(tournamentId: string): Promise<void> {
  const snapshot = await tournamentFixturesRef(tournamentId).get();
  if (snapshot.empty) return;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

async function hydrateTournamentDoc(row: Record<string, unknown>): Promise<DbTournament> {
  const id = row.id as string;
  const usesFixtureSubcollection = row.fixtures_external === true;
  const inlineFixtures = Array.isArray(row.fixtures_json) ? row.fixtures_json : [];
  const fixtures = usesFixtureSubcollection
    ? await loadTournamentFixtures(id)
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

async function listCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDb().collection(name).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

export async function listPlayers(): Promise<Player[]> {
  const rows = await listCollection<Record<string, unknown>>(COLLECTIONS.players);
  return rows.map((row) => rowToPlayer(row)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const doc = await getDb().collection(COLLECTIONS.players).doc(id).get();
  return doc.exists ? rowToPlayer(doc.data() as Record<string, unknown>) : undefined;
}

export async function savePlayer(player: Player): Promise<void> {
  await getDb().collection(COLLECTIONS.players).doc(player.id).set(playerToRow(player));
}

export async function bulkImportPlayers(players: Player[]): Promise<number> {
  if (players.length === 0) return 0;
  for (let i = 0; i < players.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const player of players.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.set(
        getDb().collection(COLLECTIONS.players).doc(player.id),
        playerToRow(player)
      );
    }
    await batch.commit();
  }
  return players.length;
}

export async function deletePlayer(playerId: string): Promise<void> {
  const db = getDb();
  const teams = await listTeams();
  const affected = teams.filter((team) =>
    team.players.some((p) => p.id === playerId)
  );

  type PlayerDeleteOp =
    | { type: "delete"; ref: DocumentReference }
    | { type: "set"; ref: DocumentReference; data: ReturnType<typeof teamToRow> };

  const ops: PlayerDeleteOp[] = [
    {
      type: "delete",
      ref: db.collection(COLLECTIONS.players).doc(playerId),
    },
    ...affected.map((team) => ({
      type: "set" as const,
      ref: db.collection(COLLECTIONS.teams).doc(team.id),
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

export async function syncPlayerInTeams(player: Player): Promise<void> {
  const teams = await listTeams();
  const updates = teams
    .filter((team) => team.players.some((p) => p.id === player.id))
    .map((team) =>
      saveTeam({
        ...team,
        players: team.players.map((p) => (p.id === player.id ? player : p)),
      })
    );
  await Promise.all(updates);
}

export async function listTeams(): Promise<Team[]> {
  const rows = await listCollection<Record<string, unknown>>(COLLECTIONS.teams);
  return rows.map((row) => rowToTeam(row)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const doc = await getDb().collection(COLLECTIONS.teams).doc(id).get();
  return doc.exists ? rowToTeam(doc.data() as Record<string, unknown>) : undefined;
}

export async function saveTeam(team: Team): Promise<void> {
  await getDb().collection(COLLECTIONS.teams).doc(team.id).set(teamToRow(team));
}

export async function bulkImportTeams(teams: Team[]): Promise<number> {
  if (teams.length === 0) return 0;
  for (let i = 0; i < teams.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const team of teams.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.set(
        getDb().collection(COLLECTIONS.teams).doc(team.id),
        teamToRow(team)
      );
    }
    await batch.commit();
  }
  return teams.length;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await getDb().collection(COLLECTIONS.teams).doc(teamId).delete();
}

export async function listTournaments(): Promise<DbTournament[]> {
  const rows = await listCollection<Record<string, unknown>>(COLLECTIONS.tournaments);
  const tournaments = await Promise.all(rows.map((row) => hydrateTournamentDoc(row)));
  return tournaments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTournament(id: string): Promise<DbTournament | undefined> {
  const doc = await getDb().collection(COLLECTIONS.tournaments).doc(id).get();
  if (!doc.exists) return undefined;
  return hydrateTournamentDoc(doc.data() as Record<string, unknown>);
}

export async function saveTournament(tournament: DbTournament): Promise<void> {
  const fixtures = tournament.fixtures ?? [];
  await saveTournamentFixtures(tournament.id, fixtures);
  await getDb()
    .collection(COLLECTIONS.tournaments)
    .doc(tournament.id)
    .set(tournamentToRow(tournament));
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  await deleteTournamentFixtures(tournamentId);
  await getDb().collection(COLLECTIONS.tournaments).doc(tournamentId).delete();
}

export async function loadAll(): Promise<{
  players: Player[];
  teams: Team[];
  tournaments: DbTournament[];
}> {
  const [players, teams, tournaments] = await Promise.all([
    listPlayers(),
    listTeams(),
    listTournaments(),
  ]);
  return { players, teams, tournaments };
}

export async function migrateFromLegacy(data: {
  players: Player[];
  teams: Team[];
  tournaments: DbTournament[];
}): Promise<void> {
  await Promise.all([
    bulkImportPlayers(data.players ?? []),
    bulkImportTeams(data.teams ?? []),
    Promise.all((data.tournaments ?? []).map((t) => saveTournament(t))),
  ]);
  await getDb().collection(COLLECTIONS.meta).doc("legacy_migrated").set({
    value: "1",
  });
}

export async function isLegacyMigrated(): Promise<boolean> {
  const doc = await getDb().collection(COLLECTIONS.meta).doc("legacy_migrated").get();
  return doc.data()?.value === "1";
}

export interface LiveMatchDraft {
  matchState: unknown;
  meta: unknown;
  updatedAt: string;
}

export async function getLiveMatchDraft(): Promise<LiveMatchDraft | null> {
  const doc = await getDb().collection(COLLECTIONS.liveMatchDraft).doc("current").get();
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
  matchState: unknown,
  meta: unknown,
  updatedAt: string
) {
  await getDb().collection(COLLECTIONS.liveMatchDraft).doc("current").set({
    matchState,
    meta: meta ?? null,
    updatedAt,
  });
}

export async function clearLiveMatchDraft(): Promise<void> {
  await getDb().collection(COLLECTIONS.liveMatchDraft).doc("current").delete();
}

export async function saveQuickMatch(
  id: string,
  label: string,
  stateJson: string,
  createdAt: string
) {
  await getDb().collection(COLLECTIONS.savedMatches).doc(id).set({
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
  id: string
): Promise<DbQuickMatchDetail | null> {
  const snap = await getDb().collection(COLLECTIONS.savedMatches).doc(id).get();
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

export async function deleteQuickMatch(id: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTIONS.savedMatches).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.kind !== "quick") return false;
  await ref.delete();
  return true;
}

export async function listQuickMatches(limit = 50): Promise<DbQuickMatchListItem[]> {
  const rows = await listCollection<{
    id: string;
    kind?: string;
    label?: string;
    created_at: string;
  }>(COLLECTIONS.savedMatches);

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
export async function clearMatchHistory(): Promise<number> {
  const rows = await listCollection<{ id: string; kind?: string }>(
    COLLECTIONS.savedMatches
  );
  const quick = rows.filter((row) => row.kind === "quick");
  const deletions = quick.map((row) =>
    getDb().collection(COLLECTIONS.savedMatches).doc(row.id).delete()
  );
  await Promise.all(deletions);
  return quick.length;
}

/** Drafts, saved matches, and all tournaments — players and teams kept. */
export async function clearAllMatchData(): Promise<void> {
  await Promise.all([
    clearCollection(COLLECTIONS.savedMatches),
    clearCollection(COLLECTIONS.liveMatchDraft),
    clearCollection(COLLECTIONS.tournaments),
  ]);
}

/** All teams (players remain in the players collection). */
export async function clearAllTeams(): Promise<number> {
  return clearCollection(COLLECTIONS.teams);
}

/** All players and player assignments on teams. */
export async function clearAllPlayers(): Promise<number> {
  const removed = await clearCollection(COLLECTIONS.players);
  const teams = await listTeams();
  await Promise.all(
    teams.map((team) =>
      saveTeam({
        ...team,
        players: [],
      })
    )
  );
  return removed;
}

/** Full wipe: players, teams, tournaments, matches, drafts. */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearCollection(COLLECTIONS.savedMatches),
    clearCollection(COLLECTIONS.liveMatchDraft),
    clearCollection(COLLECTIONS.players),
    clearCollection(COLLECTIONS.teams),
    clearCollection(COLLECTIONS.tournaments),
  ]);
}

async function clearTournamentsCollection(): Promise<number> {
  const snapshot = await getDb().collection(COLLECTIONS.tournaments).get();
  await Promise.all(snapshot.docs.map((doc) => deleteTournamentFixtures(doc.id)));

  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return snapshot.size;
}

async function clearCollection(name: string): Promise<number> {
  if (name === COLLECTIONS.tournaments) {
    return clearTournamentsCollection();
  }

  const snapshot = await getDb().collection(name).get();
  for (let i = 0; i < snapshot.docs.length; i += BATCH_WRITE_LIMIT) {
    const batch = getDb().batch();
    for (const doc of snapshot.docs.slice(i, i + BATCH_WRITE_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return snapshot.size;
}

export async function runDataClear(action: DataClearAction): Promise<void> {
  switch (action) {
    case "match-history":
      await clearMatchHistory();
      break;
    case "match-data":
      await clearAllMatchData();
      break;
    case "teams":
      await clearAllTeams();
      break;
    case "players":
      await clearAllPlayers();
      break;
    case "all":
      await clearAllData();
      break;
    default:
      throw new Error(`Unknown clear action: ${String(action)}`);
  }
}
