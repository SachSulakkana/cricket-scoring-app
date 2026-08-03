import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { ensureLiveShareKey } from "@/lib/live-share";

export const runtime = "nodejs";

/** Returns (and creates if needed) the caller's live share key for OBS links. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const key = await ensureLiveShareKey(user.uid);
    return NextResponse.json({ key });
  } catch (error) {
    console.error("GET /api/live/share failed", error);
    return NextResponse.json(
      { error: "Failed to load live share key" },
      { status: 500 }
    );
  }
}
