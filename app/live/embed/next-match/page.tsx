"use client";

import { Suspense } from "react";
import LiveEmbedNextMatchOverlay from "@/components/embed/LiveEmbedNextMatchOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedNextMatchPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedNextMatchOverlay />
    </Suspense>
  );
}
