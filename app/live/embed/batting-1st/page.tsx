"use client";

import { Suspense } from "react";
import LiveEmbedBattingOverlay from "@/components/embed/LiveEmbedBattingOverlay";
import CricketLoader from "@/components/CricketLoader";

function LiveEmbedFallback() {
  return (
    <div className="live-embed-panel-root live-embed-panel-root--loading">
      <CricketLoader size="sm" label="Loading overlay…" />
    </div>
  );
}

export default function LiveEmbedBatting1stPage() {
  return (
    <Suspense fallback={<LiveEmbedFallback />}>
      <LiveEmbedBattingOverlay innings="first" />
    </Suspense>
  );
}
