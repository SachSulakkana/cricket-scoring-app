"use client";

import { Suspense } from "react";
import Link from "next/link";
import LiveScoreOverlay from "@/components/LiveScoreOverlay";
import CricketLoader from "@/components/CricketLoader";
import { routes } from "@/lib/app-routes";

function LiveEmbedPreviewFallback() {
  return (
    <div className="live-embed-preview">
      <div className="live-embed-preview__stage">
        <CricketLoader size="sm" label="Loading preview…" />
      </div>
    </div>
  );
}

export default function LiveEmbedPreviewPage() {
  return (
    <Suspense fallback={<LiveEmbedPreviewFallback />}>
      <div className="live-embed-preview">
        <div className="live-embed-preview__stage">
          <p className="live-embed-preview__eyebrow">Stream preview</p>
          <p className="live-embed-preview__title">Your video appears here</p>
          <p className="live-embed-preview__text">
            The score bar below is pinned to the bottom, same as in OBS.
          </p>
          <Link href={routes.live} className="live-embed-preview__back">
            Back to live hub
          </Link>
        </div>
        <LiveScoreOverlay preview />
      </div>
    </Suspense>
  );
}
