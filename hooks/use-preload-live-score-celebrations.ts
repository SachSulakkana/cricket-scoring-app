"use client";

import { useEffect } from "react";
import {
  LIVE_SCORE_CELEBRATION_KINDS,
  LIVE_SCORE_CELEBRATION_SRC,
} from "@/lib/live-score-celebration";

/** Warm the browser cache so 4/6/W GIFs play immediately on the next ball. */
export function usePreloadLiveScoreCelebrations() {
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    for (const kind of LIVE_SCORE_CELEBRATION_KINDS) {
      const img = new Image();
      img.decoding = "async";
      img.src = LIVE_SCORE_CELEBRATION_SRC[kind];
      images.push(img);
    }
    return () => {
      for (const img of images) {
        img.src = "";
      }
    };
  }, []);
}
