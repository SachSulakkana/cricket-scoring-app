import type { MatchState } from "./cricket-types";
import type { LiveMatchMeta } from "./store/match-slice";

const LOCAL_DRAFT_KEY = "cricket-live-match-draft-v1";

export interface LiveMatchDraft {
  matchState: MatchState;
  meta: LiveMatchMeta | null;
  updatedAt: string;
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
    await fetch("/api/matches/draft", { method: "DELETE" }).catch(() => {});
    return;
  }
  await fetch("/api/matches/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchState,
      meta,
      updatedAt: new Date().toISOString(),
    }),
  }).catch(() => {});
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
  await fetch("/api/matches/draft", { method: "DELETE" }).catch(() => {});
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
