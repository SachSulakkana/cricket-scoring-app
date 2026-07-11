"use client";

import { Suspense } from "react";
import LiveScoreOverlay from "@/components/LiveScoreOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-root live-embed-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveScoreOverlay />
    </Suspense>
  );
}
