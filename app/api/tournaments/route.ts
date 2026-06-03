import { NextResponse } from "next/server";
import { sqliteSaveTournament } from "@/lib/sqlite-db";
import type { DbTournament } from "@/lib/sqlite-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const tournament = (await request.json()) as DbTournament;
    sqliteSaveTournament(tournament);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/tournaments failed", error);
    return NextResponse.json(
      { error: "Failed to save tournament" },
      { status: 500 }
    );
  }
}
