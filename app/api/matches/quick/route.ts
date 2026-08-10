import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { quickMatchPostSchema } from "@/lib/api-schemas";
import { listQuickMatches, saveQuickMatch } from "@/lib/db";
import type { MatchState } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const matches = await listQuickMatches(user.uid);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("GET /api/matches/quick failed", error);
    return NextResponse.json(
      { error: "Failed to load quick match history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, quickMatchPostSchema);
    if ("error" in parsed) return parsed.error;

    const matchState = parsed.data.matchState as unknown as MatchState;
    if (!matchState?.team1?.name || !matchState?.team2?.name) {
      return NextResponse.json(
        { error: "Valid matchState required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const label =
      parsed.data.label?.trim() ||
      `${matchState.team1.name} vs ${matchState.team2.name}`;
    const createdAt = new Date().toISOString();
    await saveQuickMatch(
      user.uid,
      id,
      label,
      JSON.stringify(matchState),
      createdAt
    );
    return NextResponse.json({ ok: true, id, label });
  } catch (error) {
    console.error("POST /api/matches/quick failed", error);
    return NextResponse.json(
      { error: "Failed to save quick match" },
      { status: 500 }
    );
  }
}
