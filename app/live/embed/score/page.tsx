"use client";

import { Suspense } from "react";
import LiveEmbedBigScoreOverlay from "@/components/embed/LiveEmbedBigScoreOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedScorePage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedBigScoreOverlay />
    </Suspense>
  );
}
