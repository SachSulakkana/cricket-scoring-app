import "server-only";

import { NextResponse } from "next/server";

const API_SECRET = process.env.CRICKET_API_SECRET?.trim() ?? "";

export function isApiAuthRequired(): boolean {
  return API_SECRET.length > 0;
}

export function verifyApiAuth(request: Request): NextResponse | null {
  if (!isApiAuthRequired()) return null;

  const authHeader = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : apiKey?.trim();

  if (token !== API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireMutationAuth(request: Request): NextResponse | null {
  return verifyApiAuth(request);
}
