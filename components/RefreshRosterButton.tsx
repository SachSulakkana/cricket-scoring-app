"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import CricketLoader from "@/components/CricketLoader";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      size="icon-sm"
      disabled={loading}
      onClick={handleRefresh}
      title="Reload all players, teams, and tournaments from the database"
      aria-label="Refresh data from database"
    >
      {loading ? (
        <CricketLoader size="sm" />
      ) : (
        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
      )}
    </Button>
  );
}
