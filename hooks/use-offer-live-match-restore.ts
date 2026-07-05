"use client";

import { useEffect, useRef } from "react";
import { useCricket } from "@/lib/cricket-context";
import type { MatchState } from "@/lib/cricket-types";
import {
  draftHasLiveMatch,
  loadPersistedLiveDraft,
  sessionHasLiveMatch,
} from "@/lib/match-session-restore";
import {
  isQuickMatchInProgress,
} from "@/lib/quick-match-session";
import {
  liveMetaKey,
  liveMetaMatches,
  type LiveMatchMeta,
} from "@/lib/store/match-slice";

type RestoreOptions = {
  /** When true, call onOfferRestore instead of restoring immediately. */
  prompt?: boolean;
  onOfferRestore?: (state: MatchState) => void;
  onNoRestore?: () => void;
};

/** Restore live scoring from Redux or persisted draft when entering a session. */
export function useOfferLiveMatchRestore(
  meta: LiveMatchMeta | null,
  onRestore: (matchState: MatchState) => void,
  options?: RestoreOptions
) {
  const { matchState, liveMeta, restoreLiveDraft, setLiveSession } = useCricket();
  const handledKeyRef = useRef<string | null>(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const metaKey = liveMetaKey(meta);

  useEffect(() => {
    if (!meta || !metaKey) return;
    if (handledKeyRef.current === metaKey) return;

    const finishWithoutRestore = () => {
      handledKeyRef.current = metaKey;
      if (!liveMetaMatches(liveMeta, meta)) {
        setLiveSession(meta);
      }
      optionsRef.current?.onNoRestore?.();
    };

    const restoreNow = (state: MatchState, restoreMeta: LiveMatchMeta) => {
      handledKeyRef.current = metaKey;
      if (!sessionHasLiveMatch(matchState, liveMeta, meta)) {
        restoreLiveDraft(state, restoreMeta);
      } else if (!liveMetaMatches(liveMeta, meta)) {
        setLiveSession(restoreMeta);
      }
      onRestoreRef.current(state);
    };

    const offerOrRestore = (state: MatchState, restoreMeta: LiveMatchMeta) => {
      const inProgress =
        meta.kind === "quick" ? isQuickMatchInProgress(state) : state.matchStarted;

      if (optionsRef.current?.prompt && inProgress) {
        handledKeyRef.current = metaKey;
        if (!liveMetaMatches(liveMeta, meta)) {
          setLiveSession(meta);
        }
        optionsRef.current.onOfferRestore?.(state);
        return;
      }

      if (state.matchStarted && inProgress) {
        restoreNow(state, restoreMeta);
        return;
      }

      finishWithoutRestore();
    };

    if (
      sessionHasLiveMatch(matchState, liveMeta, meta) &&
      (meta.kind !== "quick" || isQuickMatchInProgress(matchState))
    ) {
      offerOrRestore(matchState, liveMeta ?? meta);
      return;
    }

    const draft = loadPersistedLiveDraft();
    if (draftHasLiveMatch(draft, meta)) {
      offerOrRestore(draft!.matchState, draft!.meta ?? meta);
      return;
    }

    finishWithoutRestore();
  }, [
    metaKey,
    meta,
    matchState,
    liveMeta,
    restoreLiveDraft,
    setLiveSession,
  ]);
}
