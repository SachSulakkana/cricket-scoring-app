/**
 * One-shot wipe of legacy GLOBAL Firestore collections.
 * New data lives under users/{uid}/... — do not run this against user trees.
 *
 * Usage (requires Admin env vars):
 *   npx tsx scripts/wipe-legacy-collections.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const LEGACY = [
  "players",
  "teams",
  "tournaments",
  "live_match_draft",
  "saved_matches",
  "meta",
] as const;

function env(name: string): string {
  const value =
    process.env[name] ||
    process.env[name.replace("FIREBASE_", "FIREBASE_ADMIN_")] ||
    "";
  if (!value) throw new Error(`Missing ${name}`);
  return value.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

async function clearCollection(name: string) {
  const db = getFirestore();
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`${name}: empty`);
    return;
  }

  if (name === "tournaments") {
    for (const doc of snap.docs) {
      const fixtures = await doc.ref.collection("fixtures").get();
      for (let i = 0; i < fixtures.docs.length; i += 400) {
        const batch = db.batch();
        for (const fx of fixtures.docs.slice(i, i + 400)) batch.delete(fx.ref);
        await batch.commit();
      }
    }
  }

  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 400)) batch.delete(doc.ref);
    await batch.commit();
  }
  console.log(`${name}: deleted ${snap.size} docs`);
}

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: env("FIREBASE_PROJECT_ID"),
        clientEmail: env("FIREBASE_CLIENT_EMAIL"),
        privateKey: env("FIREBASE_PRIVATE_KEY"),
      }),
    });
  }

  for (const name of LEGACY) {
    await clearCollection(name);
  }
  console.log("Legacy global collections wiped.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
