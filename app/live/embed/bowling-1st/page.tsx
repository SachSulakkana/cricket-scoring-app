"use client";

import { Suspense } from "react";
import LiveEmbedBowlingOverlay from "@/components/embed/LiveEmbedBowlingOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedBowling1stPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedBowlingOverlay innings="first" />
    </Suspense>
  );
}
