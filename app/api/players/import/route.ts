import { NextResponse } from "next/server";
import { sqliteBulkImportPlayers } from "@/lib/sqlite-db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { players?: Player[] };
    const players = Array.isArray(body.players) ? body.players : [];
    const imported = sqliteBulkImportPlayers(players);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/players/import failed", error);
    return NextResponse.json(
      { error: "Failed to import players" },
      { status: 500 }
    );
  }
}
