import { NextResponse } from "next/server";
import { sqliteBulkImportTeams } from "@/lib/sqlite-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { teams?: Team[] };
    const teams = Array.isArray(body.teams) ? body.teams : [];
    const imported = sqliteBulkImportTeams(teams);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/teams/import failed", error);
    return NextResponse.json(
      { error: "Failed to import teams" },
      { status: 500 }
    );
  }
}
