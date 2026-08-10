import "server-only";

/**
 * Selects the storage backend for app data.
 * DB_BACKEND=sqlite -> local file at ./data/crickscore.sqlite (no Google Cloud project needed).
 * DB_BACKEND=firebase (default) -> Firestore, as before.
 */
export const DB_BACKEND: "sqlite" | "firebase" =
  process.env.DB_BACKEND?.trim().toLowerCase() === "sqlite" ? "sqlite" : "firebase";

export const isSqliteBackend = DB_BACKEND === "sqlite";
