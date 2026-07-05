import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { rosterMigrateSchema } from "@/lib/api-schemas";
import { isLegacyMigrated, migrateFromLegacy } from "@/lib/firestore-db";
import type { DbTournament } from "@/lib/firestore-db";
import type { Player, Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    if (await isLegacyMigrated()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const parsed = await parseJsonBody(request, rosterMigrateSchema);
    if ("error" in parsed) return parsed.error;

    const players = parsed.data.players ?? [];
    const teams = parsed.data.teams ?? [];
    const tournaments = parsed.data.tournaments ?? [];
    if (players.length === 0 && teams.length === 0 && tournaments.length === 0) {
      return NextResponse.json(
        { error: "Migration payload cannot be empty" },
        { status: 400 }
      );
    }

    await migrateFromLegacy({
      players: players as Player[],
      teams: teams as Team[],
      tournaments: tournaments as DbTournament[],
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
