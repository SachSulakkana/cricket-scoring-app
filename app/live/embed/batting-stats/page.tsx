"use client";

import { Suspense } from "react";
import LiveEmbedTournamentLeaderboardOverlay from "@/components/embed/LiveEmbedTournamentLeaderboardOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedBattingStatsPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedTournamentLeaderboardOverlay mode="batting" />
    </Suspense>
  );
}
