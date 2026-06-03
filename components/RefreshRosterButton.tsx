"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { appToast } from "@/lib/app-toast";
import { reloadRosterFromServer } from "@/lib/roster-storage";

export default function RefreshRosterButton() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    void reloadRosterFromServer()
      .then(() => appToast.success("Data refreshed from database"))
      .catch((err) =>
        appToast.error(
          err instanceof Error ? err.message : "Could not refresh data"
        )
      )
      .finally(() => setLoading(false));
  };

  return (
    <button
      type="button"
      className="cricket-btn-import inline-flex items-center gap-1.5"
      disabled={loading}
      onClick={handleRefresh}
      title="Reload all players, teams, and tournaments from the database"
      aria-label="Refresh data from database"
    >
      {loading ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="refresh-roster-btn__label">Refresh data</span>
    </button>
  );
}
