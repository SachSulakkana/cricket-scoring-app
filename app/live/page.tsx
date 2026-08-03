"use client";

import { Suspense } from "react";
import LiveMatchHub from "@/components/LiveMatchHub";
import CricketLoader from "@/components/CricketLoader";
import { CricketPage } from "@/components/cricket-shell";

function LiveHubFallback() {
  return (
    <CricketPage>
      <CricketLoader block size="lg" label="Loading live…" />
    </CricketPage>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<LiveHubFallback />}>
      <LiveMatchHub />
    </Suspense>
  );
}
