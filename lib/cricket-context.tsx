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
}

const CricketContext = createContext<CricketContextType | undefined>(undefined);

export function CricketProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const matchState = useAppSelector((s) => s.match.matchState);
  const liveMeta = useAppSelector((s) => s.match.meta);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistDraft = useCallback((state: MatchState, meta: LiveMatchMeta | null) => {
    saveLiveMatchDraftLocal(state, meta);
    void saveLiveMatchDraftRemote(state, meta);
  }, []);

  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      persistDraft(matchState, liveMeta);
    }, 400);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [matchState, liveMeta, persistDraft]);

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
    dispatch(matchActions.resetLiveMatch());
    clearLiveMatchDraftLocal();
    void clearLiveMatchDraftRemote();
  }, [dispatch]);

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
  const startMatch = useCallback(
    () => dispatch(matchActions.startMatch()),
    [dispatch]
  );
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

  const value: CricketContextType = {
    matchState,
    liveMeta,
    setLiveSession,
    restoreLiveDraft,
    clearLiveDraft,
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
