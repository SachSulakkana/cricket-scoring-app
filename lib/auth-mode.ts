import "server-only";

/**
 * AUTH_MODE=none disables Firebase Auth entirely: every request is treated as
 * a single fixed local user, no login/session cookie is required. Useful for
 * a fully offline/local setup (pairs well with DB_BACKEND=sqlite).
 */
export const AUTH_DISABLED = process.env.AUTH_MODE?.trim().toLowerCase() === "none";

export const LOCAL_UID = "local";

export const LOCAL_USER = { uid: LOCAL_UID, email: null as string | null };
