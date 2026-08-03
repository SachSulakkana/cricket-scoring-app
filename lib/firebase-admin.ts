import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

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

function resolveAdminEnv() {
  const projectId = normalizeEnvValue(
    process.env.FIREBASE_PROJECT_ID?.trim() ||
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      ""
  );
  const clientEmail = normalizeEnvValue(
    process.env.FIREBASE_CLIENT_EMAIL?.trim() ||
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
      ""
  );
  const privateKeyRaw =
    process.env.FIREBASE_PRIVATE_KEY?.trim() ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    "";

  if (!projectId) requireEnv("FIREBASE_PROJECT_ID");
  if (!clientEmail) requireEnv("FIREBASE_CLIENT_EMAIL");
  if (!privateKeyRaw) requireEnv("FIREBASE_PRIVATE_KEY");

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKeyRaw),
  };
}

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const { projectId, clientEmail, privateKey } = resolveAdminEnv();

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

export function getAdminAuth(): Auth {
  return getFirebaseAdminAuth(getAdminApp());
}
