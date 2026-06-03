import { InningsData, MatchConfig, Player, Team } from "./cricket-types";
import { migrateLegacyTournamentTemplates } from "@/lib/roster-migrate";
import { withRosterRollback } from "@/lib/roster-snapshot";
import { resolveTeamPlayers, resolveTeamsFromRoster } from "@/lib/team-roster";
import { rosterActions } from "@/lib/store/roster-slice";
import { getStore } from "@/lib/store/store";
import {
  buildStageConfigs,
  TournamentStageConfig,
} from "./tournament-stage-options";

export type {
  SavedTournament,
  TournamentFixture,
  TournamentFixtureResult,
  TournamentMatchSnapshot,
  TournamentBestBatting,
  TournamentBestBowling,
} from "./roster-types";
import type { SavedTournament, TournamentFixture } from "./roster-types";

function dispatch(action: Parameters<ReturnType<typeof getStore>["dispatch"]>[0]) {
  getStore().dispatch(action);
}

function getRosterState() {
  return getStore().getState().roster;
}

function normalizePlayer(raw: Partial<Player> & { id: string; name: string }): Player {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role ?? "all-rounder",
    gender: raw.gender ?? "male",
    age: raw.age,
    battingStyle: raw.battingStyle ?? "right-hand",
    bowlingStyle: raw.bowlingStyle ?? "none",
    imageUrl: raw.imageUrl,
  };
}

const PLAYERS_KEY = "cricket-scorer-players";
const TEAMS_KEY = "cricket-scorer-teams";
const TOURNAMENTS_KEY = "cricket-scorer-tournaments";
const CLIENT_MIGRATION_FLAG = "cricket-scorer-sqlite-migrated-v1";

type RosterCache = {
  players: Player[];
  teams: Team[];
  tournaments: SavedTournament[];
};

let initPromise: Promise<void> | null = null;

export function buildTeamSelectionSlots(
  teamCount: number,
  existing?: string[]
): string[] {
  const count = Math.max(0, teamCount);
  return Array.from({ length: count }, (_, i) => existing?.[i] ?? "");
}

function normalizeInningsData(raw: unknown): InningsData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<InningsData>;
  if (typeof r.teamId !== "string" || typeof r.teamName !== "string") return null;
  return {
    teamId: r.teamId,
    teamName: r.teamName,
    balls: Array.isArray(r.balls) ? r.balls : [],
    currentBatsmanIndex: r.currentBatsmanIndex ?? 0,
    currentBowlerIndex: r.currentBowlerIndex ?? 0,
    strikerPlayerId: r.strikerPlayerId ?? "",
    nonStrikerPlayerId: r.nonStrikerPlayerId ?? "",
    currentBowlerPlayerId: r.currentBowlerPlayerId ?? "",
    lastBowlerPlayerId: r.lastBowlerPlayerId,
  };
}

function normalizeMatchSnapshot(raw: unknown): TournamentMatchSnapshot | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Partial<TournamentMatchSnapshot>;
  if (!r.team1?.id || !r.team2?.id || !r.config) return undefined;
  return {
    team1: normalizeTeam(r.team1 as Team),
    team2: normalizeTeam(r.team2 as Team),
    config: {
      totalOvers: r.config.totalOvers ?? 20,
      ballsPerOver: r.config.ballsPerOver ?? 6,
    },
    innings1: normalizeInningsData(r.innings1),
    innings2: normalizeInningsData(r.innings2),
  };
}

function normalizeTournament(
  raw: Partial<SavedTournament> & { id: string; name: string; createdAt: string }
): SavedTournament {
  const stageCount = Math.min(
    4,
    Math.max(0, raw.stageCount ?? raw.stages?.length ?? 0)
  );
  const teamCount = raw.teamCount ?? 4;
  const stages =
    stageCount > 0
      ? buildStageConfigs(stageCount, raw.stages, teamCount)
      : [];
  const savedIds = (raw.selectedTeamIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
  const fixtures: TournamentFixture[] = (raw.fixtures ?? [])
    .filter(
      (fx): fx is TournamentFixture =>
        Boolean(fx?.id) &&
        typeof fx.teamAId === "string" &&
        typeof fx.teamBId === "string"
    )
    .map((fx) => ({
      id: fx.id,
      teamAId: fx.teamAId,
      teamBId: fx.teamBId,
      played: Boolean(fx.played),
      result:
        fx.played && fx.result
          ? {
              runsA: Math.max(0, Math.round(fx.result.runsA ?? 0)),
              wicketsA: Math.max(0, Math.round(fx.result.wicketsA ?? 0)),
              runsB: Math.max(0, Math.round(fx.result.runsB ?? 0)),
              wicketsB: Math.max(0, Math.round(fx.result.wicketsB ?? 0)),
              winnerTeamId: fx.result.winnerTeamId,
              bestBatting: fx.result.bestBatting
                ? {
                    playerName: fx.result.bestBatting.playerName,
                    teamId: fx.result.bestBatting.teamId,
                    runs: Math.max(0, Math.round(fx.result.bestBatting.runs)),
                  }
                : undefined,
              bestBowling: fx.result.bestBowling
                ? {
                    playerName: fx.result.bestBowling.playerName,
                    teamId: fx.result.bestBowling.teamId,
                    wickets: Math.max(0, Math.round(fx.result.bestBowling.wickets)),
                  }
                : undefined,
              scorecard: normalizeMatchSnapshot(fx.result.scorecard),
            }
          : undefined,
    }));

  return {
    id: raw.id,
    name: raw.name,
    totalOvers: raw.totalOvers ?? 20,
    ballsPerOver: raw.ballsPerOver ?? 6,
    teamCount,
    stageCount,
    stages,
    selectedTeamIds: buildTeamSelectionSlots(teamCount, savedIds),
    fixtures,
    createdAt: raw.createdAt,
    isTemplate: raw.isTemplate === true,
    templateId:
      typeof raw.templateId === "string" && raw.templateId.length > 0
        ? raw.templateId
        : undefined,
  };
}

function readLegacyJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLegacyBundle(): RosterCache {
  return {
    players: readLegacyJson<Player[]>(PLAYERS_KEY, []).map((p) =>
      normalizePlayer(p)
    ),
    teams: readLegacyJson<Team[]>(TEAMS_KEY, []).map((t) => normalizeTeam(t)),
    tournaments: readLegacyJson<SavedTournament[]>(TOURNAMENTS_KEY, []).map(
      (t) => normalizeTournament(t)
    ),
  };
}

function hasLegacyData(bundle: RosterCache): boolean {
  return (
    bundle.players.length > 0 ||
    bundle.teams.length > 0 ||
    bundle.tournaments.length > 0
  );
}

function markClientMigrated() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_MIGRATION_FLAG, "1");
  localStorage.removeItem(PLAYERS_KEY);
  localStorage.removeItem(TEAMS_KEY);
  localStorage.removeItem(TOURNAMENTS_KEY);
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }
  return res;
}

function normalizeRosterBundle(data: RosterCache): {
  bundle: RosterCache;
  migratedIds: string[];
} {
  const players = data.players.map((p) => normalizePlayer(p));
  const { tournaments, changedIds } = migrateLegacyTournamentTemplates(
    data.tournaments.map((t) => normalizeTournament(t))
  );
  const teams = resolveTeamsFromRoster(
    data.teams.map((t) => normalizeTeam(t)),
    players
  );
  return { bundle: { players, teams, tournaments }, migratedIds: changedIds };
}

async function persistMigratedTemplates(
  tournaments: SavedTournament[],
  migratedIds: string[]
) {
  for (const id of migratedIds) {
    const t = tournaments.find((x) => x.id === id);
    if (!t) continue;
    try {
      await apiFetch(`/api/tournaments/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(t),
      });
    } catch {
      console.error("Failed to persist template migration for", id);
    }
  }
}

function requireHydrated() {
  if (!getRosterState().hydrated) {
    throw new Error("Roster storage is not initialized yet.");
  }
}

/** Load SQLite data via API once into Redux; subsequent reads use the store. */
export async function initRosterStorage(): Promise<void> {
  if (getRosterState().hydrated) return;
  if (initPromise) return initPromise;

  dispatch(rosterActions.setLoading(true));

  initPromise = (async () => {
    try {
      const legacy =
        typeof window !== "undefined" &&
        !localStorage.getItem(CLIENT_MIGRATION_FLAG)
          ? readLegacyBundle()
          : null;

      if (legacy && hasLegacyData(legacy)) {
        await apiFetch("/api/roster/migrate", {
          method: "POST",
          body: JSON.stringify(legacy),
        });
        markClientMigrated();
      }

      const res = await apiFetch("/api/roster");
      const raw = (await res.json()) as RosterCache;
      const { bundle, migratedIds } = normalizeRosterBundle(raw);
      dispatch(rosterActions.hydrateRoster(bundle));
      if (migratedIds.length > 0) {
        void persistMigratedTemplates(bundle.tournaments, migratedIds);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load roster data";
      dispatch(rosterActions.setError(message));
      dispatch(rosterActions.setLoading(false));
      throw err;
    }
  })();

  return initPromise;
}

export function isRosterStorageReady(): boolean {
  return getRosterState().hydrated;
}

/** Re-fetch all roster data from SQLite into Redux (manual resync). */
export async function reloadRosterFromServer(): Promise<void> {
  const res = await apiFetch("/api/roster");
  const { bundle } = normalizeRosterBundle((await res.json()) as RosterCache);
  dispatch(rosterActions.hydrateRoster(bundle));
}

export async function importPlayersBulk(
  players: Player[]
): Promise<{ imported: number }> {
  const normalized = players.map((p) => normalizePlayer(p));
  return withRosterRollback(
    () => dispatch(rosterActions.upsertPlayersBulk(normalized)),
    async () => {
      const res = await apiFetch("/api/players/import", {
        method: "POST",
        body: JSON.stringify({ players: normalized }),
      });
      return (await res.json()) as { imported: number };
    }
  );
}

export async function importTeamsBulk(teams: Team[]): Promise<{ imported: number }> {
  const normalized = teams.map((t) =>
    resolveTeamPlayers(normalizeTeam(t), getSavedPlayers())
  );
  return withRosterRollback(
    () => dispatch(rosterActions.upsertTeamsBulk(normalized)),
    async () => {
      const res = await apiFetch("/api/teams/import", {
        method: "POST",
        body: JSON.stringify({ teams: normalized }),
      });
      return (await res.json()) as { imported: number };
    }
  );
}

export function getSavedPlayers(): Player[] {
  return getRosterState().players;
}

export function getPlayerById(id: string): Player | undefined {
  return getSavedPlayers().find((p) => p.id === id);
}

export async function savePlayer(player: Player): Promise<void> {
  requireHydrated();
  const normalized = normalizePlayer(player);
  await withRosterRollback(
    () => dispatch(rosterActions.upsertPlayer(normalized)),
    () =>
      apiFetch("/api/players", {
        method: "POST",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function updatePlayer(player: Player): Promise<void> {
  requireHydrated();
  const normalized = normalizePlayer(player);
  await withRosterRollback(
    () => {
      dispatch(rosterActions.upsertPlayer(normalized));
      dispatch(rosterActions.syncPlayerInTeams(normalized));
    },
    () =>
      apiFetch(`/api/players/${encodeURIComponent(normalized.id)}`, {
        method: "PUT",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function deletePlayer(playerId: string): Promise<void> {
  requireHydrated();
  await withRosterRollback(
    () => dispatch(rosterActions.removePlayer(playerId)),
    () =>
      apiFetch(`/api/players/${encodeURIComponent(playerId)}`, {
        method: "DELETE",
      }).then(() => undefined)
  );
}

function normalizeTeam(raw: Partial<Team> & { id: string; name: string }): Team {
  return {
    id: raw.id,
    name: raw.name,
    ownerName: raw.ownerName,
    logoUrl: raw.logoUrl,
    players: (raw.players ?? []).map((p) => normalizePlayer(p)),
  };
}

export function getSavedTeams(): Team[] {
  return getRosterState().teams;
}

export function getTeamById(id: string): Team | undefined {
  return getSavedTeams().find((t) => t.id === id);
}

export async function saveTeam(team: Team): Promise<void> {
  requireHydrated();
  const normalized = resolveTeamPlayers(
    normalizeTeam(team),
    getSavedPlayers()
  );
  await withRosterRollback(
    () => dispatch(rosterActions.upsertTeam(normalized)),
    () =>
      apiFetch("/api/teams", {
        method: "POST",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function updateTeam(team: Team): Promise<void> {
  requireHydrated();
  const normalized = resolveTeamPlayers(
    normalizeTeam(team),
    getSavedPlayers()
  );
  await withRosterRollback(
    () => dispatch(rosterActions.upsertTeam(normalized)),
    () =>
      apiFetch(`/api/teams/${encodeURIComponent(normalized.id)}`, {
        method: "PUT",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function deleteTeam(teamId: string): Promise<void> {
  requireHydrated();
  await withRosterRollback(
    () => dispatch(rosterActions.removeTeam(teamId)),
    () =>
      apiFetch(`/api/teams/${encodeURIComponent(teamId)}`, {
        method: "DELETE",
      }).then(() => undefined)
  );
}

/** playerId → team name (optionally skip one team when editing) */
export function getPlayerTeamAssignments(
  excludeTeamId?: string
): Map<string, string> {
  const map = new Map<string, string>();
  for (const team of getSavedTeams()) {
    if (excludeTeamId && team.id === excludeTeamId) continue;
    for (const player of team.players) {
      map.set(player.id, team.name);
    }
  }
  return map;
}

export function findPlayersAlreadyOnOtherTeams(
  playerIds: string[],
  excludeTeamId?: string
): { playerId: string; playerName: string; teamName: string }[] {
  const assignments = getPlayerTeamAssignments(excludeTeamId);
  const players = getSavedPlayers();
  const conflicts: { playerId: string; playerName: string; teamName: string }[] =
    [];

  for (const playerId of playerIds) {
    const teamName = assignments.get(playerId);
    if (!teamName) continue;
    const player = players.find((p) => p.id === playerId);
    conflicts.push({
      playerId,
      playerName: player?.name ?? "Player",
      teamName,
    });
  }
  return conflicts;
}

export function getSavedTournaments(): SavedTournament[] {
  return getRosterState().tournaments;
}

export function getTournamentTemplates(): SavedTournament[] {
  return getSavedTournaments().filter((t) => t.isTemplate === true);
}

export function getPlayTournaments(): SavedTournament[] {
  return getSavedTournaments().filter((t) => t.isTemplate !== true);
}

export function getTournamentById(id: string): SavedTournament | undefined {
  return getSavedTournaments().find((t) => t.id === id);
}

export async function saveTournament(tournament: SavedTournament): Promise<void> {
  requireHydrated();
  const normalized = normalizeTournament(tournament);
  await withRosterRollback(
    () => dispatch(rosterActions.upsertTournament(normalized)),
    () =>
      apiFetch("/api/tournaments", {
        method: "POST",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function updateTournament(
  tournament: SavedTournament
): Promise<void> {
  requireHydrated();
  const normalized = normalizeTournament(tournament);
  await withRosterRollback(
    () => dispatch(rosterActions.upsertTournament(normalized)),
    () =>
      apiFetch(`/api/tournaments/${encodeURIComponent(normalized.id)}`, {
        method: "PUT",
        body: JSON.stringify(normalized),
      }).then(() => undefined)
  );
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  requireHydrated();
  await withRosterRollback(
    () => dispatch(rosterActions.removeTournament(tournamentId)),
    () =>
      apiFetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, {
        method: "DELETE",
      }).then(() => undefined)
  );
}

export function getPlayRunsForTemplate(templateId: string): SavedTournament[] {
  return getPlayTournaments().filter((t) => t.templateId === templateId);
}
