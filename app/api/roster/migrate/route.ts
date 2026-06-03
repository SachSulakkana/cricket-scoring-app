import { NextResponse } from "next/server";
import {
  sqliteIsLegacyMigrated,
  sqliteMigrateFromLegacy,
} from "@/lib/sqlite-db";
import type { Player, Team } from "@/lib/cricket-types";
import type { DbTournament } from "@/lib/sqlite-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (sqliteIsLegacyMigrated()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = (await request.json()) as {
      players?: Player[];
      teams?: Team[];
      tournaments?: DbTournament[];
    };

    sqliteMigrateFromLegacy({
      players: body.players ?? [],
      teams: body.teams ?? [],
      tournaments: body.tournaments ?? [],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/roster/migrate failed", error);
    return NextResponse.json(
      { error: "Failed to migrate data" },
      { status: 500 }
    );
  }
}
