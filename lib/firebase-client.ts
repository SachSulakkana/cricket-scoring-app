import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function requireConfigured(): void {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  requireConfigured();
  if (appInstance) return appInstance;
  if (getApps().length > 0) {
    appInstance = getApps()[0]!;
    return appInstance;
  }
  appInstance = initializeApp(firebaseConfig);
  return appInstance;
}

export function getClientAuth(): Auth {
  requireConfigured();
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getClientDb(): Firestore {
  requireConfigured();
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

export const googleProvider = new GoogleAuthProvider();

function preferGooglePopup(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    window.location.protocol === "http:" ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getClientAuth(), email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getClientAuth(), email, password);
}

/**
 * Localhost/HTTP: popup (redirect is flaky across firebaseapp.com ↔ localhost).
 * HTTPS: full-page redirect (popups are often blocked).
 * Returns null when a redirect was started; completion via getRedirectResult.
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const auth = getClientAuth();
  if (preferGooglePopup()) {
    console.log("[auth] Google sign-in: popup");
    return signInWithPopup(auth, googleProvider);
  }
  console.log("[auth] Google sign-in: redirect");
  await signInWithRedirect(auth, googleProvider);
  return null;
}

export async function signOut() {
  return firebaseSignOut(getClientAuth());
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getClientAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export type { User };
