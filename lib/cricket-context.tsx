"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  BallData,
  InningsData,
  MatchConfig,
  MatchState,
  Team,
} from "./cricket-types";
import {
  clearLiveMatchDraftLocal,
  clearLiveMatchDraftRemote,
  saveLiveMatchDraftLocal,
  saveLiveMatchDraftRemote,
} from "./live-match-draft";
import {
  getActiveScoringContext,
  type ActiveScoringContext,
} from "./scoring-context";
import { SUPER_OVER_BALLS } from "./super-over";
import { getStore } from "./store/store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  initialMatchState,
  matchActions,
  type LiveMatchMeta,
} from "./store/match-slice";

interface CricketContextType {
  matchState: MatchState;
  liveMeta: LiveMatchMeta | null;
  setLiveSession: (meta: LiveMatchMeta | null) => void;
  restoreLiveDraft: (matchState: MatchState, meta: LiveMatchMeta | null) => void;
  clearLiveDraft: () => void;
  /** Stop persisting live draft; keep Redux for post-match summary. */
  finalizeLiveMatch: () => void;
  /** Immediately write the current Redux match + meta to the live draft. */
  flushPersistDraft: () => void;
  setTeam1: (team: Team) => void;
  setTeam2: (team: Team) => void;
  setMatchConfig: (config: MatchConfig) => void;
  startMatch: () => void;
  addBall: (ball: BallData) => void;
  undoLastBall: () => void;
  switchInnings: () => void;
  resetMatch: () => void;
  getCurrentInningsData: () => InningsData | null;
  setOpeningBatsmen: (strikerId: string, nonStrikerId: string) => void;
  setOpeningBowler: (bowlerId: string) => void;
  setNextBowler: (bowlerId: string) => void;
  setNextBatsman: (playerId: string, isStriker: boolean) => void;
  swapStrike: () => void;
  acceptMatchDraw: () => void;
  initSuperOver: (firstBattingTeamId: string, ballsPerOver?: number) => void;
  switchSuperOverInnings: () => void;
  completeSuperOver: () => void;
  getActiveScoringContext: () => ActiveScoringContext | null;
}

const CricketContext = createContext<CricketContextType | undefined>(undefined);

export function CricketProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const matchState = useAppSelector((s) => s.match.matchState);
  const liveMeta = useAppSelector((s) => s.match.meta);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestState = useRef({ matchState, liveMeta });
  latestState.current = { matchState, liveMeta };

  const persistDraft = useCallback((state: MatchState, meta: LiveMatchMeta | null) => {
    saveLiveMatchDraftLocal(state, meta);
    void saveLiveMatchDraftRemote(state, meta).catch((err) => {
      console.error("Live draft sync failed", err);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cricket-live-draft-sync-error", {
            detail: err instanceof Error ? err.message : "Sync failed",
          })
        );
      }
    });
  }, []);

  const flushPersistDraft = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    const { match } = getStore().getState();
    persistDraft(match.matchState, match.meta);
  }, [persistDraft]);

  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    if (!matchState.matchStarted) return;
    persistTimer.current = setTimeout(() => {
      persistDraft(matchState, liveMeta);
    }, 150);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [matchState, liveMeta, persistDraft]);

  useEffect(() => {
    const onPageHide = () => flushPersistDraft();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [flushPersistDraft]);

  const setLiveSession = useCallback(
    (meta: LiveMatchMeta | null) => {
      dispatch(matchActions.setLiveMatchMeta(meta));
    },
    [dispatch]
  );

  const restoreLiveDraft = useCallback(
    (state: MatchState, meta: LiveMatchMeta | null) => {
      dispatch(matchActions.restoreLiveMatch({ matchState: state, meta }));
    },
    [dispatch]
  );

  const clearLiveDraft = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    dispatch(matchActions.resetLiveMatch());
    clearLiveMatchDraftLocal();
    void clearLiveMatchDraftRemote();
  }, [dispatch]);

  const finalizeLiveMatch = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    // Keep the completed match on the live draft so OBS overlays can show
    // the result (and coming-up-next) until the next match starts.
    const { match } = getStore().getState();
    if (match.matchState.matchStarted) {
      persistDraft(match.matchState, match.meta);
    }
  }, [persistDraft]);

  const setTeam1 = useCallback(
    (team: Team) => dispatch(matchActions.setTeam1(team)),
    [dispatch]
  );
  const setTeam2 = useCallback(
    (team: Team) => dispatch(matchActions.setTeam2(team)),
    [dispatch]
  );
  const setMatchConfig = useCallback(
    (config: MatchConfig) => dispatch(matchActions.setMatchConfig(config)),
    [dispatch]
  );
  const startMatch = useCallback(() => {
    dispatch(matchActions.startMatch());
    const { match } = getStore().getState();
    persistDraft(match.matchState, match.meta);
  }, [dispatch, persistDraft]);
  const addBall = useCallback(
    (ball: BallData) => dispatch(matchActions.addBall(ball)),
    [dispatch]
  );
  const undoLastBall = useCallback(
    () => dispatch(matchActions.undoLastBall()),
    [dispatch]
  );
  const switchInnings = useCallback(
    () => dispatch(matchActions.switchInnings()),
    [dispatch]
  );
  const resetMatch = useCallback(() => {
    dispatch(matchActions.resetLiveMatch());
    clearLiveMatchDraftLocal();
    void clearLiveMatchDraftRemote();
  }, [dispatch]);

  const getCurrentInningsData = useCallback(() => {
    return matchState.currentInnings === 1
      ? matchState.innings1
      : matchState.innings2;
  }, [matchState]);

  const setOpeningBatsmen = useCallback(
    (strikerId: string, nonStrikerId: string) => {
      dispatch(matchActions.setOpeningBatsmen({ strikerId, nonStrikerId }));
    },
    [dispatch]
  );
  const setOpeningBowler = useCallback(
    (bowlerId: string) => dispatch(matchActions.setOpeningBowler(bowlerId)),
    [dispatch]
  );
  const setNextBowler = useCallback(
    (bowlerId: string) => dispatch(matchActions.setNextBowler(bowlerId)),
    [dispatch]
  );
  const setNextBatsman = useCallback(
    (playerId: string, isStriker: boolean) => {
      dispatch(matchActions.setNextBatsman({ playerId, isStriker }));
    },
    [dispatch]
  );
  const swapStrike = useCallback(
    () => dispatch(matchActions.swapStrike()),
    [dispatch]
  );
  const acceptMatchDraw = useCallback(
    () => dispatch(matchActions.acceptMatchDraw()),
    [dispatch]
  );
  const initSuperOver = useCallback(
    (firstBattingTeamId: string, ballsPerOver?: number) => {
      dispatch(
        matchActions.initSuperOver({
          firstBattingTeamId,
          ballsPerOver: ballsPerOver ?? SUPER_OVER_BALLS,
        })
      );
      const { match } = getStore().getState();
      persistDraft(match.matchState, match.meta);
    },
    [dispatch, persistDraft]
  );
  const switchSuperOverInnings = useCallback(
    () => dispatch(matchActions.switchSuperOverInnings()),
    [dispatch]
  );
  const completeSuperOver = useCallback(
    () => dispatch(matchActions.completeSuperOver()),
    [dispatch]
  );
  const getActiveScoringContextFn = useCallback(
    () => getActiveScoringContext(matchState),
    [matchState]
  );

  const value: CricketContextType = {
    matchState,
    liveMeta,
    setLiveSession,
    restoreLiveDraft,
    clearLiveDraft,
    finalizeLiveMatch,
    flushPersistDraft,
    setTeam1,
    setTeam2,
    setMatchConfig,
    startMatch,
    addBall,
    undoLastBall,
    switchInnings,
    resetMatch,
    getCurrentInningsData,
    setOpeningBatsmen,
    setOpeningBowler,
    setNextBowler,
    setNextBatsman,
    swapStrike,
    acceptMatchDraw,
    initSuperOver,
    switchSuperOverInnings,
    completeSuperOver,
    getActiveScoringContext: getActiveScoringContextFn,
  };

  return (
    <CricketContext.Provider value={value}>{children}</CricketContext.Provider>
  );
}

export function useCricket() {
  const context = useContext(CricketContext);
  if (!context) {
    throw new Error("useCricket must be used within CricketProvider");
  }
  return context;
}

export { initialMatchState };
