"use client";

import { Suspense } from "react";
import LiveEmbedPointsOverlay from "@/components/embed/LiveEmbedPointsOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedPointsPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedPointsOverlay />
    </Suspense>
  );
}
