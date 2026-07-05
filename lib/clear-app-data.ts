"use client";

import {
  clearLiveMatchDraftLocal,
  clearLiveMatchDraftRemote,
} from "@/lib/live-match-draft";
import { authenticatedFetch } from "@/lib/api-client";
import { reloadRosterFromServer } from "@/lib/roster-storage";
import type { DataClearAction } from "@/lib/data-clear-types";
import { getStore } from "@/lib/store/store";
import { matchActions } from "@/lib/store/match-slice";

export type { DataClearAction };

export const DATA_CLEAR_OPTIONS: {
  action: DataClearAction;
  label: string;
  description: string;
  variant?: "default" | "destructive";
}[] = [
  {
    action: "match-history",
    label: "Clear match history",
    description:
      "Removes saved quick matches from the database. Players, teams, and tournaments are kept.",
  },
  {
    action: "match-data",
    label: "Clear all match data",
    description:
      "Deletes all tournaments (templates and play runs), saved matches, and live drafts. Only players and teams are kept.",
  },
  {
    action: "teams",
    label: "Clear teams",
    description:
      "Deletes all teams and squad assignments. Players and tournaments remain.",
  },
  {
    action: "players",
    label: "Clear players",
    description:
      "Deletes all players and removes them from any teams. Teams and tournaments remain (teams will be empty).",
  },
  {
    action: "all",
    label: "Clear all data (full clean)",
    description:
      "Deletes everything: players, teams, tournaments, match history, and drafts. This cannot be undone.",
    variant: "destructive",
  },
];

export async function clearAppData(action: DataClearAction): Promise<void> {
  const res = await authenticatedFetch("/api/settings/clear", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to clear data");
  }

  clearLiveMatchDraftLocal();
  void clearLiveMatchDraftRemote();
  getStore().dispatch(matchActions.resetLiveMatch());
  await reloadRosterFromServer();
}
