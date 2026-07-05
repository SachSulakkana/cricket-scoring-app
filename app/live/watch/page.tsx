"use client";

import { Suspense } from "react";
import SpectatorView from "@/components/SpectatorView";
import CricketLoader from "@/components/CricketLoader";
import { CricketPage } from "@/components/cricket-shell";

function LiveWatchFallback() {
  return (
    <CricketPage className="spectator-page">
      <CricketLoader block size="lg" label="Loading live score…" />
    </CricketPage>
  );
}

export default function LiveWatchPage() {
  return (
    <Suspense fallback={<LiveWatchFallback />}>
      <SpectatorView />
    </Suspense>
  );
}
