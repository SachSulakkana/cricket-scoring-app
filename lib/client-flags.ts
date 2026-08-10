/**
 * Client-safe mirrors of the server-side DB_BACKEND / AUTH_MODE env flags.
 * Next.js only exposes NEXT_PUBLIC_-prefixed vars to the browser bundle, so
 * these must be set alongside the server-only versions (see .env.example).
 */
export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_MODE?.trim().toLowerCase() === "none";
}

export function isSqliteBackendClient(): boolean {
  return process.env.NEXT_PUBLIC_DB_BACKEND?.trim().toLowerCase() === "sqlite";
}

export const LOCAL_UID = "local";
