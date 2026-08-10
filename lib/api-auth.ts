import "server-only";

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session-constants";
import { getAdminAuth } from "@/lib/firebase-admin";
import { upsertUserProfile } from "@/lib/db";
import { AUTH_DISABLED, LOCAL_USER } from "@/lib/auth-mode";

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

/** Ensures the user's profile record exists in the active data backend. */
export async function ensureUserProfile(user: AuthUser): Promise<void> {
  await upsertUserProfile(user.uid, user.email);
}

export async function verifyRequestUser(
  request: Request
): Promise<AuthUser | null> {
  if (AUTH_DISABLED) return LOCAL_USER;

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
