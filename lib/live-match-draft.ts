import type { MatchState } from "./cricket-types";
import type { LiveMatchMeta } from "./store/match-slice";
import { authenticatedFetch } from "./api-client";

const LOCAL_DRAFT_KEY = "cricket-live-match-draft-v1";

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

export function saveLiveMatchDraftLocal(
  matchState: MatchState,
  meta: LiveMatchMeta | null
) {
  if (typeof window === "undefined") return;
  if (!matchState.matchStarted) {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    return;
  }
  const draft: LiveMatchDraft = {
    matchState,
    meta,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
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

export function clearLiveMatchDraftLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_DRAFT_KEY);
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
