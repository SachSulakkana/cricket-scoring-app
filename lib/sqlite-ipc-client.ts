import "server-only";

import type { DbClient } from "./sqlite-connection";

/**
 * Proxies SQL calls to the Electron main process over the Node IPC channel
 * that exists because Electron forks (not spawns) this server process — see
 * electron/main.cjs. The main process owns the real better-sqlite3 database
 * (electron/sql-bridge.cjs) so the native addon never has to run inside this
 * process (which may have a different Node ABI than Electron bundles).
 */
const CHANNEL = "crickscore-db";

type PendingEntry = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

let seq = 0;
const pending = new Map<number, PendingEntry>();
let listening = false;

function ensureListening() {
  if (listening) return;
  if (typeof process.send !== "function") {
    throw new Error(
      "CRICKSCORE_SQLITE_IPC=1 but this process has no IPC channel (must be forked, not spawned)."
    );
  }
  process.on("message", (message: unknown) => {
    const msg = message as { channel?: string; id?: number; result?: unknown; error?: string };
    if (!msg || msg.channel !== CHANNEL || typeof msg.id !== "number") return;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.error) entry.reject(new Error(msg.error));
    else entry.resolve(msg.result);
  });
  listening = true;
}

function call<T>(kind: "get" | "all" | "run" | "batch", payload: Record<string, unknown>): Promise<T> {
  ensureListening();
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    process.send!({ channel: CHANNEL, id, kind, ...payload });
  });
}

export const ipcDbClient: DbClient = {
  get: (sql, params = []) => call("get", { sql, params }),
  all: (sql, params = []) => call("all", { sql, params }),
  run: (sql, params = []) => call("run", { sql, params }),
  batch: (ops) => call("batch", { ops }),
};
