"use client";

import { Suspense } from "react";
import LiveEmbedCelebrationOverlay from "@/components/embed/LiveEmbedCelebrationOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedCelebrationPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedCelebrationOverlay />
    </Suspense>
  );
}
