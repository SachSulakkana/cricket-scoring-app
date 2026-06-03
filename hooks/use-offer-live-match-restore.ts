"use client";

import { useEffect, useRef } from "react";
import { useResumePrompt } from "@/components/ResumePromptProvider";
import { useCricket } from "@/lib/cricket-context";
import {
  draftMatchesSession,
  loadLiveMatchDraftLocal,
} from "@/lib/live-match-draft";
import type { MatchState } from "@/lib/cricket-types";
import {
  liveMetaKey,
  liveMetaMatches,
  type LiveMatchMeta,
} from "@/lib/store/match-slice";

/** Call when entering a scored session to offer resume from draft. */
export function useOfferLiveMatchRestore(
  meta: LiveMatchMeta | null,
  onRestore: (matchState: MatchState) => void
) {
  const { matchState, liveMeta, restoreLiveDraft, setLiveSession } = useCricket();
  const { offerResume } = useResumePrompt();
  const handledKeyRef = useRef<string | null>(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const metaKey = liveMetaKey(meta);

  useEffect(() => {
    if (!meta || !metaKey) return;
    if (handledKeyRef.current === metaKey) return;
    if (matchState.matchStarted) return;

    const ensureSession = () => {
      if (!liveMetaMatches(liveMeta, meta)) {
        setLiveSession(meta);
      }
    };

    const local = loadLiveMatchDraftLocal();
    if (!local?.matchState.matchStarted || !draftMatchesSession(local, meta)) {
      handledKeyRef.current = metaKey;
      ensureSession();
      return;
    }

    handledKeyRef.current = metaKey;
    const ballCount = local.matchState.innings1?.balls.length ?? 0;

    offerResume({
      meta: local.meta ?? meta,
      matchState: local.matchState,
      ballCount,
      onAccept: () => {
        restoreLiveDraft(local.matchState, local.meta ?? meta);
        onRestoreRef.current(local.matchState);
      },
      onDecline: () => {
        ensureSession();
      },
    });
  }, [
    metaKey,
    meta,
    matchState.matchStarted,
    liveMeta,
    offerResume,
    restoreLiveDraft,
    setLiveSession,
  ]);
}
