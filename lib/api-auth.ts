import "server-only";

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session-constants";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

export type AuthUser = {
  uid: string;
  email: string | null;
};

function bearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

function sessionCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return decodeURIComponent(part.slice(SESSION_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

/** Ensures users/{uid} exists so the collection is visible in Firestore console. */
export async function ensureUserProfile(user: AuthUser): Promise<void> {
  const ref = getAdminFirestore().collection("users").doc(user.uid);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    await ref.set({
      uid: user.uid,
      email: user.email,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }
  await ref.set(
    {
      email: user.email,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function verifyRequestUser(
  request: Request
): Promise<AuthUser | null> {
  const auth = getAdminAuth();
  const token = bearerToken(request);
  if (token) {
    try {
      const decoded = await auth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      return null;
    }
  }

  const session = sessionCookieFromRequest(request);
  if (!session) return null;
  try {
    const decoded = await auth.verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

export async function requireUser(
  request: Request
): Promise<AuthUser | NextResponse> {
  const user = await verifyRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isAuthError(
  value: AuthUser | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
