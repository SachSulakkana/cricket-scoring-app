import { NextResponse } from "next/server";
import { listQuickMatches, saveQuickMatch } from "@/lib/firestore-db";
import type { MatchState } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const matches = await listQuickMatches();
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
  try {
    const body = (await request.json()) as {
      matchState?: MatchState;
      label?: string;
    };
    if (!body.matchState?.team1?.name || !body.matchState?.team2?.name) {
      return NextResponse.json(
        { error: "Valid matchState required" },
        { status: 400 }
      );
    }
    const id = `quick-${Date.now()}`;
    const label =
      body.label?.trim() ||
      `${body.matchState.team1.name} vs ${body.matchState.team2.name}`;
    const createdAt = new Date().toISOString();
    await saveQuickMatch(
      id,
      label,
      JSON.stringify(body.matchState),
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
