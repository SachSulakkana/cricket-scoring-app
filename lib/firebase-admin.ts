import "server-only";

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeEnvValue(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/,\s*$/, "").trim();
}

function normalizePrivateKey(raw: string): string {
  return normalizeEnvValue(raw).replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const projectId = normalizeEnvValue(requireEnv("FIREBASE_PROJECT_ID"));
  const clientEmail = normalizeEnvValue(requireEnv("FIREBASE_CLIENT_EMAIL"));
  const privateKey = normalizePrivateKey(requireEnv("FIREBASE_PRIVATE_KEY"));

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return adminApp;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
