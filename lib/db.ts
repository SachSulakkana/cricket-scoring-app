import "server-only";

/**
 * Single entry point for app data storage. Backend is chosen at runtime via
 * DB_BACKEND=sqlite|firebase (see lib/db-backend.ts). All API routes and
 * server helpers should import from here instead of lib/firestore-db or
 * lib/sqlite-db directly, so the app works identically on either backend.
 */
import * as firestoreDb from "./firestore-db";
import * as sqliteDb from "./sqlite-db";
import { isSqliteBackend } from "./db-backend";

const impl = isSqliteBackend ? sqliteDb : firestoreDb;

export type {
  DbTournament,
  LiveMatchDraft,
  DbQuickMatchListItem,
  DbQuickMatchDetail,
} from "./firestore-db";

export const listPlayers = impl.listPlayers;
export const getPlayer = impl.getPlayer;
export const savePlayer = impl.savePlayer;
export const bulkImportPlayers = impl.bulkImportPlayers;
export const deletePlayer = impl.deletePlayer;
export const syncPlayerInTeams = impl.syncPlayerInTeams;

export const listTeams = impl.listTeams;
export const getTeam = impl.getTeam;
export const saveTeam = impl.saveTeam;
export const bulkImportTeams = impl.bulkImportTeams;
export const deleteTeam = impl.deleteTeam;

export const listTournaments = impl.listTournaments;
export const getTournament = impl.getTournament;
export const saveTournament = impl.saveTournament;
export const deleteTournament = impl.deleteTournament;

export const loadAll = impl.loadAll;
export const migrateFromLegacy = impl.migrateFromLegacy;
export const isLegacyMigrated = impl.isLegacyMigrated;

export const getLiveMatchDraft = impl.getLiveMatchDraft;
export const saveLiveMatchDraft = impl.saveLiveMatchDraft;
export const clearLiveMatchDraft = impl.clearLiveMatchDraft;

export const saveQuickMatch = impl.saveQuickMatch;
export const getQuickMatchById = impl.getQuickMatchById;
export const deleteQuickMatch = impl.deleteQuickMatch;
export const listQuickMatches = impl.listQuickMatches;

export const clearMatchHistory = impl.clearMatchHistory;
export const clearAllMatchData = impl.clearAllMatchData;
export const clearAllTeams = impl.clearAllTeams;
export const clearAllPlayers = impl.clearAllPlayers;
export const clearAllData = impl.clearAllData;
export const runDataClear = impl.runDataClear;

export const upsertUserProfile = impl.upsertUserProfile;
export const getUserLiveShareKey = impl.getUserLiveShareKey;
export const setUserLiveShareKey = impl.setUserLiveShareKey;
export const getUidForLiveShareKey = impl.getUidForLiveShareKey;
export const setLiveShareKeyMapping = impl.setLiveShareKeyMapping;
export const deleteLiveShareKeyMapping = impl.deleteLiveShareKeyMapping;
