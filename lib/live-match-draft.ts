import type { MatchState } from "./cricket-types";
import type { LiveMatchMeta } from "./store/match-slice";
import { authenticatedFetch } from "./api-client";

const LOCAL_DRAFT_KEY = "cricket-live-match-draft-v1";
const LOCAL_DRAFT_CHANNEL = "cricket-live-match-draft";

export interface LiveMatchDraft {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  updatedAt: string;
}

export class LiveDraftSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveDraftSyncError";
  }
}

function getDraftChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  try {
    return new BroadcastChannel(LOCAL_DRAFT_CHANNEL);
  } catch {
    return null;
  }
}

function publishLiveMatchDraftLocal(draft: LiveMatchDraft | null) {
  const channel = getDraftChannel();
  if (!channel) return;
  try {
    channel.postMessage(draft);
  } finally {
    channel.close();
  }
}

export function saveLiveMatchDraftLocal(
  matchState: MatchState,
  meta: LiveMatchMeta | null
) {
  if (typeof window === "undefined") return;
  if (!matchState.matchStarted) {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    publishLiveMatchDraftLocal(null);
    return;
  }
  const draft: LiveMatchDraft = {
    matchState,
    meta,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
  publishLiveMatchDraftLocal(draft);
}

export function loadLiveMatchDraftLocal(): LiveMatchDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LiveMatchDraft;
  } catch {
    return null;
  }
}

/** Same-device windows (e.g. Big Score) follow local draft without a DB round-trip. */
export function subscribeLiveMatchDraftLocal(
  onChange: (draft: LiveMatchDraft | null) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  onChange(loadLiveMatchDraftLocal());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOCAL_DRAFT_KEY) return;
    onChange(loadLiveMatchDraftLocal());
  };
  window.addEventListener("storage", onStorage);

  const channel = getDraftChannel();
  const onMessage = (event: MessageEvent<LiveMatchDraft | null>) => {
    onChange(event.data ?? null);
  };
  channel?.addEventListener("message", onMessage);

  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.removeEventListener("message", onMessage);
    channel?.close();
  };
}

export function clearLiveMatchDraftLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_DRAFT_KEY);
  publishLiveMatchDraftLocal(null);
}

/** Stop live sync while keeping in-memory Redux state for summary screens. */
export function clearLiveMatchDraftPersistence() {
  clearLiveMatchDraftLocal();
  void clearLiveMatchDraftRemote();
}

export async function saveLiveMatchDraftRemote(
  matchState: MatchState,
  meta: LiveMatchMeta | null
): Promise<void> {
  if (!matchState.matchStarted) {
    const res = await authenticatedFetch("/api/matches/draft", { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new LiveDraftSyncError(
        body.error ?? "Could not clear live match draft on server"
      );
    }
    return;
  }

  const res = await authenticatedFetch("/api/matches/draft", {
    method: "PUT",
    body: JSON.stringify({
      matchState,
      meta,
      updatedAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new LiveDraftSyncError(
      body.error ?? "Could not save live match draft to server"
    );
  }
}

export async function loadLiveMatchDraftRemote(): Promise<LiveMatchDraft | null> {
  try {
    const res = await fetch("/api/matches/draft");
    if (!res.ok) return null;
    const body = (await res.json()) as { draft: LiveMatchDraft | null };
    return body.draft ?? null;
  } catch {
    return null;
  }
}

export async function clearLiveMatchDraftRemote(): Promise<void> {
  const res = await authenticatedFetch("/api/matches/draft", { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new LiveDraftSyncError(
      body.error ?? "Could not clear live match draft on server"
    );
  }
}

/** Pick newest draft between local and server. */
export function pickNewestDraft(
  a: LiveMatchDraft | null,
  b: LiveMatchDraft | null
): LiveMatchDraft | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.updatedAt) >= new Date(b.updatedAt) ? a : b;
}

export function draftMatchesSession(
  draft: LiveMatchDraft,
  meta: LiveMatchMeta | null
): boolean {
  if (!draft.meta || !meta) return false;
  if (draft.meta.kind !== meta.kind) return false;
  if (meta.kind === "quick") return true;
  return (
    draft.meta.tournamentId === meta.tournamentId &&
    draft.meta.fixtureId === meta.fixtureId
  );
}
