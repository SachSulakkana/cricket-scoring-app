"use client";

import { Suspense } from "react";
import LiveEmbedUpcomingMatchOverlay from "@/components/embed/LiveEmbedUpcomingMatchOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedUpcomingPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedUpcomingMatchOverlay />
    </Suspense>
  );
}
