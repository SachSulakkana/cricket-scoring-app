import { configureStore } from "@reduxjs/toolkit";
import type { MatchState } from "../cricket-types";
import { loadLiveMatchDraftLocal } from "../live-match-draft";
import { matchReducer, type LiveMatchMeta } from "./match-slice";
import { rosterReducer } from "./roster-slice";

function readPreloadedState():
  | {
      match: {
        matchState: MatchState;
        meta: LiveMatchMeta | null;
      };
    }
  | undefined {
  if (typeof window === "undefined") return undefined;
  const draft = loadLiveMatchDraftLocal();
  if (!draft?.matchState.matchStarted) return undefined;
  return {
    match: {
      matchState: draft.matchState,
      meta: draft.meta,
    },
  };
}

export function makeStore() {
  return configureStore({
    reducer: {
      roster: rosterReducer,
      match: matchReducer,
    },
    preloadedState: readPreloadedState(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

let clientStore: AppStore | undefined;

/** Singleton store for client-side persistence layer and React. */
export function getStore(): AppStore {
  if (typeof window === "undefined") {
    return makeStore();
  }
  if (!clientStore) {
    clientStore = makeStore();
  }
  return clientStore;
}
