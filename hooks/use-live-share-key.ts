"use client";

import { useSearchParams } from "next/navigation";
import { LIVE_SHARE_QUERY_PARAM } from "@/lib/live-share-constants";

/** Share key from the current URL (`?k=`), used by OBS / public spectators. */
export function useLiveShareKeyFromUrl(): string | null {
  const searchParams = useSearchParams();
  const key = searchParams.get(LIVE_SHARE_QUERY_PARAM)?.trim();
  return key || null;
}
