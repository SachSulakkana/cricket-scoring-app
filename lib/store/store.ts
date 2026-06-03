import { configureStore } from "@reduxjs/toolkit";
import { matchReducer } from "./match-slice";
import { rosterReducer } from "./roster-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      roster: rosterReducer,
      match: matchReducer,
    },
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
