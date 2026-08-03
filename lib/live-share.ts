import "server-only";

import { randomBytes } from "crypto";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { LIVE_SHARE_QUERY_PARAM } from "@/lib/live-share-constants";

export { LIVE_SHARE_QUERY_PARAM };

const LIVE_SHARE_KEYS = "live_share_keys";

function newShareKey(): string {
  return randomBytes(24).toString("base64url");
}

/** Ensures the user has a stable live-share key for OBS / spectator links. */
export async function ensureLiveShareKey(uid: string): Promise<string> {
  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const existing =
    typeof userSnap.data()?.liveShareKey === "string"
      ? (userSnap.data()!.liveShareKey as string).trim()
      : "";

  if (existing) {
    const mapSnap = await db.collection(LIVE_SHARE_KEYS).doc(existing).get();
    if (mapSnap.exists && mapSnap.data()?.uid === uid) {
      return existing;
    }
  }

  const key = newShareKey();
  const batch = db.batch();
  batch.set(
    userRef,
    {
      liveShareKey: key,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  batch.set(db.collection(LIVE_SHARE_KEYS).doc(key), {
    uid,
    createdAt: new Date().toISOString(),
  });
  if (existing) {
    batch.delete(db.collection(LIVE_SHARE_KEYS).doc(existing));
  }
  await batch.commit();
  return key;
}

export async function resolveUidFromLiveShareKey(
  key: string
): Promise<string | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;
  const snap = await getAdminFirestore()
    .collection(LIVE_SHARE_KEYS)
    .doc(trimmed)
    .get();
  if (!snap.exists) return null;
  const uid = snap.data()?.uid;
  return typeof uid === "string" && uid ? uid : null;
}
