import "server-only";

import { randomBytes } from "crypto";
import {
  getUserLiveShareKey,
  setUserLiveShareKey,
  getUidForLiveShareKey,
  setLiveShareKeyMapping,
  deleteLiveShareKeyMapping,
} from "@/lib/db";
import { LIVE_SHARE_QUERY_PARAM } from "@/lib/live-share-constants";

export { LIVE_SHARE_QUERY_PARAM };

function newShareKey(): string {
  return randomBytes(24).toString("base64url");
}

/** Ensures the user has a stable live-share key for OBS / spectator links. */
export async function ensureLiveShareKey(uid: string): Promise<string> {
  const existing = await getUserLiveShareKey(uid);
  if (existing) {
    const mappedUid = await getUidForLiveShareKey(existing);
    if (mappedUid === uid) {
      return existing;
    }
  }

  const key = newShareKey();
  await setUserLiveShareKey(uid, key);
  await setLiveShareKeyMapping(key, uid);
  if (existing) {
    await deleteLiveShareKeyMapping(existing);
  }
  return key;
}

export async function resolveUidFromLiveShareKey(key: string): Promise<string | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;
  return getUidForLiveShareKey(trimmed);
}
